from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Alert
from apps.students.models import Student


class AlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    enrollment = serializers.CharField(source='student.enrollment_number', read_only=True)
    department_name = serializers.CharField(source='student.department.name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'student', 'student_name', 'enrollment', 'department_name',
            'faculty', 'alert_type', 'alert_type_display',
            'risk_level', 'risk_level_display', 'message', 'suggestions',
            'is_read', 'is_resolved', 'resolved_at', 'created_at'
        ]


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Alert.objects.all()

        if user.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                qs = qs.filter(student=student)
            except Student.DoesNotExist:
                return Alert.objects.none()
        elif user.role == 'FACULTY':
            qs = qs.filter(faculty=user) | qs.filter(student__department=user.department)
        elif user.role == 'HOD':
            qs = qs.filter(student__department=user.department)

        alert_type = self.request.query_params.get('type')
        risk = self.request.query_params.get('risk')
        resolved = self.request.query_params.get('resolved')

        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        if risk:
            qs = qs.filter(risk_level=risk)
        if resolved is not None:
            qs = qs.filter(is_resolved=resolved.lower() == 'true')

        return qs.select_related('student__user', 'student__department', 'faculty')


class AlertDetailView(generics.RetrieveUpdateAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer


class MarkAlertReadView(APIView):
    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
            alert.is_read = True
            alert.save()
            return Response({'message': 'Alert marked as read.'})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=status.HTTP_404_NOT_FOUND)


class ResolveAlertView(APIView):
    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
            alert.is_resolved = True
            alert.resolved_by = request.user
            alert.resolved_at = timezone.now()
            alert.save()
            return Response({'message': 'Alert resolved.'})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=status.HTTP_404_NOT_FOUND)


class RunAIEvaluationView(APIView):
    """Manually trigger AI evaluation (Admin only)"""
    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        from .ai_engine import run_full_ai_evaluation
        updated = run_full_ai_evaluation()
        return Response({'message': f'AI evaluation complete. {updated} students updated.'})


class AlertStatsView(APIView):
    def get(self, request):
        total = Alert.objects.filter(is_resolved=False).count()
        high = Alert.objects.filter(risk_level='HIGH', is_resolved=False).count()
        medium = Alert.objects.filter(risk_level='MEDIUM', is_resolved=False).count()
        low = Alert.objects.filter(risk_level='LOW', is_resolved=False).count()
        return Response({'total': total, 'high': high, 'medium': medium, 'low': low})


# URLs
from django.urls import path

urlpatterns = [
    path('', AlertListView.as_view(), name='alert-list'),
    path('<int:pk>/', AlertDetailView.as_view(), name='alert-detail'),
    path('<int:pk>/read/', MarkAlertReadView.as_view(), name='mark-read'),
    path('<int:pk>/resolve/', ResolveAlertView.as_view(), name='resolve-alert'),
    path('run-ai/', RunAIEvaluationView.as_view(), name='run-ai'),
    path('stats/', AlertStatsView.as_view(), name='alert-stats'),
]
