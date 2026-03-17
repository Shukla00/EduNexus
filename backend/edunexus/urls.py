from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import LoginView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('apps.users.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/faculty/', include('apps.faculty.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/marks/', include('apps.marks.urls')),
    path('api/timetable/', include('apps.timetable.urls')),
    path('api/alerts/', include('apps.alerts.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
