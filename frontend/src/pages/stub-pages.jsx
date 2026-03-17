import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { alertsApi, attendanceApi, authApi, facultyApi, marksApi, studentsApi, timetableApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Activity, AlertCircle, BookOpen, Calendar, Check, Clock, Edit3, Filter, Key, Lock, MapPin, TrendingUp, User, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function HODDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ students: 0, faculty: 0, alerts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.department) return
      try {
        const dept = user.department
        const [studRes, facRes, altRes] = await Promise.all([
          studentsApi.list({ department: dept }),
          facultyApi.list({ department: dept }),
          alertsApi.list({ resolved: false }) // Backend automatically filters by HOD's dept
        ])
        
        // Handle paginated responses
        setStats({
          students: studRes.data.count ?? studRes.data.length,
          faculty: facRes.data.count ?? facRes.data.length,
          alerts: altRes.data.count ?? altRes.data.length
        })
      } catch (e) {
        console.error('Failed to load HOD stats', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-surface-200 pb-4">
        <div>
          <h1 className="page-title">HOD Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.first_name} {user?.last_name} | {user?.department_name || 'Your Department'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Students', value: stats.students, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active Alerts', value: stats.alerts, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Faculty Count', value: stats.faculty, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' }
        ].map((s, i) => (
          <div key={s.label} className="card p-6 flex items-center gap-5 hover:shadow-lg transition-shadow">
            <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center`}>
              {loading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <s.icon className={`w-7 h-7 ${s.color}`} />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{loading ? '-' : s.value}</p>
              <p className="font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 border-t-4 border-t-primary-500">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <a href="/hod/performance" className="btn-secondary justify-center">View Dept Performance</a>
          <a href="/hod/alerts" className="btn-secondary justify-center text-red-600 hover:bg-red-50">Review AI Alerts</a>
        </div>
      </div>
    </div>
  )
}

// Dept Performance

export function DeptPerformance() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!user?.department) return
      try {
        const [statsRes, crsRes] = await Promise.all([
          attendanceApi.stats({ department: user.department }),
          studentsApi.courses({ department: user.department })
        ])
        setStats(statsRes.data)
        
        const courseList = crsRes.data.results || crsRes.data
        const courseDataPromises = courseList.map(async c => {
          let passRate = 0
          let attendance = 0
          try {
            const m = await marksApi.analytics(c.id)
            passRate = m.data.pass_percentage || 0
          } catch {}
          try {
            const a = await attendanceApi.stats({ course: c.id })
            attendance = a.data.average_attendance || 0
          } catch {}
          return {
            name: c.code,
            fullName: c.name,
            passRate,
            attendance
          }
        })
        const realCourseData = await Promise.all(courseDataPromises)
        setCourses(realCourseData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Department Performance</h1>
        <p className="page-subtitle">Overview of academic metrics for {user?.department_name || 'your department'}</p>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-50 to-white">
              <Activity className="w-10 h-10 text-indigo-500 mb-3" />
              <p className="text-4xl font-bold text-slate-900 mb-1">{stats?.average_attendance || 0}%</p>
              <p className="text-sm font-medium text-slate-500">Average Department Attendance</p>
            </div>
            <div className="card p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-50 to-white border-l-4 border-l-orange-400">
              <Users className="w-10 h-10 text-orange-500 mb-3" />
              <p className="text-4xl font-bold text-slate-900 mb-1">{stats?.low_attendance_count || 0}</p>
              <p className="text-sm font-medium text-slate-500">Students with Low Attendance (&lt;75%)</p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">Course Analytics Snapshot</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courses} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="passRate" name="Est. Pass Rate %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="attendance" name="Avg. Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-400 mt-4">* Note: Course specific data is a representative aggregate. Use the detailed marks page for exact figures.</p>
          </div>
        </>
      )}
    </div>
  )
}

// Manage Faculty
export function ManageFaculty() {
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Manage Faculty</h1>
      <div className="card p-6 mt-6"><p className="text-slate-500">Faculty management interface. Add, edit, and manage faculty records here.</p></div>
    </div>
  )
}

// Manage Departments
export function ManageDepartments() {
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Manage Departments</h1>
      <div className="card p-6 mt-6"><p className="text-slate-500">Department management interface.</p></div>
    </div>
  )
}

// Manage Courses
export function ManageCourses() {
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Manage Courses</h1>
      <div className="card p-6 mt-6"><p className="text-slate-500">Course catalog and management interface.</p></div>
    </div>
  )
}

// Manage Timetable
export function ManageTimetable() {
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Timetable Management</h1>
      <div className="card p-6 mt-6"><p className="text-slate-500">Create and manage department timetables here.</p></div>
    </div>
  )
}

// Enter Marks

export function EnterMarks() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [marksData, setMarksData] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [crsRes, examRes] = await Promise.all([
          studentsApi.courses({ department: user?.department }),
          marksApi.examTypes()
        ])
        setCourses(crsRes.data.results || crsRes.data)
        setExamTypes(examRes.data.results || examRes.data)
      } catch (e) {
        console.error('Failed to load dropdowns', e)
      } finally {
        setLoading(false)
      }
    }
    if (user?.department) loadDropdowns()
  }, [user])

  useEffect(() => {
    if (!selectedCourse || !selectedExam) {
      setStudents([])
      setMarksData({})
      return
    }

    const course = courses.find(c => c.id.toString() === selectedCourse)
    if (!course) return

    const loadStudents = async () => {
      setLoading(true)
      try {
        // Fetch students in the same department and semester as the selected course
        const res = await studentsApi.list({ department: course.department, semester: course.semester })
        const studList = res.data.results || res.data
        setStudents(studList)
        
        // Init marks state
        const initialMarks = {}
        studList.forEach(s => {
          initialMarks[s.id] = { marks_obtained: '', remarks: '' }
        })
        setMarksData(initialMarks)
      } catch (e) {
        toast.error('Failed to load students for this class')
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [selectedCourse, selectedExam, courses])

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }))
  }

  const submitMarks = async () => {
    const records = Object.entries(marksData)
      .filter(([_, data]) => data.marks_obtained !== '')
      .map(([studentId, data]) => ({
        student: parseInt(studentId),
        marks_obtained: parseFloat(data.marks_obtained),
        remarks: data.remarks
      }))

    if (records.length === 0) {
      toast.error('Please enter marks for at least one student')
      return
    }

    const maxMarks = examTypes.find(e => e.id.toString() === selectedExam)?.max_marks || 100

    setSubmitting(true)
    try {
      await marksApi.bulkEntry({
        course: parseInt(selectedCourse),
        exam_type: parseInt(selectedExam),
        marks: records.map(r => ({ ...r, max_marks: maxMarks }))
      })
      toast.success(`${records.length} marks saved successfully`)
    } catch (e) {
      toast.error('Failed to save marks')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Enter Marks</h1>
        <p className="page-subtitle">Submit examination scores for your classes</p>
      </div>

      <div className="card p-5 flex flex-wrap gap-4 items-end bg-gradient-to-r from-slate-50 to-white">
        <div className="flex-1 min-w-[200px]">
          <label className="label text-xs">Select Course</label>
          <select className="input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">-- Choose a Course --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name} (Sem {c.semester})</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label text-xs">Exam Type</label>
          <select className="input" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
            <option value="">-- Choose Exam --</option>
            {examTypes.map(e => <option key={e.id} value={e.id}>{e.name} (Max: {e.max_marks})</option>)}
          </select>
        </div>
        <button 
          className="btn-primary" 
          disabled={!selectedCourse || !selectedExam || students.length === 0 || submitting}
          onClick={submitMarks}
        >
          {submitting ? 'Saving...' : <><Check className="w-4 h-4" /> Save All Marks</>}
        </button>
      </div>

      {loading && selectedCourse ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : students.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-surface-200 flex justify-between items-center">
            <span className="font-bold text-slate-800 flex items-center gap-2"><Edit3 className="w-4 h-4 text-primary-500" /> Mark Entry List</span>
            <span className="text-sm font-medium text-slate-500">{students.length} students found</span>
          </div>
          <div className="table-container border-0 rounded-none shadow-none">
            <table>
              <thead>
                <tr>
                  <th className="w-16">S.No</th>
                  <th>Enrollment</th>
                  <th>Student Name</th>
                  <th className="w-32">Marks Obtained</th>
                  <th>Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="text-slate-400 font-medium">{idx + 1}</td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{s.enrollment_number}</td>
                    <td className="font-medium text-slate-900">{s.full_name}</td>
                    <td>
                      <input 
                        type="number" 
                        className="input py-1.5 focus:ring-1 text-center font-bold text-primary-700" 
                        min="0"
                        max={examTypes.find(e => e.id.toString() === selectedExam)?.max_marks || 100}
                        placeholder="--"
                        value={marksData[s.id]?.marks_obtained || ''}
                        onChange={e => handleMarkChange(s.id, 'marks_obtained', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        className="input py-1.5 focus:ring-1" 
                        placeholder="e.g. Absent or Medical"
                        value={marksData[s.id]?.remarks || ''}
                        onChange={e => handleMarkChange(s.id, 'remarks', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedCourse && selectedExam ? (
        <div className="card p-12 text-center text-slate-500">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>No students found for this course's semester.</p>
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400 border-dashed border-2 bg-transparent shadow-none">
          Please select a course and exam type to begin entering marks.
        </div>
      )}
    </div>
  )
}

// Faculty Timetable

export function FacultyTimetable() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await timetableApi.my()
        setEntries(res.data)
      } catch (e) {
        console.error('Failed to load timetable', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Your weekly lecture schedule</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            <Calendar className="w-4 h-4" /> This Week
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 flex flex-col items-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <p>No lectures assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map(day => {
            const dayEntries = entries.filter(e => e.time_slot_detail?.day === day)
            if (dayEntries.length === 0) return null
            
            return (
              <div key={day} className="card overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-surface-200 font-bold text-slate-900">
                  {day}
                </div>
                <div className="p-5 space-y-4">
                  {dayEntries.sort((a,b) => a.time_slot_detail?.start_time.localeCompare(b.time_slot_detail?.start_time)).map(entry => (
                    <div key={entry.id} className="relative pl-4 border-l-2 border-primary-500">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary-500" />
                      <p className="font-bold text-slate-900">{entry.course_code} - {entry.course_name}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 
                          {entry.time_slot_detail?.start_time?.substring(0,5)} - {entry.time_slot_detail?.end_time?.substring(0,5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> 
                          {entry.room || 'TBA'}
                        </span>
                      </div>
                      <div className="mt-2 inline-block px-2 py-0.5 bg-surface-100 text-slate-600 text-xs rounded">
                        Sem {entry.semester} | {entry.department_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Student pages

export function MyAttendance() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await attendanceApi.mySummary()
        setSummaries(res.data)
      } catch (e) {
        console.error('Failed to load attendance', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalClasses = summaries.reduce((acc, curr) => acc + curr.total_classes, 0)
  const totalPresent = summaries.reduce((acc, curr) => acc + curr.present_count, 0)
  const avgAttendance = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Detailed attendance summary for all your courses</p>
        </div>
        <div className="card p-3 px-5 flex items-center gap-4 bg-primary-50 border-primary-200">
          <Activity className="w-8 h-8 text-primary-600" />
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
            <p className="text-2xl font-bold tracking-tight text-primary-700">{loading ? '--' : avgAttendance}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-surface-100">
            No attendance records found for your courses.
          </div>
        ) : (
          summaries.map(s => (
            <div key={s.id} className="card p-5 group hover:shadow-lg transition-all border-t-4" 
                 style={{ borderTopColor: s.percentage >= 75 ? '#10b981' : s.percentage >= 60 ? '#f59e0b' : '#ef4444' }}>
              <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{s.course_code}</h3>
              <p className="text-sm text-slate-500 line-clamp-1 mb-4">{s.course_name}</p>
              
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Attendance</span>
                <span className={s.percentage >= 75 ? 'text-emerald-600' : s.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}>
                  {s.percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-200 rounded-full overflow-hidden mb-5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${s.percentage >= 75 ? 'bg-emerald-500' : s.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${s.percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-surface-50 rounded-lg p-2 border border-surface-100">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Classes</p>
                  <p className="font-bold text-slate-900">{s.total_classes}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                  <p className="text-emerald-600/70 text-xs font-semibold uppercase">Present</p>
                  <p className="font-bold text-emerald-700">{s.present_count}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function MyMarks() {
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marksApi.myMarks()
        setMarks(res.data)
      } catch (e) {
        console.error('Failed to load marks', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const coursesMap = marks.reduce((acc, curr) => {
    if (!acc[curr.course]) acc[curr.course] = { code: curr.course_code, name: curr.course_name, exams: [] }
    acc[curr.course].exams.push(curr)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Marks</h1>
        <p className="page-subtitle">Your academic performance and grade card</p>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : marks.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          No marks have been uploaded for you yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(coursesMap).map(course => {
            const totalMax = course.exams.reduce((a, c) => a + c.max_marks, 0)
            const totalObtained = course.exams.reduce((a, c) => a + c.marks_obtained, 0)
            const overallPct = ((totalObtained / totalMax) * 100).toFixed(1)
            
            return (
              <div key={course.code} className="card overflow-hidden">
                <div className="bg-slate-50 px-5 py-4 border-b border-surface-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{course.code}</h3>
                    <p className="text-sm font-medium text-slate-500">{course.name}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border font-bold ${overallPct >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {overallPct}%
                  </div>
                </div>
                <div className="table-container border-0 rounded-none shadow-none">
                  <table>
                    <thead>
                      <tr className="bg-white">
                        <th>Exam Type</th>
                        <th>Marks Obtained</th>
                        <th>Max Marks</th>
                        <th>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.exams.map(exam => (
                        <tr key={exam.id}>
                          <td className="font-medium text-slate-700">{exam.exam_type_name}</td>
                          <td className="font-bold text-slate-900">{exam.marks_obtained}</td>
                          <td className="text-slate-500">{exam.max_marks}</td>
                          <td>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${['A+', 'A', 'B+'].includes(exam.grade) ? 'bg-emerald-100 text-emerald-700' : ['B', 'C'].includes(exam.grade) ? 'bg-blue-100 text-blue-700' : ['D'].includes(exam.grade) ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {exam.grade}
                            </span>
                          </td>
                          <td className="text-sm text-slate-500">{exam.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MyTimetable() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const studRes = await studentsApi.me()
        const student = studRes.data
        if (student?.department && student?.semester) {
          const ttRes = await timetableApi.list({ department: student.department, semester: student.semester })
          setEntries(ttRes.data.results || ttRes.data)
        }
      } catch (e) {
        console.error('Failed to load timetable', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Your weekly class schedule</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4" /> Current Semester
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 flex flex-col items-center">
          <Clock className="w-12 h-12 text-slate-300 mb-3" />
          <p>No timetable available for your current semester.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map(day => {
            const dayEntries = entries.filter(e => e.time_slot_detail?.day === day)
            if (dayEntries.length === 0) return null
            
            return (
              <div key={day} className="card overflow-hidden">
                <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 font-bold text-indigo-900 border-t-4 border-t-indigo-400">
                  {day}
                </div>
                <div className="p-5 space-y-4">
                  {dayEntries.sort((a,b) => a.time_slot_detail?.start_time.localeCompare(b.time_slot_detail?.start_time)).map(entry => (
                    <div key={entry.id} className="relative pl-4 border-l-2 border-indigo-400">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="font-bold text-slate-900">{entry.course_code}</p>
                      <p className="text-sm font-medium text-slate-600 line-clamp-1">{entry.course_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 
                          {entry.time_slot_detail?.start_time?.substring(0,5)} - {entry.time_slot_detail?.end_time?.substring(0,5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 lg:mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                           {entry.faculty_name}
                        </span>
                        <span className="flex items-center gap-1 font-medium bg-surface-100 px-1.5 py-0.5 rounded">
                           Room {entry.room || 'TBA'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Profile

export function ProfilePage() {
  const { user, fetchMe } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.updateMe(profileForm)
      toast.success('Profile updated successfully')
      fetchMe()
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match')
    }
    setLoading(true)
    try {
      await authApi.changePassword({ 
        old_password: passwordForm.old_password, 
        new_password: passwordForm.new_password 
      })
      toast.success('Password changed successfully')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="card shadow-md">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-8 flex flex-col items-center justify-center text-white h-48 border-b-4 border-b-primary-700">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border-2 border-white/50 shadow-inner">
              <span className="text-3xl font-bold">{user?.first_name?.[0]}</span>
            </div>
            <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
            <p className="text-primary-100 text-sm font-medium">{user?.role} | {user?.department_name || 'No Dept'}</p>
          </div>
          
          <form className="p-6 space-y-4" onSubmit={updateProfile}>
            <div className="flex items-center gap-2 mb-4 font-bold text-slate-800">
              <User className="w-5 h-5 text-primary-500" />
              <h3>Basic Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input bg-surface-50" required value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input bg-surface-50" required value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Email Address <span className="text-xs text-slate-400 font-normal ml-1">(Cannot be changed)</span></label>
              <input className="input bg-surface-100 text-slate-500 cursor-not-allowed" disabled value={user?.email || ''} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input focus:ring-primary-500 transition-all" placeholder="Enter phone..." value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="card shadow-md flex flex-col">
          <div className="p-6 border-b border-surface-200 bg-surface-50">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Lock className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg">Security & Password</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">Ensure your account uses a strong, unique password.</p>
          </div>
          <form className="p-6 space-y-4 flex-1 flex flex-col" onSubmit={changePassword}>
            <div>
              <label className="label">Current Password</label>
              <input type="password" required className="input bg-white" placeholder="••••••••" value={passwordForm.old_password} onChange={e => setPasswordForm(p => ({ ...p, old_password: e.target.value }))} />
            </div>
            <div>
              <label className="label flex justify-between">
                New Password
              </label>
              <input type="password" required className="input bg-white" minLength="6" placeholder="••••••••" value={passwordForm.new_password} onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" required className="input bg-white" minLength="6" placeholder="••••••••" value={passwordForm.confirm_password} onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} />
            </div>
            <div className="mt-auto pt-4">
              <button type="submit" className="btn-secondary w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300" disabled={loading}>
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
