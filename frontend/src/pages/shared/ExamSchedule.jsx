import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, MapPin, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { departmentsApi, examSchedulesApi, studentsApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const getList = (data) => data.results || data || []
const statusStyles = {
  DRAFT: 'badge-gray',
  SCHEDULED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
}

function formatTime(value) {
  return value ? value.slice(0, 5) : '--'
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

export default function ExamSchedule() {
  const { user, isStudent, isFaculty } = useAuth()
  const [student, setStudent] = useState(null)
  const [departments, setDepartments] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    department: user?.department || '',
    semester: '',
    status: 'SCHEDULED',
    search: '',
  })

  useEffect(() => {
    const loadContext = async () => {
      try {
        if (isStudent) {
          const res = await studentsApi.me()
          setStudent(res.data)
          setFilters(p => ({
            ...p,
            department: res.data.department || '',
            semester: res.data.semester || '',
            status: 'SCHEDULED',
          }))
          return
        }

        const deps = await departmentsApi.list()
        setDepartments(getList(deps.data))
        if (user?.department) {
          setFilters(p => ({ ...p, department: user.department }))
        }
      } catch {
        toast.error('Failed to load exam context')
      }
    }

    loadContext()
  }, [isStudent, user?.department])

  const loadExams = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
      const res = await examSchedulesApi.list(params)
      setExams(getList(res.data))
    } catch {
      toast.error('Failed to load exam schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isStudent && (!filters.department || !filters.semester)) return
    loadExams()
  }, [filters.department, filters.semester, filters.status])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!isStudent || (filters.department && filters.semester)) loadExams()
    }, 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const today = new Date().toISOString().slice(0, 10)
  const visibleExams = useMemo(() => {
    const sorted = [...exams].sort((a, b) => {
      const left = `${a.exam_date} ${a.start_time}`
      const right = `${b.exam_date} ${b.start_time}`
      return left.localeCompare(right)
    })
    return isStudent ? sorted.filter(exam => exam.exam_date >= today && exam.status === 'SCHEDULED') : sorted
  }, [exams, isStudent, today])

  const stats = useMemo(() => ({
    total: visibleExams.length,
    upcoming: visibleExams.filter(exam => exam.exam_date >= today && exam.status === 'SCHEDULED').length,
    semesters: new Set(visibleExams.map(exam => exam.semester).filter(Boolean)).size,
    rooms: new Set(visibleExams.map(exam => exam.room).filter(Boolean)).size,
  }), [visibleExams, today])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">{isStudent ? 'Upcoming Exams' : 'Exam Schedule'}</h1>
        <p className="page-subtitle">
          {isStudent
            ? `${student?.department_name || 'Your department'} · Semester ${student?.semester || '-'}`
            : 'View offline internal exams by department and semester'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile icon={CalendarCheck} label="Visible Exams" value={stats.total} tone="bg-primary-600" />
        <StatTile icon={Clock} label="Upcoming" value={stats.upcoming} tone="bg-emerald-600" />
        <StatTile icon={CalendarCheck} label="Semesters" value={stats.semesters} tone="bg-slate-700" />
        <StatTile icon={MapPin} label="Rooms" value={stats.rooms} tone="bg-amber-500" />
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

        {!isStudent && (
          <>
            <select className="input w-48" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
              <option value="">{isFaculty ? 'My Department' : 'All Departments'}</option>
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
          </>
        )}
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
                <th>Semester</th>
                <th>Date & Time</th>
                <th>Room</th>
                <th>Marks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleExams.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No exams found</td></tr>
              ) : visibleExams.map(exam => (
                <tr key={exam.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{exam.name}</p>
                    <p className="text-xs text-slate-500">{exam.exam_type_name || 'Internal offline exam'}</p>
                  </td>
                  <td>
                    <p className="font-medium text-slate-900">{exam.course_code}</p>
                    <p className="text-xs text-slate-500">{exam.course_name}</p>
                  </td>
                  <td>
                    <p>Sem {exam.semester}</p>
                    <p className="text-xs text-slate-500">{exam.department_name}</p>
                  </td>
                  <td>
                    <p className="font-medium text-slate-900">{exam.exam_date}</p>
                    <p className="text-xs text-slate-500">{formatTime(exam.start_time)} - {formatTime(exam.end_time)} ({exam.duration_minutes} min)</p>
                  </td>
                  <td>{exam.room}</td>
                  <td>{exam.max_marks}</td>
                  <td><span className={statusStyles[exam.status] || 'badge-gray'}>{exam.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
