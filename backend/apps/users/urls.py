from django.urls import path
from .views import (
    UserListCreateView, UserDetailView, MeView,
    ChangePasswordView, DepartmentListCreateView,
    DepartmentDetailView, DashboardStatsView
)

urlpatterns = [
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('departments/', DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
