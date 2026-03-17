from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import AttendanceSession, AttendanceRecord, AttendanceSummary
from apps.students.models import Student, Course


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    enrollment = serializers.CharField(source='student.enrollment_number', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'student', 'student_name', 'enrollment', 'status', 'remarks', 'marked_at']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)
    attendance_rate = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_name', 'course_code', 'faculty', 'faculty_name',
            'date', 'start_time', 'end_time', 'semester', 'notes',
            'records', 'attendance_rate', 'created_at'
        ]

    def get_attendance_rate(self, obj):
        records = obj.records.all()
        if not records:
            return 0
        present = records.filter(status='PRESENT').count()
        return round((present / records.count()) * 100, 1)


class BulkAttendanceSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    records = serializers.ListField(
        child=serializers.DictField()
    )


class StudentAttendanceSummarySerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = AttendanceSummary
        fields = [
            'id', 'course', 'course_name', 'course_code',
            'total_classes', 'present_count', 'absent_count',
            'late_count', 'percentage', 'last_updated'
        ]


class AttendanceSessionListCreateView(generics.ListCreateAPIView):
    queryset = AttendanceSession.objects.select_related('course', 'faculty').all()
    serializer_class = AttendanceSessionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course = self.request.query_params.get('course')
        date = self.request.query_params.get('date')
        faculty = self.request.query_params.get('faculty')
        if course:
            qs = qs.filter(course_id=course)
        if date:
            qs = qs.filter(date=date)
        if faculty:
            qs = qs.filter(faculty_id=faculty)
        return qs


class AttendanceSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer


class MarkAttendanceView(APIView):
    """Mark attendance for all students in a session"""
    def post(self, request):
        session_id = request.data.get('session_id')
        records = request.data.get('records', [])

        try:
            session = AttendanceSession.objects.get(id=session_id)
        except AttendanceSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        created_records = []
        for record_data in records:
            student_id = record_data.get('student')
            att_status = record_data.get('status', 'ABSENT')
            remarks = record_data.get('remarks', '')

            obj, created = AttendanceRecord.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={'status': att_status, 'remarks': remarks}
            )
            created_records.append(obj)

        # Update attendance summaries
        self._update_summaries(session, records)

        # Trigger AI check
        self._check_ai_alerts(session)

        return Response({'message': f'{len(created_records)} attendance records saved.'})

    def _update_summaries(self, session, records):
        for record_data in records:
            student_id = record_data.get('student')
            try:
                student = Student.objects.get(id=student_id)
                summary, _ = AttendanceSummary.objects.get_or_create(
                    student=student, course=session.course
                )
                all_records = AttendanceRecord.objects.filter(
                    student=student, session__course=session.course
                )
                total = all_records.count()
                present = all_records.filter(status='PRESENT').count()
                summary.total_classes = total
                summary.present_count = present
                summary.absent_count = all_records.filter(status='ABSENT').count()
                summary.late_count = all_records.filter(status='LATE').count()
                summary.percentage = round((present / total * 100), 2) if total > 0 else 0
                summary.save()
            except Student.DoesNotExist:
                pass

    def _check_ai_alerts(self, session):
        from apps.alerts.ai_engine import run_attendance_check
        run_attendance_check(session.course)


class StudentAttendanceSummaryView(APIView):
    def get(self, request, student_id=None):
        if student_id:
            summaries = AttendanceSummary.objects.filter(student_id=student_id).select_related('course')
        else:
            try:
                student = Student.objects.get(user=request.user)
                summaries = AttendanceSummary.objects.filter(student=student).select_related('course')
            except Student.DoesNotExist:
                return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(StudentAttendanceSummarySerializer(summaries, many=True).data)


class AttendanceStatsView(APIView):
    def get(self, request):
        from django.db.models import Avg
        dept = request.query_params.get('department')
        course = request.query_params.get('course')
        qs = AttendanceSummary.objects.all()
        if dept:
            qs = qs.filter(student__department_id=dept)
        if course:
            qs = qs.filter(course_id=course)

        avg = qs.aggregate(avg_pct=Avg('percentage'))
        low_attendance = qs.filter(percentage__lt=75).count()

        return Response({
            'average_attendance': round(avg.get('avg_pct') or 0, 2),
            'low_attendance_count': low_attendance,
        })
