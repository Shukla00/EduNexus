import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/shared/DashboardLayout'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageStudents from './pages/admin/ManageStudents'
import ManageFaculty from './pages/admin/ManageFaculty'
import ManageDepartments from './pages/admin/ManageDepartments'
import ManageCourses from './pages/admin/ManageCourses'
import AIAlerts from './pages/admin/AIAlerts'

// HOD pages
import HODDashboard from './pages/hod/HODDashboard'
import DeptPerformance from './pages/hod/DeptPerformance'

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import MarkAttendance from './pages/faculty/MarkAttendance'
import EnterMarks from './pages/faculty/EnterMarks'
import FacultyTimetable from './pages/faculty/FacultyTimetable'

// Student pages
import StudentDashboard from './pages/student/StudentDashboard'
import MyAttendance from './pages/student/MyAttendance'
import MyMarks from './pages/student/MyMarks'
import MyTimetable from './pages/student/MyTimetable'
import StudentIDCard from './pages/student/StudentIDCard'

// Shared
import ManageTimetable from './pages/shared/ManageTimetable'
import ProfilePage from './pages/shared/ProfilePage'
import NotFound from './pages/NotFound'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map = { ADMIN: '/admin', HOD: '/hod', FACULTY: '/faculty', STUDENT: '/student' }
  return <Navigate to={map[user.role] || '/login'} replace />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading EduNexus...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><DashboardLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="faculty" element={<ManageFaculty />} />
            <Route path="departments" element={<ManageDepartments />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="timetable" element={<ManageTimetable />} />
            <Route path="alerts" element={<AIAlerts />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* HOD Routes */}
          <Route path="/hod" element={<PrivateRoute roles={['HOD']}><DashboardLayout /></PrivateRoute>}>
            <Route index element={<HODDashboard />} />
            <Route path="performance" element={<DeptPerformance />} />
            <Route path="alerts" element={<AIAlerts />} />
            <Route path="timetable" element={<ManageTimetable />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty" element={<PrivateRoute roles={['FACULTY']}><DashboardLayout /></PrivateRoute>}>
            <Route index element={<FacultyDashboard />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="marks" element={<EnterMarks />} />
            <Route path="timetable" element={<FacultyTimetable />} />
            <Route path="alerts" element={<AIAlerts />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<PrivateRoute roles={['STUDENT']}><DashboardLayout /></PrivateRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="marks" element={<MyMarks />} />
            <Route path="timetable" element={<MyTimetable />} />
            <Route path="alerts" element={<AIAlerts />} />
            <Route path="id-card" element={<StudentIDCard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
