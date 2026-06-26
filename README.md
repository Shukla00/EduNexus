# EduNexus — Smart AI-Enabled College ERP System

> A comprehensive, full-stack College ERP system with integrated rule-based AI for student performance monitoring.
> Built with **React.js + Django REST Framework** for GOEL INSTITUTE OF TECHNOLOGY & MANAGEMENT, Lucknow.

---

## 📋 Project Overview

EduNexus automates and centralizes college operations including:
- Student & Faculty management
- Attendance tracking with real-time analytics
- Marks entry and grade card generation
- AI-powered early warning system for at-risk students
- Automated lecture reminders via Celery
- Role-based dashboards for Admin, HOD, Faculty, Student

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, Tailwind CSS, Recharts, React Router v6 |
| Backend | Django 4.2, Django REST Framework |
| Authentication | JWT (Simple JWT) |
| Database | SQLite (dev), PostgreSQL (prod) |
| Task Queue | Celery + Redis |
| AI Module | Random Forest ML Algorithm |
| QR Code | qrcode.react |

---

## 📁 Project Structure

```
edunexus/
├── backend/
│   ├── edunexus/           # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── celery.py       # Celery + Beat scheduler
│   ├── apps/
│   │   ├── users/          # Custom User model, Departments
│   │   ├── students/       # Student, Course, AcademicYear
│   │   ├── faculty/        # FacultyProfile
│   │   ├── attendance/     # Sessions, Records, Summaries
│   │   ├── marks/          # Marks, ExamTypes, GradeCards
│   │   ├── timetable/      # TimeSlots, TimetableEntries
│   │   └── alerts/         # AI Engine, Alerts, Tasks
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── admin/       # Admin dashboard, Students, Faculty, etc.
    │   │   ├── hod/         # HOD dashboard, Performance
    │   │   ├── faculty/     # Attendance marking, Marks entry, Timetable
    │   │   └── student/     # Dashboard, Attendance, Marks, ID Card
    │   ├── components/
    │   │   └── shared/      # DashboardLayout, Sidebar
    │   ├── services/
    │   │   └── api.js       # Axios API service layer
    │   └── context/
    │       └── AuthContext.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Setup & Installation

### Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed demo data
python manage.py seed_data

# Start development server
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Celery (for scheduled tasks)

```bash
# Requires Redis running on localhost:6379
# Terminal 1: Celery worker
celery -A edunexus worker -l info

# Terminal 2: Celery beat scheduler
celery -A edunexus beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## 🤖 AI Engine

Located in `apps/alerts/ai_engine.py`, the rule-based AI:

### Rules Evaluated
1. **Attendance < 75%** in any course → MEDIUM risk
2. **Attendance < 60%** in any course → HIGH risk  
3. **Marks < 40%** in any subject → flags for review
4. **Failing 3+ courses** → HIGH risk
5. **5 consecutive absences** → Immediate alert

### Triggers
- After every attendance session
- After bulk marks entry
- Daily at 6:00 AM (Celery Beat)
- Manual trigger by Admin

### Output
- Updates `student.ai_risk_level` (LOW / MEDIUM / HIGH)
- Creates `Alert` records with suggestions
- Notifies faculty, HOD, and Admin

---

## 📡 API Endpoints

```
POST   /api/auth/login/               Login
POST   /api/auth/logout/              Logout
GET    /api/users/me/                 Current user profile
GET    /api/users/departments/        List departments
GET    /api/students/                 List students (with filters)
POST   /api/students/                 Create student
GET    /api/students/weak/            AI-flagged weak students
GET    /api/attendance/sessions/      Attendance sessions
POST   /api/attendance/mark/          Bulk mark attendance
GET    /api/attendance/summary/{id}/  Student attendance summary
POST   /api/marks/bulk/               Bulk marks entry
GET    /api/marks/analytics/{id}/     Course marks analytics
GET    /api/timetable/                Full timetable
GET    /api/timetable/my/             Faculty's own timetable
GET    /api/alerts/                   List alerts (role-filtered)
POST   /api/alerts/{id}/resolve/      Resolve alert
POST   /api/alerts/run-ai/            Trigger AI evaluation (Admin)
```

---

## 📊 Key Features

- **Role-Based Dashboards** — Each role sees relevant data only
- **Real-time Attendance Tracking** — Mark attendance with instant %
- **Bulk Marks Entry** — Enter marks for an entire class at once
- **AI Risk Levels** — Automatically updated after each evaluation
- **Student ID Card** — Digital ID with QR code download
- **Lecture Reminders** — Faculty alerted 5 min before class via Celery
- **Grade Calculation** — Automatic A+/A/B+/B/C/D/F grading

---

## ScreenShots

*Admin Dashboard*

<img width="1920" height="1200" alt="Screenshot 2026-05-04 153948" src="https://github.com/user-attachments/assets/fbeb7fe7-c74f-43a9-85fe-e97e16afbca0" />

*Login Page*
<img width="1920" height="1200" alt="Screenshot 2026-05-04 154125" src="https://github.com/user-attachments/assets/96b748d4-0ebf-40fa-9f6b-ea137bd2b815" />

*Student Dashboard*
<img width="1920" height="1200" alt="Screenshot 2026-05-28 215137" src="https://github.com/user-attachments/assets/4f9dfd9e-0d78-4dfb-b83b-bcf31d66e94c" />

*Faculty Dashboard*
<img width="1920" height="1200" alt="Screenshot 2026-05-29 232108" src="https://github.com/user-attachments/assets/2b2ab96d-8e27-45b5-9715-6128adac0261" />

## Future Work

Working On RAG Chatbot model with Hugging Face and Llama 3 8B model


## 👨‍💻 Developed By
- **Vinayak Shukla**
GitHub:
https://github.com/Shukla00

LinkedIn:
https://www.linkedin.com/in/vinayak-shukla

## 📜 License

This project is developed for educational and research purposes.

MIT License.

