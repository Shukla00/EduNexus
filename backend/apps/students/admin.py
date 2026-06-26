from django.contrib import admin
from .models import Student, Course, AcademicYear


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):

    list_display = (
        'enrollment_number',
        'get_name',
        'department',
        'semester',
        'is_active'
    )

    search_fields = (
        'enrollment_number',
        'user__first_name',
        'user__last_name'
    )

    list_filter = (
        'department',
        'semester',
        'is_active'
    )

    filter_horizontal = ('courses',)

    def get_name(self, obj):
        return obj.user.get_full_name()


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):

    list_display = (
        'code',
        'name',
        'department',
        'semester'
    )

    search_fields = (
        'code',
        'name'
    )

    list_filter = (
        'department',
        'semester'
    )


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):

    list_display = (
        'year',
        'is_current',
        'start_date',
        'end_date'
    )
    