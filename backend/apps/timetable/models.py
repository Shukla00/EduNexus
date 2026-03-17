from django.db import models
from apps.users.models import User, Department
from apps.students.models import Course


# ===== MODELS =====
class TimeSlot(models.Model):
    DAY_CHOICES = [
        ('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'),
        ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'),
    ]
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_number = models.IntegerField()

    def __str__(self):
        return f"{self.get_day_display()} {self.start_time}-{self.end_time}"

    class Meta:
        ordering = ['day', 'start_time']
        unique_together = ['day', 'slot_number']


class TimetableEntry(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    room = models.CharField(max_length=50, blank=True)
    semester = models.IntegerField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=9)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.course.code} | {self.time_slot}"

    class Meta:
        ordering = ['time_slot__day', 'time_slot__start_time']


class FacultyLectureReminder(models.Model):
    timetable_entry = models.ForeignKey(TimetableEntry, on_delete=models.CASCADE)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)
    reminder_sent_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField()
    is_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-scheduled_for']
