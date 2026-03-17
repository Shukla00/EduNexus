import { useState, useEffect } from 'react'
import { studentsApi, departmentsApi } from '../../services/api'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ department: '', semester: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', department: '', credits: 4, semester: 1, description: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search) params.search = search
      const [crsRes, deptRes] = await Promise.all([studentsApi.courses(params), departmentsApi.list()])
      setCourses(crsRes.data.results || crsRes.data)
      setDepartments(deptRes.data.results || deptRes.data)
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const addCourse = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await studentsApi.createCourse(form)
      toast.success('Course added successfully')
      setShowAddModal(false)
      setForm({ name: '', code: '', department: '', credits: 4, semester: 1, description: '' })
      load()
    } catch (err) {
      const msg = Object.values(err?.response?.data || {}).flat()[0] || 'Failed to add course'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course? All associated data will be removed.')) return
    try {
      await studentsApi.deleteCourse(id)
      toast.success('Course deleted')
      load()
    } catch {
      toast.error('Failed to delete course')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Courses</h1>
          <p className="page-subtitle">{courses.length} courses offered</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-48" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-40" value={filters.semester} onChange={e => setFilters(p => ({ ...p, semester: e.target.value }))}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No courses found</td></tr>
              ) : courses.map(c => (
                <tr key={c.id}>
                  <td className="font-mono font-medium text-slate-900">{c.code}</td>
                  <td className="font-medium text-slate-900">{c.name}</td>
                  <td>{c.department_name || departments.find(d => d.id === c.department)?.name || 'Unknown'}</td>
                  <td>Sem {c.semester}</td>
                  <td>{c.credits}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost btn-sm p-1.5" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteCourse(c.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete">
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold font-display text-slate-900">Add Course</h2>
            </div>
            <form onSubmit={addCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label">Course Name</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Data Structures" />
                </div>
                <div>
                  <label className="label">Course Code</label>
                  <input className="input font-mono uppercase" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS201" />
                </div>
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
                  <select className="input" required value={form.semester} onChange={e => setForm(p => ({ ...p, semester: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Credits</label>
                <input type="number" className="input" min="1" max="6" required value={form.credits} onChange={e => setForm(p => ({ ...p, credits: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional syllabus summary..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
