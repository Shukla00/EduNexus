import { useState, useEffect } from 'react'
import { attendanceApi, studentsApi, timetableApi } from '../../services/api'
import { CheckCircle, XCircle, Clock, Save, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PRESENT: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'P' },
  ABSENT: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'A' },
  LATE: { icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'L' },
}

const getToday = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  return new Date(today.getTime() - offset * 60000).toISOString().split('T')[0]
}
const getInitialDate = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('date') || getToday()
}

const getTime = (value) => value?.slice(0, 5) || ''
const getSlotTime = (entry) => {
  const slot = entry?.time_slot_detail
  if (!slot) return ''
  return `${getTime(slot.start_time)} - ${getTime(slot.end_time)}`
}

export default function MarkAttendance() {
  const [timetable, setTimetable] = useState([])
  const [lectures, setLectures] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [sessionDate, setSessionDate] = useState(getInitialDate())
  const [selectedEntryId, setSelectedEntryId] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoadingSchedule(true)
      try {
        const res = await timetableApi.my()
        setTimetable(res.data.results || res.data)
      } catch (err) {
        console.error('Failed to load timetable', err)
        toast.error('Failed to load your timetable')
      } finally {
        setLoadingSchedule(false)
      }
    }
    fetchSchedule()
  }, [])

  useEffect(() => {
    const day = new Date(`${sessionDate}T00:00:00`)
      .toLocaleDateString('en-US', { weekday: 'short' })
      .slice(0, 3)
      .toUpperCase()

    const list = timetable.filter(entry => {
      if (entry.date) return entry.date === sessionDate
      return entry.time_slot_detail?.day === day
    })

    const params = new URLSearchParams(window.location.search)
    const requestedEntry = params.get('entry')
    const preselected = requestedEntry
      ? list.find(item => String(item.id) === requestedEntry)
      : null

    setLectures(list)
    setSelectedEntryId(preselected ? String(preselected.id) : '')
    setSelectedEntry(preselected || null)
    setStudents([])
    setAttendance({})
    setStep(1)
  }, [sessionDate, timetable])

  const selectLecture = (id) => {
    const entry = lectures.find(item => String(item.id) === String(id)) || null
    setSelectedEntryId(id)
    setSelectedEntry(entry)
    setStudents([])
    setAttendance({})
  }

  const loadStudents = async () => {
    if (!selectedEntry) return toast.error('Select a scheduled lecture first')

    try {
      const params = {
        department: selectedEntry.department,
        semester: selectedEntry.semester,
        course: selectedEntry.course,
      }
      const { data } = await studentsApi.list(params)
      let list = data.results || data

      if (!list.length) {
        const fallback = await studentsApi.list({
          department: selectedEntry.department,
          semester: selectedEntry.semester,
        })
        list = fallback.data.results || fallback.data
      }

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

  const getOrCreateSession = async () => {
    const startTime = getTime(selectedEntry.time_slot_detail?.start_time)
    const endTime = getTime(selectedEntry.time_slot_detail?.end_time)
    const sessionsRes = await attendanceApi.sessions({
      course: selectedEntry.course,
      date: sessionDate,
    })
    const sessions = sessionsRes.data.results || sessionsRes.data
    const existing = sessions.find(session => (
      getTime(session.start_time) === startTime &&
      getTime(session.end_time) === endTime
    ))
    if (existing) return existing

    const { data } = await attendanceApi.createSession({
      course: selectedEntry.course,
      date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      semester: selectedEntry.semester,
    })
    return data
  }

  const saveAttendance = async () => {
    if (!selectedEntry) return toast.error('Select a scheduled lecture first')
    setSaving(true)
    try {
      const session = await getOrCreateSession()
      const records = students.map(s => ({
        student: s.id,
        status: attendance[s.id] || 'ABSENT',
      }))
      await attendanceApi.markAttendance({ session_id: session.id, records })
      toast.success(`Attendance saved for ${students.length} students`)
      setStep(1)
    } catch (err) {
      const detail = err?.response?.data
      const msg = typeof detail === 'string'
        ? detail
        : Object.values(detail || {}).flat()[0] || 'Failed to save attendance'
      toast.error(msg)
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
        <p className="page-subtitle">Record attendance from your scheduled timetable slots</p>
      </div>

      {step === 1 ? (
        <div className="card p-6 max-w-xl">
          <h2 className="font-semibold text-slate-900 font-display mb-4">Session Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Scheduled Lecture</label>
              <select
                className="input"
                value={selectedEntryId}
                onChange={e => selectLecture(e.target.value)}
                disabled={loadingSchedule}
              >
                <option value="">{loadingSchedule ? 'Loading schedule...' : 'Select lecture...'}</option>
                {!loadingSchedule && !lectures.length && (
                  <option value="" disabled>No lecture scheduled for this date</option>
                )}
                {lectures.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {getSlotTime(entry)} - {entry.course_code} {entry.course_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEntry && (
              <div className="rounded-md border border-surface-200 bg-surface-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{selectedEntry.course_name}</p>
                <p>{getSlotTime(selectedEntry)} | Room {selectedEntry.room || 'TBA'}</p>
                <p>{selectedEntry.department_name} | Semester {selectedEntry.semester}</p>
              </div>
            )}

            <button className="btn-primary w-full" onClick={loadStudents} disabled={!selectedEntry}>
              <Users className="w-4 h-4" /> Load Students
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="font-semibold text-slate-900">{selectedEntry?.course_name}</p>
            <p className="text-sm text-slate-500">
              {sessionDate} | {getSlotTime(selectedEntry)} | Semester {selectedEntry?.semester}
            </p>
          </div>

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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <button className="btn-secondary btn-sm" onClick={() => markAll('PRESENT')}>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Mark All Present
              </button>
              <button className="btn-secondary btn-sm" onClick={() => markAll('ABSENT')}>
                <XCircle className="w-3.5 h-3.5 text-red-500" /> Mark All Absent
              </button>
              <span className="text-sm text-slate-500 hidden md:flex items-center ml-2">
                Click student to toggle status
              </span>
            </div>
          </div>

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

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary flex-1" onClick={saveAttendance} disabled={saving || !students.length}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
