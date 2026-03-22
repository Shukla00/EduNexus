from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from .models import User, Department
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    DepartmentSerializer, ChangePasswordSerializer
)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().select_related('department')
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        dept = self.request.query_params.get('department')
        if role:
            qs = qs.filter(role=role)
        if dept:
            qs = qs.filter(department_id=dept)
        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Wrong current password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DashboardStatsView(APIView):
    def get(self, request):
        from apps.students.models import Student
        from apps.faculty.models import FacultyProfile
        from apps.attendance.models import AttendanceRecord, AttendanceSession
        from apps.alerts.models import Alert
        from apps.users.models import Department
        from apps.marks.models import Mark
        import datetime
        import calendar

        total_students = Student.objects.filter(is_active=True).count()
        total_faculty = FacultyProfile.objects.filter(user__is_active=True).count()
        total_departments = Department.objects.count()
        active_alerts = Alert.objects.filter(is_resolved=False).count()

        grade_dist = {'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
        for m in Mark.objects.all():
            if m.grade in grade_dist:
                grade_dist[m.grade] += 1
            else:
                grade_dist.setdefault(m.grade, 1)
        
        marks_dist = [
            {'grade': 'A+', 'count': grade_dist.get('A+', 0), 'color': '#10b981'},
            {'grade': 'A', 'count': grade_dist.get('A', 0), 'color': '#3b82f6'},
            {'grade': 'B+', 'count': grade_dist.get('B+', 0), 'color': '#8b5cf6'},
            {'grade': 'B', 'count': grade_dist.get('B', 0), 'color': '#f59e0b'},
            {'grade': 'C', 'count': grade_dist.get('C', 0), 'color': '#f97316'},
            {'grade': 'F', 'count': grade_dist.get('F', 0), 'color': '#ef4444'},
        ]

        today = datetime.date.today()
        attendance_trend = []
        for i in range(5, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            m_name = calendar.month_abbr[month]
            sessions = AttendanceSession.objects.filter(date__month=month, date__year=year)
            records = AttendanceRecord.objects.filter(session__in=sessions)
            total = records.count()
            present = records.filter(status='PRESENT').count()
            att_pct = int((present / total * 100)) if total > 0 else 0
            attendance_trend.append({'month': m_name, 'attendance': att_pct})

        return Response({
            'total_students': total_students,
            'total_faculty': total_faculty,
            'total_departments': total_departments,
            'active_alerts': active_alerts,
            'marks_dist': marks_dist,
            'attendance_trend': attendance_trend
        })
