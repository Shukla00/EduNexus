import { useState, useEffect } from 'react'
import { studentsApi, attendanceApi, marksApi, alertsApi } from '../../services/api'
import { BookOpen, CheckCircle, AlertTriangle, TrendingUp, Brain, Award } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, aRes, mRes, alRes] = await Promise.all([
          studentsApi.me(),
          attendanceApi.mySummary(),
          marksApi.myMarks(),
          alertsApi.list({ resolved: 'false' }),
        ])
        setStudent(sRes.data)
        setAttendance(aRes.data.results || aRes.data)
        setMarks(mRes.data.results || mRes.data)
        setAlerts(alRes.data.results || alRes.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  const avgAttendance = attendance.length
    ? Math.round(attendance.reduce((acc, a) => acc + a.percentage, 0) / attendance.length)
    : 0

  const avgMarks = marks.length
    ? Math.round(marks.reduce((acc, m) => acc + (m.percentage || 0), 0) / marks.length)
    : 0

  const radarData = attendance.slice(0, 6).map(a => ({
    subject: a.course_code,
    attendance: a.percentage,
  }))

  const marksBarData = marks.slice(0, 6).map(m => ({
    course: m.course_code,
    marks: m.percentage,
    grade: m.grade,
  }))

  const riskConfig = {
    HIGH: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'High Risk' },
    MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Medium Risk' },
    LOW: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Good Standing' },
  }
  const risk = riskConfig[student?.ai_risk_level] || riskConfig.LOW

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold font-display">{student?.full_name}</h1>
            <p className="text-primary-200 text-sm mt-1">
              {student?.enrollment_number} · {student?.department_name} · Sem {student?.semester}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 border-white/20 bg-white/10 text-center`}>
            <p className="text-xs text-primary-200">AI Risk Level</p>
            <p className="font-bold text-lg">{student?.ai_risk_level}</p>
          </div>
        </div>
      </div>

      {/* AI Alert Banner */}
      {alerts.length > 0 && (
        <div className={`card p-4 border-2 ${risk.bg} flex items-start gap-3`}>
          <Brain className={`w-5 h-5 ${risk.color} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`font-semibold text-sm ${risk.color}`}>AI Alert: {risk.label}</p>
            <p className="text-sm text-slate-600 mt-1">{alerts[0]?.message}</p>
            {alerts[0]?.suggestions?.length > 0 && (
              <div className="mt-2 space-y-1">
                {alerts[0].suggestions.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-violet-600 font-bold">→</span> {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${avgAttendance >= 75 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <CheckCircle className={`w-5 h-5 ${avgAttendance >= 75 ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900">{avgAttendance}%</p>
            <p className="text-xs text-slate-500">Avg. Attendance</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900">{avgMarks}%</p>
            <p className="text-xs text-slate-500">Avg. Marks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900">{attendance.length}</p>
            <p className="text-xs text-slate-500">Courses Enrolled</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900">{alerts.length}</p>
            <p className="text-xs text-slate-500">Active Alerts</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Radar */}
        {radarData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 font-display mb-4">Attendance by Course</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                <Radar name="Attendance" dataKey="attendance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Marks Bar */}
        {marksBarData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 font-display mb-4">Marks Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={marksBarData} barSize={24}>
                <XAxis dataKey="course" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
                  {marksBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.marks >= 75 ? '#10b981' : entry.marks >= 50 ? '#3b82f6' : entry.marks >= 40 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Attendance Details Table */}
      {attendance.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-surface-100">
            <h3 className="font-semibold text-slate-900 font-display">Course-wise Attendance</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a.id}>
                  <td>
                    <div>
                      <p className="font-medium">{a.course_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.course_code}</p>
                    </div>
                  </td>
                  <td>{a.total_classes}</td>
                  <td className="text-emerald-600 font-medium">{a.present_count}</td>
                  <td className="text-red-600 font-medium">{a.absent_count}</td>
                  <td className="text-amber-600 font-medium">{a.late_count}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a.percentage >= 75 ? 'bg-emerald-500' : a.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${a.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{a.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.percentage >= 75 ? 'badge-green' : a.percentage >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                      {a.percentage >= 75 ? 'Good' : a.percentage >= 60 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
