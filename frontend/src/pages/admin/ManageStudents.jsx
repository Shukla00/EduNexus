import { useState, useEffect } from 'react'
import { studentsApi, departmentsApi } from '../../services/api'
import { Plus, Search, Filter, Trash2, Edit, Eye, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const RISK_BADGE = {
  HIGH: 'risk-high',
  MEDIUM: 'risk-medium',
  LOW: 'risk-low',
}

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ department: '', semester: '', risk_level: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', enrollment_number: '', department: '', semester: 1 })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search) params.search = search
      const [studRes, deptRes] = await Promise.all([studentsApi.list(params), departmentsApi.list()])
      setStudents(studRes.data.results || studRes.data)
      setDepartments(deptRes.data.results || deptRes.data)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const addStudent = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await studentsApi.create(form)
      toast.success('Student added successfully')
      setShowAddModal(false)
      setForm({ email: '', first_name: '', last_name: '', enrollment_number: '', department: '', semester: 1 })
      load()
    } catch (err) {
      const msg = Object.values(err?.response?.data || {}).flat()[0] || 'Failed to add student'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return
    try {
      await studentsApi.delete(id)
      toast.success('Student deleted')
      load()
    } catch {
      toast.error('Failed to delete student')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or enrollment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-44" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={filters.semester} onChange={e => setFilters(p => ({ ...p, semester: e.target.value }))}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select className="input w-36" value={filters.risk_level} onChange={e => setFilters(p => ({ ...p, risk_level: e.target.value }))}>
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrollment</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Attendance</th>
                <th>Avg Marks</th>
                <th>AI Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No students found</td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 text-xs font-bold">{s.full_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{s.full_name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{s.enrollment_number}</td>
                  <td>{s.department_name}</td>
                  <td>Sem {s.semester}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden w-16">
                        <div
                          className={`h-full rounded-full ${s.attendance_percentage >= 75 ? 'bg-emerald-500' : s.attendance_percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${s.attendance_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{s.attendance_percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-medium ${s.average_marks >= 40 ? 'text-slate-900' : 'text-red-600'}`}>{s.average_marks}%</span>
                  </td>
                  <td>
                    <span className={RISK_BADGE[s.ai_risk_level]}>
                      {s.ai_risk_level === 'HIGH' && <AlertTriangle className="w-3 h-3" />}
                      {s.ai_risk_level}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost btn-sm p-1.5" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost btn-sm p-1.5" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete" onClick={() => deleteStudent(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold font-display text-slate-900">Add New Student</h2>
            </div>
            <form onSubmit={addStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input className="input" required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input" required value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Enrollment Number</label>
                <input className="input font-mono" required value={form.enrollment_number} onChange={e => setForm(p => ({ ...p, enrollment_number: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select className="input" required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select className="input" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-400">Default password: student@123 (student can change later)</p>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
