import { useState, useEffect } from 'react'
import { timetableApi, departmentsApi, studentsApi, facultyApi } from '../../services/api'
import { Plus, Trash2, Calendar } from 'lucide-react'
import ConfirmModal from '../../components/ConfirmModal'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const getApiList = (data) => data.results || data
const toArray = (value) => Array.isArray(value) ? value : []
const getFacultyUserId = (faculty) => faculty.user?.id || faculty.user_id || faculty.id
const getFacultyName = (faculty) => (
  faculty.full_name ||
  faculty.user?.full_name ||
  [faculty.user?.first_name, faculty.user?.last_name].filter(Boolean).join(' ') ||
  faculty.email ||
  faculty.user?.email ||
  faculty.employee_id ||
  'Unnamed faculty'
)
const getCourseLabel = (course) => {
  const code = course.code || course.course_code
  const name = course.name || course.course_name || course.title
  return [code, name].filter(Boolean).join(' - ') || 'Unnamed subject'
}
const getSlotTime = (slot) => {
  if (!slot?.start_time || !slot?.end_time) return 'Time not set'
  return `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
}
const getSlotLabel = (slot) => {
  return getSlotTime(slot)
}
const getUniqueSlotsByTime = (slots) => {
  const seen = new Set()
  return toArray(slots).filter(slot => {
    const key = getSlotTime(slot)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
const getDayFromDate = (date) => {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed
    .toLocaleDateString('en-US', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase()
}

export default function ManageTimetable() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [slots, setSlots] = useState([])
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    department: user?.department || '',
    semester: 1
  })

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    course: '', faculty: '', time_slot: '', room: '', date: '',
    semester: 1, department: '', academic_year: '2024-2025'
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    Promise.all([departmentsApi.list(), timetableApi.slots()])
      .then(([deps, slts]) => {
        setDepartments(getApiList(deps.data))
        setSlots(getApiList(slts.data))
      })
  }, [])

  useEffect(() => {
    if (!filters.department) return
    Promise.all([
      studentsApi.courses({ department: filters.department }),
      facultyApi.list({ department: filters.department })
    ]).then(([crs, fac]) => {
      setCourses(getApiList(crs.data))
      setFaculty(getApiList(fac.data))
    })
  }, [filters.department, filters.semester])

  const loadTimetable = async () => {
    if (!filters.department || !filters.semester) return
    setLoading(true)
    try {
      const res = await timetableApi.list({ department: filters.department, semester: filters.semester })
      setTimetable(getApiList(res.data))
    } catch {
      toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTimetable() }, [filters])

  const addEntry = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await timetableApi.create({ ...form, semester: filters.semester, department: filters.department })
      toast.success('Timetable entry added')
      setShowAdd(false)
      setForm(p => ({ ...p, course: '', faculty: '', time_slot: '', room: '', date: '' }))
      loadTimetable()
    } catch (err) {
      const detail = err?.response?.data
      const msg = typeof detail === 'string'
        ? detail
        : Object.values(detail || {}).flat()[0] || detail?.non_field_errors?.[0] || 'Failed to add entry'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEntry = async () => {
    if (!deleteId) return
    try {
      await timetableApi.delete(deleteId)
      toast.success('Entry deleted')
      loadTimetable()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
    }
  }

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const getDateForDay = (index) => {
    const today = new Date()

    const target = new Date(today)
    target.setDate(today.getDate() + index)

    return target.toLocaleDateString('en-GB')
  }
  const filteredCourses = toArray(courses).filter(course => String(course.semester) === String(filters.semester))
  const courseOptions = filteredCourses.length ? filteredCourses : toArray(courses)
  const selectedDay = getDayFromDate(form.date)
  const daySlots = selectedDay
    ? toArray(slots).filter(slot => String(slot.day).toUpperCase() === selectedDay)
    : []
  const slotOptions = form.date ? (daySlots.length ? daySlots : getUniqueSlotsByTime(slots)) : []
  const times = Array.from(new Set(toArray(slots).map(getSlotTime))).sort()

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Timetable</h1>
          <p className="page-subtitle">Schedule classes for departments and semesters</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(p => ({ ...p, department: filters.department, semester: filters.semester })); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input w-48" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">Select Department...</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-40" value={filters.semester} onChange={e => setFilters(p => ({ ...p, semester: e.target.value }))}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 border-b border-surface-200 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Day / Time</th>
                {times.map(t => <th key={t} className="px-4 py-3 text-center min-w-[120px]">{t}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {days.map(day => (
                <tr key={day}>
                  <td className="px-4 py-3 font-semibold text-slate-900 border-r border-surface-100">
                    <div className='flex flex-col'>
                      {/* Day */}
                      <span className='font-bold text-sm'>
                        {day}
                      </span>
                      {/* Date */}
                      <span className='text-xs text-slate-500'>
                        {getDateForDay(days.indexOf(day))}
                      </span>
                    </div>
                  </td>
                  {times.map(time => {
                    const entries = timetable.filter(t => {

                      // convert timetable date to weekday
                      const entryDay = getDayFromDate(t.date) || t.time_slot_detail?.day

                      // get slot object
                      const slot = slots.find(
                        s => String(s.id) === String(t.time_slot)
                      )

                      if (!slot) return false

                      // create slot time
                      const slotTime =
                        getSlotTime(slot)

                      return (
                        entryDay.trim() === day.trim() &&
                        slotTime === time
                      )
                    })
                    return (
                      <td key={time} className="px-2 py-2 border-r border-surface-100 min-w-[150px] align-top">
                        {entries.length > 0 ? entries.map(entry => (
                          <div key={entry.id} className="bg-green-50 border border-green-200 rounded-md p-2 mb-1 text-xs relative group transition-all hover:shadow-sm">
                            <p className="font-bold text-green-900">{entry.course_code}</p>
                            <p className="text-green-800">{entry.course_name}</p>
                            <p className="text-green-700">{entry.faculty_name}</p>
                            <p className="text-green-600 italic">{entry.room}</p>
                            <p className='text-blue-600'>{entry.date}</p>
                            <button onClick={() => setDeleteId(entry.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-white/80 rounded-full p-0.5 shadow-sm">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )) : (
                          <div className="h-full min-h-[60px] flex items-center justify-center text-slate-300">-</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-5 border-b border-surface-100"><h2 className="text-lg font-bold">Add Timetable Entry</h2></div>
            <form onSubmit={addEntry} className="p-5 space-y-4">
              <div>
                <label className="label">Subject</label>
                <select className="input" required value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}>
                  <option value="">Select...</option>
                  {!courseOptions.length && <option value="" disabled>No subjects found for this department</option>}
                  {!filteredCourses.length && courseOptions.length > 0 && (
                    <option value="" disabled>No semester {filters.semester} subjects, showing all</option>
                  )}
                  {courseOptions.map(c => <option key={c.id} value={c.id}>{getCourseLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Faculty</label>
                <select className="input" required value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))}>
                  <option value="">Select...</option>
                  {faculty.map(f => <option key={f.id} value={getFacultyUserId(f)}>{getFacultyName(f)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>

                <input
                  type="date"
                  className="input"
                  required
                  value={form.date}
                  onChange={e => setForm(p => ({
                    ...p,
                    date: e.target.value,
                    time_slot: ''
                  }))}
                />
              </div>
              <div>
                <label className="label">Time Slot</label>

                <select
                  className="input"
                  required
                  value={form.time_slot}
                  onChange={e => setForm(p => ({
                    ...p,
                    time_slot: e.target.value
                  }))}
                >
                  <option value="">Select...</option>

                  {!form.date && <option value="" disabled>Select a date first</option>}
                  {form.date && !slotOptions.length && <option value="" disabled>No slots found for selected date</option>}
                  {slotOptions.map(s => (

                      <option key={s.id} value={s.id}>
                        {getSlotLabel(s)}
                      </option>

                    ))}

                </select>
              </div>
              <div>
                <label className="label">Room</label>
                <input className="input" required value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteEntry}
        title="Delete Timetable Entry"
        message="Are you sure you want to delete this timetable entry?"
      />
    </div>
  )
}
