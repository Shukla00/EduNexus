from django.urls import path
from .views import (
    list_documents,
    upload_document,
    delete_document,
    chat,
    student_summary,
    whoami
)

urlpatterns = [
    path("documents/", list_documents),
    path("documents/upload/", upload_document),
    path("documents/<int:pk>/", delete_document),
    path("chat/", chat),
    path("student-summary/", student_summary),
    path("whoami/", whoami),
]