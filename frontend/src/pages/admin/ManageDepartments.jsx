import { useState, useEffect } from 'react'
import { departmentsApi } from '../../services/api'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import ConfirmModal from '../../components/ConfirmModal'
import toast from 'react-hot-toast'

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const defaultForm = { name: '', code: '', description: '' }
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setShowAddModal(true)
  }

  const openEdit = (d) => {
    setEditingId(d.id)
    setForm({
      name: d.name || '',
      code: d.code || '',
      description: d.description || ''
    })
    setShowAddModal(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await departmentsApi.list()
      setDepartments(res.data.results || res.data)
    } catch {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  )

  const saveDepartment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await departmentsApi.update(editingId, form)
        toast.success('Department updated successfully')
      } else {
        await departmentsApi.create(form)
        toast.success('Department added successfully')
      }
      setShowAddModal(false)
      load()
    } catch (err) {
      const msg = Object.values(err?.response?.data || {}).flat()[0] || 'Failed to save department'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteDepartment = async () => {
    if (!deleteId) return
    try {
      await departmentsApi.delete(deleteId)
      toast.success('Department deleted')
      load()
    } catch {
      toast.error('Failed to delete department')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Departments</h1>
          <p className="page-subtitle">{departments.length} departments available</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-surface-100">
            No departments found
          </div>
        ) : (
          filteredDepartments.map(d => (
            <div key={d.id} className="card p-5 border-l-4 border-l-primary-500 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold mb-2">
                  {d.code}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="btn-ghost btn-sm p-1.5" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(d.id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{d.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{d.description || 'No description provided.'}</p>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold font-display text-slate-900">{editingId ? 'Edit Department' : 'Add Department'}</h2>
            </div>
            <form onSubmit={saveDepartment} className="p-6 space-y-4">
              <div>
                <label className="label">Department Name</label>
                <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Information Technology" />
              </div>
              <div>
                <label className="label">Department Code</label>
                <input className="input font-mono uppercase" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. IT" maxLength={10} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[100px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteDepartment}
        title="Delete Department"
        message="Are you sure you want to delete this department? All associated users and courses may be affected."
      />
    </div>
  )
}
