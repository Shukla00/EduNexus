from django.contrib import admin
from .models import ExamType, Mark, GradeCard, ExamSchedule


@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'weightage', 'max_marks', 'order')
    ordering = ('order',)


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'exam_type', 'marks_obtained', 'max_marks', 'entered_by')
    list_filter = ('exam_type', 'course')
    search_fields = ('student__enrollment_number', 'student__user__first_name', 'student__user__last_name', 'course__code')


@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'department', 'semester', 'exam_date', 'start_time', 'room', 'status')
    list_filter = ('department', 'semester', 'status', 'exam_date')
    search_fields = ('name', 'course__name', 'course__code', 'room')


@admin.register(GradeCard)
class GradeCardAdmin(admin.ModelAdmin):
    list_display = ('student', 'semester', 'academic_year', 'sgpa', 'cgpa')
