import { useState, useEffect } from 'react'
import { facultyApi, departmentsApi } from '../../services/api'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageFaculty() {
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ department: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ 
    email: '', first_name: '', last_name: '', employee_id: '', 
    department: '', designation: 'Assistant Professor', 
    specialization: '', experience_years: 0 
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search) params.search = search
      const [facRes, deptRes] = await Promise.all([facultyApi.list(params), departmentsApi.list()])
      setFaculty(facRes.data.results || facRes.data)
      setDepartments(deptRes.data.results || deptRes.data)
    } catch {
      toast.error('Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const addFaculty = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await facultyApi.create(form)
      toast.success('Faculty added successfully')
      setShowAddModal(false)
      setForm({ 
        email: '', first_name: '', last_name: '', employee_id: '', 
        department: '', designation: 'Assistant Professor', 
        specialization: '', experience_years: 0 
      })
      load()
    } catch (err) {
      const msg = Object.values(err?.response?.data || {}).flat()[0] || 'Failed to add faculty'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteFaculty = async (id) => {
    if (!confirm('Delete this faculty member?')) return
    try {
      await facultyApi.delete(id)
      toast.success('Faculty deleted')
      load()
    } catch {
      toast.error('Failed to delete faculty')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Faculty</h1>
          <p className="page-subtitle">{faculty.length} staff members</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or Employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-48" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Specialization</th>
                <th>Exp. (Yrs)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No faculty found</td></tr>
              ) : faculty.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 text-xs font-bold">{f.full_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{f.full_name}</p>
                        <p className="text-xs text-slate-400">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{f.employee_id}</td>
                  <td>{f.department_name || departments.find(d => d.id === f.department)?.name || '-'}</td>
                  <td>{f.designation}</td>
                  <td>{f.specialization || '-'}</td>
                  <td>{f.experience_years}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost btn-sm p-1.5" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteFaculty(f.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold font-display text-slate-900">Add Faculty</h2>
            </div>
            <form onSubmit={addFaculty} className="p-6 space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Employee ID</label>
                  <input className="input font-mono" required value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} placeholder="e.g. EMP1001" />
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
                  <label className="label">Designation</label>
                  <select className="input" required value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Specialization</label>
                  <input className="input" value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} placeholder="e.g. Machine Learning" />
                </div>
                <div>
                  <label className="label">Experience (Years)</label>
                  <input type="number" className="input" min="0" required value={form.experience_years} onChange={e => setForm(p => ({ ...p, experience_years: parseInt(e.target.value) }))} />
                </div>
              </div>
              <p className="text-xs text-slate-400">Default password: faculty@123</p>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
