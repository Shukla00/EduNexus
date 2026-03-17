from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student, Course, AcademicYear
from apps.users.serializers import UserSerializer


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'year', 'is_current', 'start_date', 'end_date']


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'department', 'department_name', 'credits', 'semester', 'description']


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    attendance_percentage = serializers.SerializerMethodField()
    average_marks = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'full_name', 'email', 'enrollment_number',
            'department', 'department_name', 'semester', 'academic_year',
            'date_of_birth', 'address', 'guardian_name', 'guardian_phone',
            'is_active', 'admitted_on', 'ai_risk_level',
            'attendance_percentage', 'average_marks', 'courses'
        ]

    def get_attendance_percentage(self, obj):
        return obj.get_attendance_percentage()

    def get_average_marks(self, obj):
        return obj.get_average_marks()


class StudentCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, default='edunexus@123')

    class Meta:
        model = Student
        fields = [
            'email', 'first_name', 'last_name', 'password',
            'enrollment_number', 'department', 'semester', 'academic_year',
            'date_of_birth', 'address', 'guardian_name', 'guardian_phone'
        ]

    def create(self, validated_data):
        from apps.users.models import User
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', 'edunexus@123')

        user = User.objects.create_user(
            email=email, first_name=first_name, last_name=last_name,
            password=password, role='STUDENT', department=validated_data.get('department')
        )
        student = Student.objects.create(user=user, **validated_data)
        return student
