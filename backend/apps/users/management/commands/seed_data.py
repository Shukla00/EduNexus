"""
Management command: python manage.py seed_data
Seeds the database with demo data for EduNexus
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time
import random


class Command(BaseCommand):
    help = 'Seed EduNexus database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding EduNexus database...')

        self._create_departments()
        self._create_academic_year()
        self._create_courses()
        self._create_admin()
        self._create_hods()
        self._create_faculty()
        self._create_students()
        self._create_timeslots()
        self._create_exam_types()

        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write('\n📋 Login credentials:')
        self.stdout.write('Admin:   admin@edunexus.com / admin@123')
        self.stdout.write('HOD:     hod.it@edunexus.com / hod@123')
        self.stdout.write('Faculty: faculty1@edunexus.com / faculty@123')
        self.stdout.write('Student: student1@edunexus.com / student@123')

    def _create_departments(self):
        from apps.users.models import Department
        depts = [
            {'name': 'Information Technology', 'code': 'IT'},
            {'name': 'Computer Science', 'code': 'CS'},
            {'name': 'Electronics & Communication', 'code': 'EC'},
            {'name': 'Mechanical Engineering', 'code': 'ME'},
        ]
        for d in depts:
            Department.objects.get_or_create(code=d['code'], defaults=d)
        self.stdout.write('  ✓ Departments created')

    def _create_academic_year(self):
        from apps.students.models import AcademicYear
        AcademicYear.objects.get_or_create(
            year='2024-2025',
            defaults={
                'is_current': True,
                'start_date': date(2024, 7, 1),
                'end_date': date(2025, 6, 30)
            }
        )
        self.stdout.write('  ✓ Academic year created')

    def _create_courses(self):
        from apps.users.models import Department
        from apps.students.models import Course

        it_dept = Department.objects.get(code='IT')
        courses = [
            {'name': 'Data Structures & Algorithms', 'code': 'IT301', 'credits': 4, 'semester': 3},
            {'name': 'Database Management Systems', 'code': 'IT302', 'credits': 4, 'semester': 3},
            {'name': 'Operating Systems', 'code': 'IT303', 'credits': 3, 'semester': 3},
            {'name': 'Computer Networks', 'code': 'IT401', 'credits': 4, 'semester': 4},
            {'name': 'Web Technologies', 'code': 'IT402', 'credits': 3, 'semester': 4},
            {'name': 'Artificial Intelligence', 'code': 'IT501', 'credits': 4, 'semester': 5},
            {'name': 'Machine Learning', 'code': 'IT502', 'credits': 4, 'semester': 5},
            {'name': 'Software Engineering', 'code': 'IT503', 'credits': 3, 'semester': 5},
        ]
        for c in courses:
            Course.objects.get_or_create(code=c['code'], defaults={**c, 'department': it_dept})
        self.stdout.write('  ✓ Courses created')

    def _create_admin(self):
        from apps.users.models import User
        if not User.objects.filter(email='admin@edunexus.com').exists():
            User.objects.create_superuser(
                email='admin@edunexus.com',
                password='admin@123',
                first_name='Super',
                last_name='Admin',
            )
        self.stdout.write('  ✓ Admin created')

    def _create_hods(self):
        from apps.users.models import User, Department
        it_dept = Department.objects.get(code='IT')
        if not User.objects.filter(email='hod.it@edunexus.com').exists():
            User.objects.create_user(
                email='hod.it@edunexus.com',
                password='hod@123',
                first_name='Dr. Rajesh',
                last_name='Kumar',
                role='HOD',
                department=it_dept,
                phone='9876543210'
            )
        self.stdout.write('  ✓ HODs created')

    def _create_faculty(self):
        from apps.users.models import User, Department
        from apps.faculty.models import FacultyProfile
        from apps.students.models import Course

        it_dept = Department.objects.get(code='IT')
        faculty_data = [
            {'email': 'faculty1@edunexus.com', 'first': 'Priya', 'last': 'Sharma', 'emp_id': 'EMP001', 'desig': 'Assistant Professor'},
            {'email': 'faculty2@edunexus.com', 'first': 'Amit', 'last': 'Singh', 'emp_id': 'EMP002', 'desig': 'Associate Professor'},
            {'email': 'faculty3@edunexus.com', 'first': 'Neha', 'last': 'Gupta', 'emp_id': 'EMP003', 'desig': 'Assistant Professor'},
        ]
        for f in faculty_data:
            if not User.objects.filter(email=f['email']).exists():
                user = User.objects.create_user(
                    email=f['email'], password='faculty@123',
                    first_name=f['first'], last_name=f['last'],
                    role='FACULTY', department=it_dept
                )
                FacultyProfile.objects.create(
                    user=user, employee_id=f['emp_id'],
                    department=it_dept, designation=f['desig'],
                    experience_years=random.randint(2, 10)
                )
        self.stdout.write('  ✓ Faculty created')

    def _create_students(self):
        from apps.users.models import User, Department
        from apps.students.models import Student, AcademicYear, Course

        it_dept = Department.objects.get(code='IT')
        academic_year = AcademicYear.objects.get(year='2024-2025')
        courses = list(Course.objects.filter(department=it_dept, semester=5))

        names = [
            ('Aarav', 'Verma'), ('Diya', 'Patel'), ('Rohan', 'Mishra'),
            ('Ananya', 'Singh'), ('Vikram', 'Tiwari'), ('Pritha', 'Roy'),
            ('Arjun', 'Nair'), ('Shreya', 'Joshi'), ('Karan', 'Mehta'),
            ('Pooja', 'Yadav'),
        ]

        for i, (first, last) in enumerate(names, 1):
            email = f'student{i}@edunexus.com'
            enroll = f'2303600{i:06d}'
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email, password='student@123',
                    first_name=first, last_name=last,
                    role='STUDENT', department=it_dept
                )
                student = Student.objects.create(
                    user=user, enrollment_number=enroll,
                    department=it_dept, semester=5,
                    academic_year=academic_year,
                    ai_risk_level=random.choice(['LOW', 'LOW', 'LOW', 'MEDIUM', 'HIGH'])
                )
                student.courses.set(courses)
        self.stdout.write('  ✓ Students created')

    def _create_timeslots(self):
        from apps.timetable.models import TimeSlot
        days = ['MON', 'TUE', 'WED', 'THU', 'FRI']
        slots = [
            (time(9, 0), time(10, 0)),
            (time(10, 0), time(11, 0)),
            (time(11, 15), time(12, 15)),
            (time(13, 0), time(14, 0)),
            (time(14, 0), time(15, 0)),
        ]
        for day in days:
            for slot_num, (start, end) in enumerate(slots, 1):
                TimeSlot.objects.get_or_create(
                    day=day, slot_number=slot_num,
                    defaults={'start_time': start, 'end_time': end}
                )
        self.stdout.write('  ✓ Time slots created')

    def _create_exam_types(self):
        from apps.marks.models import ExamType
        types = [
            {'name': 'Mid Term Exam', 'weightage': 30, 'max_marks': 30, 'order': 1},
            {'name': 'End Term Exam', 'weightage': 70, 'max_marks': 70, 'order': 2},
            {'name': 'Assignment', 'weightage': 10, 'max_marks': 10, 'order': 3},
            {'name': 'Internal Assessment', 'weightage': 20, 'max_marks': 20, 'order': 4},
        ]
        for t in types:
            ExamType.objects.get_or_create(name=t['name'], defaults=t)
        self.stdout.write('  ✓ Exam types created')
