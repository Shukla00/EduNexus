from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count
from .models import Mark, ExamType, GradeCard
from apps.students.models import Student, Course


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
