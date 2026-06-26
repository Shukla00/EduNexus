from django.db import models
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from apps.students.models import Student, Course
from apps.users.models import User, Department


class ExamType(models.Model):
    name = models.CharField(max_length=50)  # e.g., Mid Term, End Term, Assignment
    weightage = models.FloatField(default=100.0)  # percentage weightage
    max_marks = models.FloatField(default=100.0)
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['order']


class Mark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE)
    marks_obtained = models.FloatField()
    max_marks = models.FloatField(default=100.0)
    remarks = models.CharField(max_length=200, blank=True)
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def percentage(self):
        if self.max_marks == 0:
            return 0
        return round((self.marks_obtained / self.max_marks) * 100, 2)

    @property
    def grade(self):
        pct = self.percentage
        if pct >= 90:
            return 'A+'
        elif pct >= 80:
            return 'A'
        elif pct >= 70:
            return 'B+'
        elif pct >= 60:
            return 'B'
        elif pct >= 50:
            return 'C'
        elif pct >= 40:
            return 'D'
        else:
            return 'F'

    def __str__(self):
        return f"{self.student.enrollment_number} - {self.course.code} - {self.exam_type.name}: {self.marks_obtained}/{self.max_marks}"

    class Meta:
        ordering = ['-entered_at']
        unique_together = ['student', 'course', 'exam_type']


class ExamSchedule(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    name = models.CharField(max_length=120)
    exam_type = models.ForeignKey(ExamType, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exam_schedules')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    semester = models.IntegerField(choices=Course.SEMESTER_CHOICES)
    exam_date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    room = models.CharField(max_length=50)
    max_marks = models.FloatField(default=30.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    instructions = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_exam_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def end_time(self):
        start = datetime.combine(self.exam_date, self.start_time)
        return (start + timedelta(minutes=self.duration_minutes)).time()

    def clean(self):
        if self.duration_minutes <= 0:
            raise ValidationError({'duration_minutes': 'Duration must be greater than 0.'})

    def __str__(self):
        return f"{self.name} - {self.course.code} on {self.exam_date}"

    class Meta:
        ordering = ['exam_date', 'start_time']


class GradeCard(models.Model):
    """Aggregated grade card per semester"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    semester = models.IntegerField()
    academic_year = models.CharField(max_length=9)
    sgpa = models.FloatField(default=0.0)
    cgpa = models.FloatField(default=0.0)
    total_credits = models.IntegerField(default=0)
    credits_earned = models.IntegerField(default=0)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'semester', 'academic_year']
