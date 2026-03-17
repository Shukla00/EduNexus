from django.urls import path
from .views import (
    MarkListCreateView, MarkDetailView, BulkMarkEntryView,
    StudentMarksView, CourseMarksAnalyticsView, ExamTypeListCreateView
)

urlpatterns = [
    path('', MarkListCreateView.as_view(), name='mark-list'),
    path('<int:pk>/', MarkDetailView.as_view(), name='mark-detail'),
    path('bulk/', BulkMarkEntryView.as_view(), name='bulk-marks'),
    path('my/', StudentMarksView.as_view(), name='my-marks'),
    path('student/<int:student_id>/', StudentMarksView.as_view(), name='student-marks'),
    path('analytics/<int:course_id>/', CourseMarksAnalyticsView.as_view(), name='marks-analytics'),
    path('exam-types/', ExamTypeListCreateView.as_view(), name='exam-types'),
]
