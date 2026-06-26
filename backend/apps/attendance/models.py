from django.db import models
from apps.students.models import Student, Course
from apps.users.models import User


class AttendanceSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    semester = models.IntegerField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code} - {self.date}"

    class Meta:
        ordering = ['-date', '-start_time']
        unique_together = ['course', 'date', 'start_time']


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]

    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ABSENT')
    remarks = models.CharField(max_length=200, blank=True)
    marked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.enrollment_number} - {self.session.date} - {self.status}"

    class Meta:
        ordering = ['-session__date']
        unique_together = ['session', 'student']


class AttendanceSummary(models.Model):
    """Cached summary for performance"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    total_classes = models.IntegerField(default=0)
    present_count = models.IntegerField(default=0)
    absent_count = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']
