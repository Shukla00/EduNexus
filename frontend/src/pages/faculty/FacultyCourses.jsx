import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, GraduationCap } from 'lucide-react'
import { facultyApi, studentsApi, timetableApi } from '../../services/api'
import toast from 'react-hot-toast'

const getList = (data) => data.results || data || []

export default function FacultyCourses() {
  const [profile, setProfile] = useState(null)
  const [courses, setCourses] = useState([])
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [profileRes, coursesRes, timetableRes] = await Promise.all([
          facultyApi.me(),
          studentsApi.courses(),
          timetableApi.my(),
        ])
        setProfile(profileRes.data)
        setCourses(getList(coursesRes.data))
        setTimetable(getList(timetableRes.data))
      } catch (err) {
        console.error('Failed to load assigned subjects', err)
        toast.error('Failed to load assigned subjects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const assignedCourses = useMemo(() => {
    const assignedIds = new Set((profile?.courses_assigned || []).map(String))
    const byId = new Map()

    courses
      .filter(course => assignedIds.has(String(course.id)))
      .forEach(course => {
        byId.set(String(course.id), {
          ...course,
          assignmentSource: 'Assigned',
          scheduledSlots: [],
        })
      })

    timetable.forEach(entry => {
      const key = String(entry.course)
      const existing = byId.get(key)
      const course = existing || {
        id: entry.course,
        code: entry.course_code,
        name: entry.course_name,
        department: entry.department,
        department_name: entry.department_name,
        semester: entry.semester,
        credits: '-',
        description: '',
        assignmentSource: 'Timetable',
        scheduledSlots: [],
      }

      course.scheduledSlots = [
        ...(course.scheduledSlots || []),
        {
          id: entry.id,
          date: entry.date,
          room: entry.room,
          time: entry.time_slot_detail
            ? `${entry.time_slot_detail.start_time?.slice(0, 5)} - ${entry.time_slot_detail.end_time?.slice(0, 5)}`
            : '',
        },
      ]
      byId.set(key, course)
    })

    return Array.from(byId.values()).sort((a, b) => {
      const semDiff = Number(a.semester || 0) - Number(b.semester || 0)
      return semDiff || String(a.code || '').localeCompare(String(b.code || ''))
    })
  }, [profile, courses, timetable])

  const semesterCount = new Set(assignedCourses.map(course => course.semester).filter(Boolean)).size
  const scheduledCount = assignedCourses.reduce((sum, course) => sum + (course.scheduledSlots?.length || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">My Subjects</h1>
        <p className="page-subtitle">Subjects and courses assigned to you</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{assignedCourses.length}</p>
            <p className="text-sm text-slate-500">Assigned Subjects</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{scheduledCount}</p>
            <p className="text-sm text-slate-500">Scheduled Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{semesterCount}</p>
            <p className="text-sm text-slate-500">Semesters</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : assignedCourses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No subjects assigned yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Scheduled Slots</th>
              </tr>
            </thead>
            <tbody>
              {assignedCourses.map(course => (
                <tr key={course.id}>
                  <td className="font-mono font-medium text-slate-900">{course.code}</td>
                  <td>
                    <p className="font-medium text-slate-900">{course.name}</p>
                    {course.description && <p className="text-xs text-slate-400 line-clamp-1">{course.description}</p>}
                  </td>
                  <td>{course.department_name || '-'}</td>
                  <td>Sem {course.semester || '-'}</td>
                  <td>{course.credits || '-'}</td>
                  <td>
                    {course.scheduledSlots?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {course.scheduledSlots.slice(0, 3).map(slot => (
                          <span key={slot.id} className="badge-blue">
                            {slot.date ? `${slot.date} ` : ''}{slot.time}
                          </span>
                        ))}
                        {course.scheduledSlots.length > 3 && (
                          <span className="text-xs text-slate-400">+{course.scheduledSlots.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No timetable slot</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
