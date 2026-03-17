from rest_framework import serializers, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import TimetableEntry, TimeSlot, FacultyLectureReminder


class TimeSlotSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_display', read_only=True)

    class Meta:
        model = TimeSlot
        fields = ['id', 'day', 'day_display', 'start_time', 'end_time', 'slot_number']


class TimetableEntrySerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    time_slot_detail = TimeSlotSerializer(source='time_slot', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = TimetableEntry
        fields = [
            'id', 'course', 'course_name', 'course_code',
            'faculty', 'faculty_name', 'time_slot', 'time_slot_detail',
            'room', 'semester', 'department', 'department_name',
            'academic_year', 'is_active'
        ]


class TimetableListCreateView(generics.ListCreateAPIView):
    queryset = TimetableEntry.objects.select_related('course', 'faculty', 'time_slot', 'department').filter(is_active=True)
    serializer_class = TimetableEntrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        semester = self.request.query_params.get('semester')
        faculty = self.request.query_params.get('faculty')
        day = self.request.query_params.get('day')
        if dept:
            qs = qs.filter(department_id=dept)
        if semester:
            qs = qs.filter(semester=semester)
        if faculty:
            qs = qs.filter(faculty_id=faculty)
        if day:
            qs = qs.filter(time_slot__day=day)
        return qs


class TimetableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TimetableEntry.objects.all()
    serializer_class = TimetableEntrySerializer


class TimeSlotListCreateView(generics.ListCreateAPIView):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer


class FacultyTimetableView(APIView):
    def get(self, request):
        entries = TimetableEntry.objects.filter(
            faculty=request.user, is_active=True
        ).select_related('course', 'time_slot', 'department')
        return Response(TimetableEntrySerializer(entries, many=True).data)


# URLs
from django.urls import path

urlpatterns = [
    path('', TimetableListCreateView.as_view(), name='timetable-list'),
    path('<int:pk>/', TimetableDetailView.as_view(), name='timetable-detail'),
    path('slots/', TimeSlotListCreateView.as_view(), name='timeslot-list'),
    path('my/', FacultyTimetableView.as_view(), name='my-timetable'),
]
