import { useState, useEffect } from 'react'
import { attendanceApi, marksApi, alertsApi, timetableApi } from '../../services/api'
import { Users, ClipboardCheck, BarChart3, Bell, BookOpen, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FacultyDashboard() {
  const [stats, setStats] = useState({ sessions: 0, alerts: 0 })
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      timetableApi.my(),
      alertsApi.stats(),
    ]).then(([tt, al]) => {
      setTimetable((tt.data.results || tt.data).slice(0, 5))
      setStats(s => ({ ...s, alerts: al.data.total }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const dayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)
  const todayClasses = timetable.filter(t => t.time_slot_detail?.day === dayAbbr)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Faculty Dashboard</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{todayClasses.length}</p>
            <p className="text-sm text-slate-500">Today's Lectures</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{timetable.length}</p>
            <p className="text-sm text-slate-500">Assigned Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{stats.alerts}</p>
            <p className="text-sm text-slate-500">Active Alerts</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 font-display mb-4">Today's Schedule</h3>
        {todayClasses.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No lectures scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayClasses.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl border border-surface-200">
                <div className="text-center w-16">
                  <p className="text-xs text-slate-400">{c.time_slot_detail?.start_time}</p>
                  <p className="text-xs text-slate-400">—</p>
                  <p className="text-xs text-slate-400">{c.time_slot_detail?.end_time}</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{c.course_name}</p>
                  <p className="text-xs text-slate-400">{c.course_code} · Room {c.room || 'TBA'}</p>
                </div>
                <span className="badge-blue">{c.department_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <a href="/faculty/attendance" className="card-hover p-5 flex flex-col items-center gap-3 cursor-pointer">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-900">Mark Attendance</p>
          <p className="text-xs text-slate-500 text-center">Record student attendance for your session</p>
        </a>
        <a href="/faculty/marks" className="card-hover p-5 flex flex-col items-center gap-3 cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <p className="font-semibold text-slate-900">Enter Marks</p>
          <p className="text-xs text-slate-500 text-center">Enter exam and assignment marks</p>
        </a>
      </div>
    </div>
  )
}
