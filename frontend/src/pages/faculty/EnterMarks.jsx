import { useState, useEffect } from 'react'
import { timetableApi, studentsApi, marksApi } from '../../services/api'
import { Save, AlertCircle, CheckCircle2, UserX, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EnterMarks() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [semesters, setSemesters] = useState([])
  
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedExamType, setSelectedExamType] = useState('')
  
  const [students, setStudents] = useState([])
  const [marksData, setMarksData] = useState({})
  
  const [saving, setSaving] = useState(false)

  // Load initial data: faculty's assigned courses and exam types
  useEffect(() => {
    Promise.all([
      timetableApi.my(),
      marksApi.examTypes()
    ]).then(([ttRes, examTypesRes]) => {
      const timetable = ttRes.data.results || ttRes.data
      const uniqueCourses = []
      const uniqueSemesters = new Set()
      
      timetable.forEach(entry => {
        if (!uniqueCourses.find(c => c.id === entry.course)) {
          uniqueCourses.push({
            id: entry.course,
            name: entry.course_name,
            code: entry.course_code,
            semester: entry.semester
          })
        }
        if (entry.semester) uniqueSemesters.add(entry.semester)
      })
      
      setCourses(uniqueCourses)
      setSemesters(Array.from(uniqueSemesters).sort())
      setExamTypes(examTypesRes.data.results || examTypesRes.data || [])
    }).catch(err => {
      toast.error('Failed to load initial data')
      console.error(err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  // Auto-select course if only one exists for the selected semester
  useEffect(() => {
    if (selectedSemester) {
      const semCourses = courses.filter(c => c.semester.toString() === selectedSemester.toString())
      if (semCourses.length === 1) {
        setSelectedCourse(semCourses[0].id.toString())
      } else if (!semCourses.find(c => c.id.toString() === selectedCourse)) {
        setSelectedCourse('')
      }
    }
  }, [selectedSemester, courses])

  // Load students and existing marks when selection is complete
  useEffect(() => {
    if (selectedSemester && selectedCourse && selectedExamType) {
      loadStudentsAndMarks()
    } else {
      setStudents([])
      setMarksData({})
    }
  }, [selectedSemester, selectedCourse, selectedExamType])

  const loadStudentsAndMarks = async () => {
    try {
      const studentsRes = await studentsApi.list({ course: selectedCourse })
      const studentsList = studentsRes.data.results || studentsRes.data
      setStudents(studentsList)
      
      // Initialize marksData state
      const initialMarks = {}
      studentsList.forEach(s => {
        initialMarks[s.id] = { marks_obtained: '', is_absent: false }
      })
      
      // Load existing marks if they exist
      try {
        const existingMarksRes = await marksApi.list({ 
          course: selectedCourse, 
          exam_type: selectedExamType 
        })
        const marksList = existingMarksRes.data.results || existingMarksRes.data
        
        marksList.forEach(m => {
          if (initialMarks[m.student]) {
            initialMarks[m.student] = {
              marks_obtained: m.marks_obtained,
              is_absent: m.remarks === 'Absent'
            }
          }
        })
      } catch (e) {
        console.log('No existing marks found or failed to load:', e)
      }
      
      setMarksData(initialMarks)
    } catch (err) {
      toast.error('Failed to load students')
      console.error(err)
    }
  }

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => {
      const current = prev[studentId] || { marks_obtained: '', is_absent: false }
      const updated = { ...current, [field]: value }
      
      if (field === 'is_absent' && value) {
        updated.marks_obtained = 0
      }
      return { ...prev, [studentId]: updated }
    })
  }

  const handleSave = async () => {
    if (!selectedCourse || !selectedExamType) {
      toast.error('Please select both course and exam type')
      return
    }

    const marksPayload = Object.entries(marksData).map(([studentId, data]) => {
      return {
        student: parseInt(studentId),
        marks_obtained: data.marks_obtained === '' ? 0 : parseFloat(data.marks_obtained) || 0,
        remarks: data.is_absent ? 'Absent' : ''
      }
    })

    setSaving(true)
    try {
      await marksApi.bulkEntry({
        course: parseInt(selectedCourse),
        exam_type: parseInt(selectedExamType),
        marks: marksPayload
      })
      toast.success('Marks saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading initial data...</div>
  }

  const filteredCourses = courses.filter(c => selectedSemester ? c.semester.toString() === selectedSemester.toString() : true)
  const currentExamType = examTypes.find(e => e.id.toString() === selectedExamType)
  const maxMarks = currentExamType ? currentExamType.max_marks : 100

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="page-title">Enter Marks</h1>
        <p className="page-subtitle">Record student marks for examinations and assignments</p>
      </div>

      <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
          <select 
            className="input-field"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <select 
            className="input-field"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedSemester && filteredCourses.length === 0}
          >
            <option value="">Select Subject</option>
            {filteredCourses.map(course => (
              <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
          <select 
            className="input-field"
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
          >
            <option value="">Select Exam</option>
            {examTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name} (Max: {type.max_marks})</option>
            ))}
          </select>
        </div>
      </div>

      {students.length > 0 && selectedCourse && selectedExamType ? (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-surface-200 flex justify-between items-center bg-surface-50">
            <div>
              <h3 className="font-semibold text-slate-900">Student List</h3>
              <p className="text-sm text-slate-500">{students.length} students enrolled</p>
            </div>
            <button 
              className="btn-primary flex items-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-surface-100 text-slate-600 text-sm border-y border-surface-200">
                  <th className="p-4 font-medium">S.No.</th>
                  <th className="p-4 font-medium">Enrollment No.</th>
                  <th className="p-4 font-medium">Student Name</th>
                  <th className="p-4 font-medium text-center">Absent</th>
                  <th className="p-4 font-medium w-48">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 text-sm">
                {students.map((student, index) => {
                  const data = marksData[student.id] || { marks_obtained: '', is_absent: false }
                  const isAbsent = data.is_absent
                  
                  return (
                    <tr key={student.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="p-4 text-slate-500">{index + 1}</td>
                      <td className="p-4 font-medium text-slate-900">{student.enrollment_number}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {student.user.first_name[0]}{student.user.last_name ? student.user.last_name[0] : ''}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.user.first_name} {student.user.last_name}</p>
                            <p className="text-xs text-slate-500">{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={isAbsent}
                            onChange={(e) => handleMarkChange(student.id, 'is_absent', e.target.checked)}
                          />
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isAbsent ? 'bg-red-100 text-red-600' : 'bg-surface-100 text-slate-400 hover:bg-surface-200'}`}>
                            {isAbsent ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </label>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            className={`input-field w-full pr-12 font-medium ${isAbsent ? 'bg-surface-100 text-slate-400 opacity-50 cursor-not-allowed' : ''}`}
                            value={data.marks_obtained}
                            onChange={(e) => handleMarkChange(student.id, 'marks_obtained', e.target.value)}
                            disabled={isAbsent}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                            / {maxMarks}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (selectedSemester && selectedCourse && selectedExamType) ? (
        <div className="card p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-900">No Students Found</p>
          <p>There are no students enrolled in this course.</p>
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-500">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-900">Select Options</p>
          <p>Please select a semester, subject, and exam type to view students.</p>
        </div>
      )}
    </div>
  )
}
