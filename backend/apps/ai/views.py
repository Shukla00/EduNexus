from urllib import request

from rest_framework.decorators import api_view
from .models import KnowledgeDocument
from .serializers import KnowledgeDocumentSerializer
from .services.pdf_services import extract_pdf_text
from .services.rag_services import generate_answer
from .services.vector_services import (create_vector_store,save_vector_store)
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.students.models import Student

@api_view(["GET"])
def student_summary(request):

    if not hasattr(request.user, "student_profile"):
        return Response({
            "message": "Student profile not found"
        }, status=404)

    student = request.user.student_profile

    return Response({
        "student": {
            "name": student.user.get_full_name(),
            "enrollment": student.enrollment_number,
            "department": student.department.name,
            "semester": student.semester,
            "attendance": student.get_attendance_percentage(),
            "average_marks": student.get_average_marks(),
            "risk_level": student.ai_risk_level,
            "courses": [
                {
                    "code": c.code,
                    "name": c.name
                }
                for c in student.courses.all()
            ]
        }
    })


@api_view(["GET"])
def list_documents(request):

    docs = KnowledgeDocument.objects.all()

    serializer = KnowledgeDocumentSerializer(
        docs,
        many=True
    )

    return Response(serializer.data)

@api_view(["POST"])
def upload_document(request):

    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return Response(
            {"message": "PDF file required"},
            status=400
        )

    title = request.data.get(
        "title",
        uploaded_file.name
    )

    doc = KnowledgeDocument.objects.create(
        title=title,
        file=uploaded_file
    )

    # Extract text from the uploaded PDF
    pdf_text = extract_pdf_text(doc.file.path)

    # Create vector store
    vector_store, chunks = create_vector_store(pdf_text)

    # Save vector store
    save_vector_store(vector_store, chunks)

    return Response({
        "message": "uploaded",
        "id": doc.id
    })

@api_view(["DELETE"])
def delete_document(request, pk):

    try:
        doc = KnowledgeDocument.objects.get(id=pk)

        if doc.file:
            doc.file.delete(save=False)

        doc.delete()

        return Response({
            "message": "Document deleted successfully"
        })

    except KnowledgeDocument.DoesNotExist:
        return Response(
            {"message": "Document not found"},
            status=404
        )
@api_view(["GET"])
def whoami(request):

    return Response({
        "id": str(request.user.id),
        "name": request.user.get_full_name(),
        "role": request.user.role,
        "email": request.user.email
    })
@api_view(["POST"])
def chat(request):

    question = request.data.get("prompt", "")
    q = question.lower().strip()

    print("========== AI CHAT ==========")
    print("USER =", request.user)
    print("ROLE =", request.user.role)
    print("QUESTION =", question)

    # Student Context
    student = None
    student_context = ""

    if hasattr(request.user, "student_profile"):

        student = request.user.student_profile

        student_context = f"""
Name: {student.user.get_full_name()}
Enrollment: {student.enrollment_number}
Department: {student.department.name}
Semester: {student.semester}
Attendance: {student.get_attendance_percentage()}%
Average Marks: {student.get_average_marks()}%
Risk Level: {student.ai_risk_level}
Courses: {', '.join([c.name for c in student.courses.all()])}
"""

    # Greetings
    if q in ["hi", "hello", "hey", "hii"]:
        return Response({
            "response": f"Hello {request.user.first_name or request.user.username}! How can I help you today?"
        })

    # EduNexus Info
    if "what is edunexus" in q:
        return Response({
            "response": "EduNexus is an AI-powered College ERP system that manages students, attendance, marks, timetable, alerts and AI-powered document assistance."
        })

    # PDF Help
    if q in ["pdf", "uploaded pdf", "documents"]:
        return Response({
            "response": "You can ask questions from uploaded PDFs such as syllabus, attendance rules, notices, regulations and academic information."
        })

    # Student Summary
    if "profile" in q or "student summary" in q:

        if not student:
            return Response({
                "response": "This account is not linked to any student profile."
            })

        return Response({
            "response": f"""
Name: {student.user.get_full_name()}
Enrollment: {student.enrollment_number}
Department: {student.department.name}
Semester: {student.semester}
Attendance: {student.get_attendance_percentage()}%
Average Marks: {student.get_average_marks()}%
Risk Level: {student.ai_risk_level}
"""
        })

    # Attendance
    if "attendance" in q and student:
        return Response({
            "response": f"Your attendance is {student.get_attendance_percentage()}%"
        })

    # Marks
    if ("marks" in q or "average marks" in q) and student:
        return Response({
            "response": f"Your average marks are {student.get_average_marks()}%"
        })

    # Semester
    if "semester" in q and student:
        return Response({
            "response": f"You are currently in Semester {student.semester}"
        })

    # Department
    if "department" in q and student:
        return Response({
            "response": f"You belong to {student.department.name} department."
        })

    # Courses
    if ("course" in q or "subject" in q) and student:

        courses = ", ".join(
            [c.code for c in student.courses.all()]
        )

        return Response({
            "response": f"Your current courses are: {courses}"
        })

    # PDF RAG
    answer = generate_answer(
        question,
        student_context
    )

    return Response({
        "response": answer,
        "sources": [],
        "elapsed_ms": 0
    })