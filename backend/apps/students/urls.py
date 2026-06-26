from django.urls import path
from .views import (
    StudentListCreateView, StudentDetailView, MyStudentProfileView,
    CourseListCreateView, CourseDetailView, AcademicYearListCreateView,
    WeakStudentsView
)

urlpatterns = [
    path('', StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
    path('me/', MyStudentProfileView.as_view(), name='my-student-profile'),
    path('weak/', WeakStudentsView.as_view(), name='weak-students'),
    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('academic-years/', AcademicYearListCreateView.as_view(), name='academic-year-list'),
]
