from django.db import models
from apps.users.models import User, Department
from apps.students.models import Course


# ===== MODELS =====
class FacultyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100)
    specialization = models.CharField(max_length=150, blank=True)
    courses_assigned = models.ManyToManyField(Course, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    experience_years = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"

    class Meta:
        ordering = ['employee_id']
