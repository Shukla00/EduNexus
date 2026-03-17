from django.db import models
from apps.students.models import Student, Course
from apps.users.models import User


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
