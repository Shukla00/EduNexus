from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count
from datetime import datetime, timedelta
from .models import Mark, ExamType, GradeCard, ExamSchedule
from apps.students.models import Student, Course
from .serializers import ExamScheduleSerializer
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = ['id', 'name', 'weightage', 'max_marks', 'order']


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    enrollment = serializers.CharField(source='student.enrollment_number', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    percentage = serializers.ReadOnlyField()
    grade = serializers.ReadOnlyField()
    entered_by_name = serializers.CharField(source='entered_by.get_full_name', read_only=True)

    class Meta:
        model = Mark
        fields = [
            'id', 'student', 'student_name', 'enrollment',
            'course', 'course_name', 'course_code',
            'exam_type', 'exam_type_name',
            'marks_obtained', 'max_marks', 'percentage', 'grade',
            'remarks', 'entered_by', 'entered_by_name', 'entered_at', 'updated_at'
        ]


class BulkMarkSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    exam_type = serializers.IntegerField()
    marks = serializers.ListField(child=serializers.DictField())


class GradeCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)

    class Meta:
        model = GradeCard
        fields = ['id', 'student', 'student_name', 'semester', 'academic_year', 'sgpa', 'cgpa', 'total_credits', 'credits_earned', 'generated_at']


class ExamScheduleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    end_time = serializers.ReadOnlyField()

    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'name', 'exam_type', 'exam_type_name', 'course', 'course_name',
            'course_code', 'department', 'department_name', 'semester', 'exam_date',
            'start_time', 'end_time', 'duration_minutes', 'room', 'max_marks',
            'status', 'instructions', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by']

    def validate(self, attrs):
        instance = self.instance
        course = attrs.get('course', getattr(instance, 'course', None))
        department = attrs.get('department', getattr(instance, 'department', None))
        semester = attrs.get('semester', getattr(instance, 'semester', None))
        exam_date = attrs.get('exam_date', getattr(instance, 'exam_date', None))
        start_time = attrs.get('start_time', getattr(instance, 'start_time', None))
        duration_minutes = attrs.get('duration_minutes', getattr(instance, 'duration_minutes', 60))
        room = attrs.get('room', getattr(instance, 'room', ''))

        if course and department and course.department_id != department.id:
            raise serializers.ValidationError({'course': 'Selected subject must belong to the selected department.'})
        if course and semester and course.semester != int(semester):
            raise serializers.ValidationError({'course': 'Selected subject must belong to the selected semester.'})
        if duration_minutes <= 0:
            raise serializers.ValidationError({'duration_minutes': 'Duration must be greater than 0.'})

        if exam_date and start_time:
            start_dt = datetime.combine(exam_date, start_time)
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            schedules = ExamSchedule.objects.filter(exam_date=exam_date).exclude(status='CANCELLED')
            if instance:
                schedules = schedules.exclude(pk=instance.pk)

            for schedule in schedules:
                existing_start = datetime.combine(schedule.exam_date, schedule.start_time)
                existing_end = existing_start + timedelta(minutes=schedule.duration_minutes)
                overlaps = start_dt < existing_end and end_dt > existing_start
                if not overlaps:
                    continue
                same_room = room and schedule.room.lower() == room.lower()
                same_batch = (
                    department and schedule.department_id == department.id and
                    semester and schedule.semester == int(semester)
                )
                if same_room:
                    raise serializers.ValidationError({'room': 'Another exam is already scheduled in this room during that time.'})
                if same_batch:
                    raise serializers.ValidationError({'exam_date': 'This department and semester already has an exam during that time.'})

        return attrs


class MarkListCreateView(generics.ListCreateAPIView):
    queryset = Mark.objects.select_related('student', 'course', 'exam_type').all()
    serializer_class = MarkSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student = self.request.query_params.get('student')
        course = self.request.query_params.get('course')
        exam_type = self.request.query_params.get('exam_type')
        if student:
            qs = qs.filter(student_id=student)
        if course:
            qs = qs.filter(course_id=course)
        if exam_type:
            qs = qs.filter(exam_type_id=exam_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(entered_by=self.request.user)


class MarkDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer


class BulkMarkEntryView(APIView):
    def post(self, request):
        serializer = BulkMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        course_id = data['course']
        exam_type_id = data['exam_type']
        marks_list = data['marks']

        saved = []
        errors = []
        for item in marks_list:
            try:
                mark, created = Mark.objects.update_or_create(
                    student_id=item['student'],
                    course_id=course_id,
                    exam_type_id=exam_type_id,
                    defaults={
                        'marks_obtained': item['marks_obtained'],
                        'max_marks': item.get('max_marks', 100),
                        'remarks': item.get('remarks', ''),
                        'entered_by': request.user,
                    }
                )
                saved.append(mark.id)
            except Exception as e:
                errors.append({'student': item.get('student'), 'error': str(e)})

        # Run AI check after marks entry
        from apps.alerts.ai_engine import run_marks_check
        run_marks_check(course_id)

        return Response({
            'saved': len(saved),
            'errors': errors,
            'message': f'{len(saved)} marks saved successfully.'
        })


class StudentMarksView(APIView):
    def get(self, request, student_id=None):
        if student_id:
            marks = Mark.objects.filter(student_id=student_id).select_related('course', 'exam_type')
        else:
            try:
                student = Student.objects.get(user=request.user)
                marks = Mark.objects.filter(student=student).select_related('course', 'exam_type')
            except Student.DoesNotExist:
                return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(MarkSerializer(marks, many=True).data)


class CourseMarksAnalyticsView(APIView):
    def get(self, request, course_id):
        marks = Mark.objects.filter(course_id=course_id)
        if not marks.exists():
            return Response({'message': 'No marks found.'})

        stats = marks.aggregate(
            avg=Avg('marks_obtained'),
            highest=Max('marks_obtained'),
            lowest=Min('marks_obtained'),
            total=Count('id')
        )

        grade_dist = {'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
        for m in marks:
            grade_dist[m.grade] = grade_dist.get(m.grade, 0) + 1

        return Response({
            'statistics': stats,
            'grade_distribution': grade_dist,
            'pass_percentage': round((marks.filter(marks_obtained__gte=40).count() / marks.count()) * 100, 2)
        })


class ExamTypeListCreateView(generics.ListCreateAPIView):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer


class ExamScheduleListCreateView(generics.ListCreateAPIView):
    queryset = ExamSchedule.objects.select_related(
        'course',
        'department',
        'exam_type',
        'created_by'
    ).all()

    serializer_class = ExamScheduleSerializer

    def get_queryset(self):

        now = timezone.localtime()

        exams = ExamSchedule.objects.filter(
            status='SCHEDULED'
        )

        for exam in exams:

            exam_end = datetime.combine(
                exam.exam_date,
                exam.end_time
            )

            exam_end = timezone.make_aware(exam_end)

            if exam_end <= now:

                exam.status = 'COMPLETED'

                exam.save(
                    update_fields=['status']
                )

        qs = super().get_queryset()

        department = self.request.query_params.get('department')
        semester = self.request.query_params.get('semester')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if department:
            qs = qs.filter(department_id=department)

        if semester:
            qs = qs.filter(semester=semester)

        if status_filter:
            qs = qs.filter(status=status_filter)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(course__name__icontains=search) |
                Q(course__code__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user
        )
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class ExamScheduleDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = ExamSchedule.objects.all()
    serializer_class = ExamScheduleSerializer

class StudentMarksPerformanceView(APIView):

    def get(self, request):

        try:
            student = Student.objects.get(user=request.user)

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        marks = (
            Mark.objects
            .filter(student=student)
            .values(
                'course__code',
                'exam_type__name'
            )
            .annotate(
                marks=Avg('marks_obtained')
            )
            .order_by(
                'course__code',
                'exam_type__name'
            )
        )

        data = []

        for mark in marks:
            data.append({
                'course': mark.get('course__code'),
                'exam': mark.get('exam_type__name'),
                'marks': round(mark.get('marks', 0), 2)
            })

        return Response(data)