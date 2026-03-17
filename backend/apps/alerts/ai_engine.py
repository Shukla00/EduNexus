"""
EduNexus AI Engine
Rule-based performance evaluation and alert generation system.
Analyzes attendance and marks to identify at-risk students and generate alerts.
"""
from django.conf import settings
import logging

logger = logging.getLogger('edunexus.ai')

# Thresholds from settings
ATTENDANCE_THRESHOLD = getattr(settings, 'AI_ATTENDANCE_THRESHOLD', 75)
MARKS_THRESHOLD = getattr(settings, 'AI_MARKS_THRESHOLD', 40)
ALERT_COOLDOWN_DAYS = getattr(settings, 'AI_ALERT_COOLDOWN_DAYS', 7)


def evaluate_student_risk(student):
    """
    Rule-based risk evaluation for a student.
    Returns: ('LOW' | 'MEDIUM' | 'HIGH', list of reasons)
    """
    from apps.attendance.models import AttendanceSummary
    from apps.marks.models import Mark

    reasons = []
    risk_score = 0

    # Rule 1: Overall attendance check
    att_summaries = AttendanceSummary.objects.filter(student=student)
    if att_summaries.exists():
        low_att = att_summaries.filter(percentage__lt=ATTENDANCE_THRESHOLD)
        if low_att.exists():
            courses = [s.course.code for s in low_att[:3]]
            reasons.append(f"Low attendance (<{ATTENDANCE_THRESHOLD}%) in {', '.join(courses)}")
            risk_score += 2 * low_att.count()

        # Rule 2: Critical attendance (below 60%)
        critical_att = att_summaries.filter(percentage__lt=60)
        if critical_att.exists():
            reasons.append(f"Critical attendance (<60%) in {critical_att.count()} course(s)")
            risk_score += 5 * critical_att.count()

    # Rule 3: Marks check
    marks = Mark.objects.filter(student=student)
    if marks.exists():
        failed = [m for m in marks if m.percentage < MARKS_THRESHOLD]
        if failed:
            courses = [m.course.code for m in failed[:3]]
            reasons.append(f"Below passing marks in {', '.join(courses)}")
            risk_score += 3 * len(failed)

        # Rule 4: Multiple failures
        if len(failed) >= 3:
            reasons.append(f"Failing {len(failed)} courses")
            risk_score += 10

    # Rule 5: Consecutive absences (last 5 sessions)
    from apps.attendance.models import AttendanceRecord
    recent_records = AttendanceRecord.objects.filter(
        student=student
    ).order_by('-session__date')[:5]

    if recent_records.count() == 5:
        consecutive_absent = all(r.status == 'ABSENT' for r in recent_records)
        if consecutive_absent:
            reasons.append("Absent in last 5 consecutive sessions")
            risk_score += 8

    # Determine risk level
    if risk_score == 0:
        risk_level = 'LOW'
    elif risk_score <= 5:
        risk_level = 'LOW'
    elif risk_score <= 15:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'HIGH'

    return risk_level, reasons


def generate_suggestions(student, risk_level, reasons):
    """Generate AI-based improvement suggestions for a student."""
    suggestions = []

    for reason in reasons:
        if 'attendance' in reason.lower():
            suggestions.append("Attend all remaining lectures to improve attendance percentage.")
            suggestions.append("Meet your faculty/HOD to discuss attendance issues.")
        if 'marks' in reason.lower() or 'passing' in reason.lower():
            suggestions.append("Seek additional help from faculty or join study groups.")
            suggestions.append("Review previous exam papers and focus on weak topics.")
        if 'consecutive' in reason.lower():
            suggestions.append("Contact your department immediately regarding your absence.")

    if risk_level == 'HIGH':
        suggestions.append("Consider meeting with academic counselor for personalized guidance.")
        suggestions.append("Review your schedule to ensure academic commitments are prioritized.")

    return list(set(suggestions))  # Remove duplicates


def run_attendance_check(course):
    """Run AI check after attendance is marked for a course."""
    from apps.students.models import Student
    from apps.attendance.models import AttendanceSummary

    low_att = AttendanceSummary.objects.filter(
        course=course,
        percentage__lt=ATTENDANCE_THRESHOLD
    ).select_related('student')

    for summary in low_att:
        student = summary.student
        risk_level, reasons = evaluate_student_risk(student)
        _update_student_risk(student, risk_level)
        _create_alert_if_needed(student, 'ATTENDANCE', reasons, risk_level)

    logger.info(f"Attendance AI check completed for course {course.code}. {low_att.count()} students flagged.")


def run_marks_check(course_id):
    """Run AI check after marks are entered for a course."""
    from apps.marks.models import Mark
    from apps.students.models import Student

    failed_marks = [m for m in Mark.objects.filter(course_id=course_id) if m.percentage < MARKS_THRESHOLD]

    students_checked = set()
    for mark in failed_marks:
        student = mark.student
        if student.id in students_checked:
            continue
        students_checked.add(student.id)

        risk_level, reasons = evaluate_student_risk(student)
        _update_student_risk(student, risk_level)
        _create_alert_if_needed(student, 'MARKS', reasons, risk_level)

    logger.info(f"Marks AI check completed for course {course_id}. {len(students_checked)} students evaluated.")


def run_full_ai_evaluation():
    """Full institution-wide AI evaluation (run periodically via Celery)."""
    from apps.students.models import Student

    students = Student.objects.filter(is_active=True).prefetch_related('marks')
    updated = 0
    for student in students:
        risk_level, reasons = evaluate_student_risk(student)
        if _update_student_risk(student, risk_level):
            updated += 1
            if risk_level in ['MEDIUM', 'HIGH']:
                _create_alert_if_needed(student, 'COMPREHENSIVE', reasons, risk_level)

    logger.info(f"Full AI evaluation completed. {updated} student risk levels updated.")
    return updated


def _update_student_risk(student, new_risk_level):
    """Update student risk level if changed."""
    if student.ai_risk_level != new_risk_level:
        student.ai_risk_level = new_risk_level
        student.save(update_fields=['ai_risk_level'])
        return True
    return False


def _create_alert_if_needed(student, alert_type, reasons, risk_level):
    """Create alert if not already created recently."""
    from apps.alerts.models import Alert
    from django.utils import timezone
    from datetime import timedelta

    cooldown_date = timezone.now() - timedelta(days=ALERT_COOLDOWN_DAYS)
    existing = Alert.objects.filter(
        student=student,
        alert_type=alert_type,
        created_at__gte=cooldown_date,
        is_resolved=False
    ).exists()

    if not existing and reasons:
        Alert.objects.create(
            student=student,
            alert_type=alert_type,
            risk_level=risk_level,
            message=f"AI Alert: {'; '.join(reasons)}",
            suggestions=generate_suggestions(student, risk_level, reasons),
        )
        logger.info(f"Alert created for student {student.enrollment_number}: {alert_type} - {risk_level}")
