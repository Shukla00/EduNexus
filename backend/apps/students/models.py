from django.db import models
from apps.users.models import User, Department
import uuid


class AcademicYear(models.Model):
    year = models.CharField(max_length=9)  # e.g., "2024-2025"
    is_current = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.year

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-year']


class Course(models.Model):
    SEMESTER_CHOICES = [(i, f"Semester {i}") for i in range(1, 9)]
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    credits = models.PositiveIntegerField(default=4)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        ordering = ['semester', 'name']


class Student(models.Model):
    SEMESTER_CHOICES = [(i, f"Semester {i}") for i in range(1, 9)]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    enrollment_number = models.CharField(max_length=30, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    guardian_name = models.CharField(max_length=100, blank=True)
    guardian_phone = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    admitted_on = models.DateField(auto_now_add=True)
    courses = models.ManyToManyField(Course, blank=True)
    ai_risk_level = models.CharField(
        max_length=10,
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')],
        default='LOW'
    )

    def __str__(self):
        return f"{self.enrollment_number} - {self.user.get_full_name()}"

    def get_attendance_percentage(self):
        from apps.attendance.models import AttendanceRecord
        total = AttendanceRecord.objects.filter(student=self).count()
        present = AttendanceRecord.objects.filter(student=self, status='PRESENT').count()
        if total == 0:
            return 0
        return round((present / total) * 100, 2)

    def get_average_marks(self):
        from apps.marks.models import Mark
        marks = Mark.objects.filter(student=self)
        if not marks.exists():
            return 0
        total = sum(m.percentage for m in marks)
        return round(total / marks.count(), 2)

    class Meta:
        ordering = ['enrollment_number']
