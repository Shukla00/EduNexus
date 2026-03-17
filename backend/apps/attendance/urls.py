from django.urls import path
from .views import (
    AttendanceSessionListCreateView, AttendanceSessionDetailView,
    MarkAttendanceView, StudentAttendanceSummaryView, AttendanceStatsView
)

urlpatterns = [
    path('sessions/', AttendanceSessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', AttendanceSessionDetailView.as_view(), name='session-detail'),
    path('mark/', MarkAttendanceView.as_view(), name='mark-attendance'),
    path('summary/', StudentAttendanceSummaryView.as_view(), name='my-summary'),
    path('summary/<int:student_id>/', StudentAttendanceSummaryView.as_view(), name='student-summary'),
    path('stats/', AttendanceStatsView.as_view(), name='attendance-stats'),
]
