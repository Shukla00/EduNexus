from django.db import models
from apps.students.models import Student
from apps.users.models import User


class Alert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('ATTENDANCE', 'Attendance Alert'),
        ('MARKS', 'Marks Alert'),
        ('COMPREHENSIVE', 'Comprehensive Alert'),
        ('LECTURE', 'Lecture Reminder'),
        ('GENERAL', 'General'),
    ]
    RISK_LEVEL_CHOICES = [
        ('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lecture_alerts', null=True, blank=True)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default='MEDIUM')
    message = models.TextField()
    suggestions = models.JSONField(default=list)
    is_read = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.student.enrollment_number if self.student else (self.faculty.email if self.faculty else 'N/A')
        return f"{self.alert_type} - {target} - {self.risk_level}"

    class Meta:
        ordering = ['-created_at']
