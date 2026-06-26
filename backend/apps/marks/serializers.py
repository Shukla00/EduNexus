from rest_framework import serializers
from .models import ExamSchedule


class ExamScheduleSerializer(serializers.ModelSerializer):

    course_name = serializers.CharField(
        source='course.name',
        read_only=True
    )

    course_code = serializers.CharField(
        source='course.code',
        read_only=True
    )

    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    exam_type_name = serializers.CharField(
        source='exam_type.name',
        read_only=True
    )

    class Meta:
        model = ExamSchedule

        fields = '__all__'