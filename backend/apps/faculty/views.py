from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import FacultyProfile
from apps.users.serializers import UserSerializer


class FacultyProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = FacultyProfile
        fields = [
            'id', 'user', 'full_name', 'email', 'employee_id', 'department',
            'department_name', 'designation', 'specialization',
            'courses_assigned', 'date_of_joining', 'qualification', 'experience_years'
        ]


class FacultyCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, default='faculty@123')

    class Meta:
        model = FacultyProfile
        fields = [
            'email', 'first_name', 'last_name', 'password',
            'employee_id', 'department', 'designation', 'specialization',
            'date_of_joining', 'qualification', 'experience_years'
        ]

    def create(self, validated_data):
        from apps.users.models import User
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', 'faculty@123')

        user = User.objects.create_user(
            email=email, first_name=first_name, last_name=last_name,
            password=password, role='FACULTY', department=validated_data.get('department')
        )
        return FacultyProfile.objects.create(user=user, **validated_data)


class FacultyListCreateView(generics.ListCreateAPIView):
    queryset = FacultyProfile.objects.select_related('user', 'department').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FacultyCreateSerializer
        return FacultyProfileSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department_id=dept)
        return qs


class FacultyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FacultyProfile.objects.all()
    serializer_class = FacultyProfileSerializer


class MyFacultyProfileView(APIView):
    def get(self, request):
        try:
            profile = FacultyProfile.objects.get(user=request.user)
            return Response(FacultyProfileSerializer(profile).data)
        except FacultyProfile.DoesNotExist:
            return Response({'error': 'Faculty profile not found.'}, status=status.HTTP_404_NOT_FOUND)


# URLs
from django.urls import path

urlpatterns = [
    path('', FacultyListCreateView.as_view(), name='faculty-list'),
    path('<int:pk>/', FacultyDetailView.as_view(), name='faculty-detail'),
    path('me/', MyFacultyProfileView.as_view(), name='my-faculty-profile'),
]
