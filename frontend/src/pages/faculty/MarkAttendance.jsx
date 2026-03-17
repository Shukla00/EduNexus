import { useState, useEffect } from 'react'
import { attendanceApi, studentsApi, timetableApi } from '../../services/api'
import { CheckCircle, XCircle, Clock, Save, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PRESENT: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'P' },
  ABSENT: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'A' },
  LATE: { icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'L' },
}

export default function MarkAttendance() {
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedCourse, setSelectedCourse] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [currentSession, setCurrentSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // 1=setup, 2=mark

  useEffect(() => {
    timetableApi.my().then(({ data }) => {
      const uniqueCourses = []
      const seen = new Set()
      ;(data.results || data).forEach(e => {
        if (!seen.has(e.course)) {
          seen.add(e.course)
          uniqueCourses.push({ id: e.course, name: e.course_name, code: e.course_code })
        }
      })
      setCourses(uniqueCourses)
    }).catch(() => {})
  }, [])

  const loadStudents = async () => {
    if (!selectedCourse) return toast.error('Select a course first')
    try {
      const { data } = await studentsApi.list({ semester: 5 })
      const list = data.results || data
      setStudents(list)
      const init = {}
      list.forEach(s => { init[s.id] = 'PRESENT' })
      setAttendance(init)
      setStep(2)
    } catch {
      toast.error('Failed to load students')
    }
  }

  const toggleStatus = (studentId) => {
    const order = ['PRESENT', 'ABSENT', 'LATE']
    setAttendance(prev => {
      const current = prev[studentId] || 'PRESENT'
      const next = order[(order.indexOf(current) + 1) % order.length]
      return { ...prev, [studentId]: next }
    })
  }

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s.id] = status })
    setAttendance(updated)
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      // Create session first
      const sessionData = {
        course: selectedCourse,
        date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        semester: 5,
      }
      const { data: session } = await attendanceApi.createSession(sessionData)

      // Mark attendance
      const records = students.map(s => ({
        student: s.id,
        status: attendance[s.id] || 'ABSENT',
      }))
      await attendanceApi.markAttendance({ session_id: session.id, records })
      toast.success(`Attendance saved for ${students.length} students`)
      setStep(1)
      setCurrentSession(null)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length
  const lateCount = Object.values(attendance).filter(s => s === 'LATE').length

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Record student attendance for your lecture sessions</p>
      </div>

      {step === 1 ? (
        <div className="card p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 font-display mb-4">Session Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Course</label>
              <select className="input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">Select course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary w-full" onClick={loadStudents}>
              <Users className="w-4 h-4" /> Load Students
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 border-l-4 border-emerald-500 text-center">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-sm text-slate-500">Present</p>
            </div>
            <div className="card p-4 border-l-4 border-red-500 text-center">
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-slate-500">Absent</p>
            </div>
            <div className="card p-4 border-l-4 border-amber-500 text-center">
              <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-sm text-slate-500">Late</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary btn-sm" onClick={() => markAll('PRESENT')}>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Mark All Present
            </button>
            <button className="btn-secondary btn-sm" onClick={() => markAll('ABSENT')}>
              <XCircle className="w-3.5 h-3.5 text-red-600" /> Mark All Absent
            </button>
            <span className="text-sm text-slate-500 flex items-center ml-2">
              Click student to toggle: Present → Absent → Late
            </span>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {students.map(s => {
              const status = attendance[s.id] || 'PRESENT'
              const cfg = STATUS_CONFIG[status]
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStatus(s.id)}
                  className={`card p-3 text-left transition-all hover:shadow-card-hover border-2 ${cfg.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-current/20">
                      <span className="text-xs font-bold">{s.full_name?.[0]}</span>
                    </div>
                    <span className="text-xs font-bold">{cfg.label}</span>
                  </div>
                  <p className="text-xs font-semibold truncate">{s.full_name}</p>
                  <p className="text-xs opacity-70 font-mono truncate">{s.enrollment_number}</p>
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary flex-1" onClick={saveAttendance} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
