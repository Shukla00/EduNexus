import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, Bell, CalendarDays,
  ClipboardCheck, BarChart3, Settings, LogOut, Menu, X, ChevronRight,
  Building2, Brain, TrendingUp, CreditCard, UserCircle, BookMarked
} from 'lucide-react'

const NAV_CONFIG = {
  ADMIN: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { icon: Users, label: 'Students', to: '/admin/students' },
    { icon: UserCircle, label: 'Faculty', to: '/admin/faculty' },
    { icon: Building2, label: 'Departments', to: '/admin/departments' },
    { icon: BookOpen, label: 'Subjects', to: '/admin/courses' },
    { icon: CalendarDays, label: 'Timetable', to: '/admin/timetable' },
    { icon: Brain, label: 'AI Alerts', to: '/admin/alerts', badge: true },
    { icon: UserCircle, label: 'Profile', to: '/admin/profile' },
  ],
  HOD: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/hod' },
    { icon: TrendingUp, label: 'Dept. Performance', to: '/hod/performance' },
    { icon: CalendarDays, label: 'Timetable', to: '/hod/timetable' },
    { icon: Brain, label: 'AI Alerts', to: '/hod/alerts', badge: true },
    { icon: UserCircle, label: 'Profile', to: '/hod/profile' },
  ],
  FACULTY: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/faculty' },
    { icon: ClipboardCheck, label: 'Attendance', to: '/faculty/attendance' },
    { icon: BarChart3, label: 'Marks Entry', to: '/faculty/marks' },
    { icon: CalendarDays, label: 'Timetable', to: '/faculty/timetable' },
    { icon: Brain, label: 'AI Alerts', to: '/faculty/alerts', badge: true },
    { icon: UserCircle, label: 'Profile', to: '/faculty/profile' },
  ],
  STUDENT: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/student' },
    { icon: ClipboardCheck, label: 'My Attendance', to: '/student/attendance' },
    { icon: BookMarked, label: 'My Marks', to: '/student/marks' },
    { icon: CalendarDays, label: 'Timetable', to: '/student/timetable' },
    { icon: Brain, label: 'AI Alerts', to: '/student/alerts', badge: true },
    { icon: CreditCard, label: 'ID Card', to: '/student/id-card' },
    { icon: UserCircle, label: 'Profile', to: '/student/profile' },
  ],
}

const ROLE_COLORS = {
  ADMIN: 'bg-violet-600',
  HOD: 'bg-blue-600',
  FACULTY: 'bg-emerald-600',
  STUDENT: 'bg-amber-600',
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = NAV_CONFIG[user?.role] || []

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 border-b border-surface-100 flex items-center gap-3 ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {(sidebarOpen || mobile) && (
          <div className="overflow-hidden">
            <p className="font-bold text-slate-900 font-display text-sm leading-tight">EduNexus</p>
            <p className="text-slate-400 text-xs">AI College ERP</p>
          </div>
        )}
      </div>

      {/* User Card */}
      {(sidebarOpen || mobile) && (
        <div className="p-3 border-b border-surface-100">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-50">
            <div className={`w-8 h-8 ${ROLE_COLORS[user?.role]} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen && !mobile ? 'justify-center px-2' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {(sidebarOpen || mobile) && <span className="flex-1">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-100">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700 ${!sidebarOpen && !mobile ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(sidebarOpen || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-surface-200 sidebar flex-shrink-0 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-surface-200 flex items-center px-4 gap-4 flex-shrink-0">
          {/* Desktop toggle */}
          <button
            className="hidden lg:flex btn-ghost p-2"
            onClick={() => setSidebarOpen(p => !p)}
          >
            <Menu className="w-4 h-4" />
          </button>
          {/* Mobile toggle */}
          <button
            className="lg:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {/* Right items */}
          <div className="flex items-center gap-2">
            <div className={`badge ${ROLE_COLORS[user?.role]} text-white text-xs`}>
              {user?.role}
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:block">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
