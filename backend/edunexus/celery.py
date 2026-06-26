"""
EduNexus Celery Configuration
Handles scheduled tasks: AI evaluation, lecture reminders
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edunexus.settings')

app = Celery('edunexus')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# Scheduled tasks
app.conf.beat_schedule = {
    # Run full AI evaluation every day at 6 AM
    'daily-ai-evaluation': {
        'task': 'apps.alerts.tasks.run_daily_ai_evaluation',
        'schedule': crontab(hour=6, minute=0),
    },
    # Send lecture reminders every 5 minutes
    'lecture-reminders': {
        'task': 'apps.alerts.tasks.send_lecture_reminders',
        'schedule': crontab(minute='*/5'),
    },
    # Weekly attendance report
    'weekly-attendance-report': {
        'task': 'apps.alerts.tasks.send_weekly_report',
        'schedule': crontab(day_of_week='monday', hour=8, minute=0),
    },
}
