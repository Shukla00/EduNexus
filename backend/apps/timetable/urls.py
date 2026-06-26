from django.urls import path
from .views import (
    TimetableListCreateView, TimetableDetailView,
    TimeSlotListCreateView, FacultyTimetableView
)

urlpatterns = [
    path('', TimetableListCreateView.as_view(), name='timetable-list'),
    path('<int:pk>/', TimetableDetailView.as_view(), name='timetable-detail'),
    path('slots/', TimeSlotListCreateView.as_view(), name='timeslot-list'),
    path('my/', FacultyTimetableView.as_view(), name='my-timetable'),
]
