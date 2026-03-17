from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student, Course, AcademicYear
from .serializers import StudentSerializer, StudentCreateSerializer, CourseSerializer, AcademicYearSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.select_related('user', 'department', 'academic_year').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateSerializer
        return StudentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        semester = self.request.query_params.get('semester')
        risk = self.request.query_params.get('risk_level')
        search = self.request.query_params.get('search')
        if dept:
            qs = qs.filter(department_id=dept)
        if semester:
            qs = qs.filter(semester=semester)
        if risk:
            qs = qs.filter(ai_risk_level=risk)
        if search:
            qs = qs.filter(
                user__first_name__icontains=search
            ) | qs.filter(
                user__last_name__icontains=search
            ) | qs.filter(
                enrollment_number__icontains=search
            )
        return qs


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.select_related('user', 'department').all()
    serializer_class = StudentSerializer


class MyStudentProfileView(APIView):
    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            return Response(StudentSerializer(student).data)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related('department').all()
    serializer_class = CourseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        semester = self.request.query_params.get('semester')
        if dept:
            qs = qs.filter(department_id=dept)
        if semester:
            qs = qs.filter(semester=semester)
        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class AcademicYearListCreateView(generics.ListCreateAPIView):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer


class WeakStudentsView(APIView):
    """Returns AI-identified weak students"""
    def get(self, request):
        students = Student.objects.filter(
            ai_risk_level__in=['MEDIUM', 'HIGH'],
            is_active=True
        ).select_related('user', 'department')
        return Response(StudentSerializer(students, many=True).data)
