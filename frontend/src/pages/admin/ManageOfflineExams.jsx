import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, Edit, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/ConfirmModal'
import { departmentsApi, examSchedulesApi, marksApi, studentsApi } from '../../services/api'

const emptyForm = {
  name: '',
  exam_type: '',
  department: '',
  semester: 1,
  course: '',
  exam_date: '',
  start_time: '',
  duration_minutes: 60,
  room: '',
  max_marks: 30,
  status: 'SCHEDULED',
  instructions: '',
}

const getList = (data) => data.results || data || []
const statusStyles = {
  DRAFT: 'badge-gray',
  SCHEDULED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
}

function formatTime(value) {
  if (!value) return '--'
  return value.slice(0, 5)
}

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${tone} rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 font-display">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function ManageOfflineExams() {
  const [exams, setExams] = useState([])
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [filters, setFilters] = useState({ department: '', semester: '', status: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const loadStaticData = async () => {
    try {
      const [deptRes, typeRes] = await Promise.all([departmentsApi.list(), marksApi.examTypes()])
      setDepartments(getList(deptRes.data))
      setExamTypes(getList(typeRes.data))
    } catch {
      toast.error('Failed to load exam setup data')
    }
  }

  const loadExams = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
      const res = await examSchedulesApi.list(params)
      setExams(getList(res.data))
    } catch {
      toast.error('Failed to load offline exams')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async (department, semester) => {
    if (!department) {
      setCourses([])
      return
    }
    try {
      const params = { department }
      if (semester) params.semester = semester
      const res = await studentsApi.courses(params)
      setCourses(getList(res.data))
    } catch {
      toast.error('Failed to load subjects')
    }
  }

  useEffect(() => { loadStaticData() }, [])
  useEffect(() => { loadExams() }, [filters.department, filters.semester, filters.status])
  useEffect(() => {
    const t = setTimeout(loadExams, 350)
    return () => clearTimeout(t)
  }, [filters.search])
  useEffect(() => { loadCourses(form.department, form.semester) }, [form.department, form.semester])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      total: exams.length,
      upcoming: exams.filter(exam => exam.status === 'SCHEDULED' && exam.exam_date >= today).length,
      completed: exams.filter(exam => exam.status === 'COMPLETED').length,
      rooms: new Set(exams.map(exam => exam.room).filter(Boolean)).size,
    }
  }, [exams])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm, department: filters.department || '', semester: filters.semester || 1 })
    setShowModal(true)
  }

  const openEdit = (exam) => {
    setEditingId(exam.id)
    setForm({
      name: exam.name || '',
      exam_type: exam.exam_type || '',
      department: exam.department || '',
      semester: exam.semester || 1,
      course: exam.course || '',
      exam_date: exam.exam_date || '',
      start_time: formatTime(exam.start_time),
      duration_minutes: exam.duration_minutes || 60,
      room: exam.room || '',
      max_marks: exam.max_marks || 30,
      status: exam.status || 'SCHEDULED',
      instructions: exam.instructions || '',
    })
    setShowModal(true)
  }

  const saveExam = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        semester: Number(form.semester),
        duration_minutes: Number(form.duration_minutes),
        max_marks: Number(form.max_marks),
        exam_type: form.exam_type || null,
      }
      if (editingId) {
        await examSchedulesApi.update(editingId, payload)
        toast.success('Offline exam updated')
      } else {
        await examSchedulesApi.create(payload)
        toast.success('Offline exam scheduled')
      }
      setShowModal(false)
      loadExams()
    } catch (err) {
      const data = err?.response?.data || {}
      const msg = data.non_field_errors?.[0] || Object.values(data).flat()[0] || 'Failed to save offline exam'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteExam = async () => {
    if (!deleteId) return
    try {
      await examSchedulesApi.delete(deleteId)
      toast.success('Offline exam deleted')
      loadExams()
    } catch {
      toast.error('Failed to delete offline exam')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">Offline Exam Schedule</h1>
          <p className="page-subtitle">Plan internal offline exams by subject, room, date, and batch</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Schedule Exam
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile icon={CalendarCheck} label="Total Exams" value={stats.total} tone="bg-primary-600" />
        <StatTile icon={Clock} label="Upcoming" value={stats.upcoming} tone="bg-emerald-600" />
        <StatTile icon={CalendarCheck} label="Completed" value={stats.completed} tone="bg-slate-700" />
        <StatTile icon={MapPin} label="Rooms Used" value={stats.rooms} tone="bg-amber-500" />
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search exam or subject..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </div>
        <select className="input w-48" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-40" value={filters.semester} onChange={e => setFilters(p => ({ ...p, semester: e.target.value }))}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select className="input w-40" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {['DRAFT', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-container bg-white">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Subject</th>
                <th>Batch</th>
                <th>Date & Time</th>
                <th>Room</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No offline exams scheduled</td></tr>
              ) : exams.map(exam => (
                <tr key={exam.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{exam.name}</p>
                    <p className="text-xs text-slate-500">{exam.exam_type_name || 'Internal offline exam'}</p>
                  </td>
                  <td>
                    <p className="font-medium text-slate-900">{exam.course_code}</p>
                    <p className="text-xs text-slate-500">{exam.course_name}</p>
                  </td>
                  <td>{exam.department_name}<br /><span className="text-xs text-slate-500">Semester {exam.semester}</span></td>
                  <td>
                    <p className="font-medium text-slate-900">{exam.exam_date}</p>
                    <p className="text-xs text-slate-500">{formatTime(exam.start_time)} - {formatTime(exam.end_time)} ({exam.duration_minutes} min)</p>
                  </td>
                  <td>{exam.room}</td>
                  <td>{exam.max_marks}</td>
                  <td><span className={statusStyles[exam.status] || 'badge-gray'}>{exam.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(exam)} className="btn-ghost btn-sm p-1.5" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(exam.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold font-display text-slate-900">{editingId ? 'Edit Offline Exam' : 'Schedule Offline Exam'}</h2>
            </div>
            <form onSubmit={saveExam} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Exam Name</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Internal Test 1" />
                </div>
                <div>
                  <label className="label">Exam Type</label>
                  <select className="input" value={form.exam_type} onChange={e => setForm(p => ({ ...p, exam_type: e.target.value }))}>
                    <option value="">None</option>
                    {examTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select className="input" required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value, course: '' }))}>
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select className="input" required value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value, course: '' }))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input" required value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} disabled={!form.department}>
                    <option value="">{form.department ? 'Select...' : 'Select dept first'}</option>
                    {courses.map(course => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" required value={form.exam_date} onChange={e => setForm(p => ({ ...p, exam_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" required value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input type="number" min="15" step="5" className="input" required value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Room</label>
                  <input className="input" required value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="B-204" />
                </div>
                <div>
                  <label className="label">Max Marks</label>
                  <input type="number" min="1" className="input" required value={form.max_marks} onChange={e => setForm(p => ({ ...p, max_marks: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['DRAFT', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Instructions</label>
                  <textarea className="input min-h-[86px]" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Reporting time, allowed materials, invigilation notes..." />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>{submitting ? 'Saving...' : 'Save Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteExam}
        title="Delete Offline Exam"
        message="Are you sure you want to delete this offline exam schedule?"
      />
    </div>
  )
}
