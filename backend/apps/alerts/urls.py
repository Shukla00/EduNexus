from django.urls import path
from .views import (
    AlertListView, AlertDetailView, MarkAlertReadView,
    ResolveAlertView, RunAIEvaluationView, AlertStatsView
)

urlpatterns = [
    path('', AlertListView.as_view(), name='alert-list'),
    path('<int:pk>/', AlertDetailView.as_view(), name='alert-detail'),
    path('<int:pk>/read/', MarkAlertReadView.as_view(), name='mark-read'),
    path('<int:pk>/resolve/', ResolveAlertView.as_view(), name='resolve-alert'),
    path('run-ai/', RunAIEvaluationView.as_view(), name='run-ai'),
    path('stats/', AlertStatsView.as_view(), name='alert-stats'),
]
