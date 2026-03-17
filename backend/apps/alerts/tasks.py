"""
EduNexus Celery Tasks
"""
from celery import shared_task
import logging

logger = logging.getLogger('edunexus.tasks')


@shared_task(name='apps.alerts.tasks.run_daily_ai_evaluation')
def run_daily_ai_evaluation():
    """Run full AI evaluation daily."""
    from apps.alerts.ai_engine import run_full_ai_evaluation
    updated = run_full_ai_evaluation()
    logger.info(f"Daily AI evaluation task completed. {updated} students updated.")
    return {'updated': updated}


@shared_task(name='apps.alerts.tasks.send_lecture_reminders')
def send_lecture_reminders():
    """Send lecture reminders to faculty 5 minutes before scheduled lectures."""
    from django.utils import timezone
    from datetime import timedelta
    from apps.timetable.models import TimetableEntry
    from apps.alerts.models import Alert

    now = timezone.localtime()
    target_time = (now + timedelta(minutes=5)).time()

    # Find lectures starting in next 5 minutes
    upcoming = TimetableEntry.objects.filter(
        is_active=True,
        time_slot__day=now.strftime('%a').upper()[:3],
        time_slot__start_time__hour=target_time.hour,
        time_slot__start_time__minute__in=range(target_time.minute - 2, target_time.minute + 3)
    ).select_related('faculty', 'course', 'time_slot')

    reminder_count = 0
    for entry in upcoming:
        # Check if reminder already sent today
        today_start = now.replace(hour=0, minute=0, second=0)
        already_sent = Alert.objects.filter(
            faculty=entry.faculty,
            alert_type='LECTURE',
            created_at__gte=today_start,
            message__contains=entry.course.code
        ).exists()

        if not already_sent:
            Alert.objects.create(
                faculty=entry.faculty,
                alert_type='LECTURE',
                risk_level='LOW',
                message=f"Reminder: Your lecture for {entry.course.name} ({entry.course.code}) starts in 5 minutes. Room: {entry.room or 'TBA'}",
                suggestions=[]
            )
            reminder_count += 1

    logger.info(f"Lecture reminders sent: {reminder_count}")
    return {'reminders_sent': reminder_count}


@shared_task(name='apps.alerts.tasks.send_weekly_report')
def send_weekly_report():
    """Generate and log weekly attendance and performance report."""
    from apps.students.models import Student
    from apps.attendance.models import AttendanceSummary
    from django.db.models import Avg

    total_students = Student.objects.filter(is_active=True).count()
    high_risk = Student.objects.filter(ai_risk_level='HIGH', is_active=True).count()
    avg_attendance = AttendanceSummary.objects.aggregate(avg=Avg('percentage'))['avg'] or 0

    logger.info(
        f"Weekly Report | Students: {total_students} | "
        f"High Risk: {high_risk} | Avg Attendance: {avg_attendance:.1f}%"
    )
    return {
        'total_students': total_students,
        'high_risk': high_risk,
        'avg_attendance': round(avg_attendance, 2)
    }
