import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edunexus.settings')
django.setup()

from apps.users.models import User, Department
from apps.students.models import Student
from apps.faculty.models import FacultyProfile

# Create admin
try:
    User.objects.create_superuser(
        email='admin@example.com', 
        password='password123',
        first_name='System',
        last_name='Admin'
    )
    print('Admin created successfully.')
except Exception as e:
    print('Admin exists or error:', e)

dept, _ = Department.objects.get_or_create(name='Computer Science', code='CS', description='CS Dept')
print('Department created/fetched.')

try:
    hod = User.objects.create_user(
        email='hod@example.com', 
        password='password123', 
        role='HOD', 
        first_name='Head', 
        last_name='Of Dept',
        department=dept
    )
    FacultyProfile.objects.create(user=hod, employee_id='F001', department=dept, designation='Head', qualification='PhD')
    print('HOD created successfully.')
except Exception as e:
    print('HOD exists or error:', e)

try:
    faculty = User.objects.create_user(
        email='faculty@example.com', 
        password='password123', 
        role='FACULTY', 
        first_name='Prof', 
        last_name='Faculty',
        department=dept
    )
    FacultyProfile.objects.create(user=faculty, employee_id='F002', department=dept, designation='Professor', qualification='MTech')
    print('Faculty created successfully.')
except Exception as e:
    print('Faculty exists or error:', e)

try:
    student = User.objects.create_user(
        email='student@example.com', 
        password='password123', 
        role='STUDENT', 
        first_name='Test', 
        last_name='Student',
        department=dept
    )
    Student.objects.create(user=student, enrollment_number='S001', department=dept, semester=1)
    print('Student created successfully.')
except Exception as e:
    print('Student exists or error:', e)

print('Seeding completed!')
