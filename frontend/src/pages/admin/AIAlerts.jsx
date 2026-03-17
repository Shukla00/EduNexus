import { useState, useEffect } from 'react'
import { alertsApi } from '../../services/api'
import { Brain, AlertTriangle, CheckCircle, Eye, Clock, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_BADGE = {
  ATTENDANCE: { cls: 'badge-yellow', label: 'Attendance' },
  MARKS: { cls: 'badge-red', label: 'Marks' },
  COMPREHENSIVE: { cls: 'badge-blue', label: 'Comprehensive' },
  LECTURE: { cls: 'badge-green', label: 'Lecture Reminder' },
  GENERAL: { cls: 'badge-gray', label: 'General' },
}

const RISK_COLORS = {
  HIGH: 'border-l-red-500 bg-red-50/30',
  MEDIUM: 'border-l-amber-500 bg-amber-50/30',
  LOW: 'border-l-emerald-500 bg-emerald-50/30',
}

export default function AIAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', risk: '', resolved: 'false' })
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await alertsApi.list(filter)
      setAlerts(data.results || data)
    } catch {
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const markRead = async (id) => {
    try {
      await alertsApi.markRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch {}
  }

  const resolveAlert = async (id) => {
    try {
      await alertsApi.resolve(id)
      toast.success('Alert resolved')
      load()
    } catch {
      toast.error('Failed to resolve alert')
    }
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-600" />
            AI Alerts
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">AI-generated performance and attendance alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-44" value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="MARKS">Marks</option>
          <option value="COMPREHENSIVE">Comprehensive</option>
          <option value="LECTURE">Lecture Reminder</option>
        </select>
        <select className="input w-36" value={filter.risk} onChange={e => setFilter(p => ({ ...p, risk: e.target.value }))}>
          <option value="">All Risk Levels</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="input w-36" value={filter.resolved} onChange={e => setFilter(p => ({ ...p, resolved: e.target.value }))}>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      ) : alerts.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No alerts found</p>
          <p className="text-slate-400 text-sm">All students are performing well!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`card border-l-4 p-4 ${RISK_COLORS[alert.risk_level]} ${!alert.is_read ? 'ring-1 ring-primary-200' : ''} cursor-pointer hover:shadow-card-hover transition-all`}
              onClick={() => { setSelected(alert); markRead(alert.id) }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.risk_level === 'HIGH' ? 'bg-red-100' : alert.risk_level === 'MEDIUM' ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.risk_level === 'HIGH' ? 'text-red-600' : alert.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {alert.student_name && <span className="font-semibold text-slate-900">{alert.student_name}</span>}
                      {alert.enrollment && <span className="text-xs text-slate-400 font-mono">#{alert.enrollment}</span>}
                      {alert.department_name && <span className="badge-gray">{alert.department_name}</span>}
                      <span className={TYPE_BADGE[alert.alert_type]?.cls || 'badge-gray'}>{TYPE_BADGE[alert.alert_type]?.label}</span>
                      <span className={`badge ${alert.risk_level === 'HIGH' ? 'badge-red' : alert.risk_level === 'MEDIUM' ? 'badge-yellow' : 'badge-green'}`}>
                        {alert.risk_level}
                      </span>
                      {!alert.is_read && <span className="badge bg-blue-600 text-white">New</span>}
                    </div>
                    <p className="text-sm text-slate-600">{alert.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                  {!alert.is_resolved && (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); resolveAlert(alert.id) }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display text-slate-900">Alert Details</h2>
                <button className="btn-ghost p-2" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${selected.risk_level === 'HIGH' ? 'badge-red' : selected.risk_level === 'MEDIUM' ? 'badge-yellow' : 'badge-green'}`}>
                  {selected.risk_level} Risk
                </span>
                <span className={TYPE_BADGE[selected.alert_type]?.cls}>{TYPE_BADGE[selected.alert_type]?.label}</span>
              </div>

              {selected.student_name && (
                <div className="p-3 bg-surface-50 rounded-lg">
                  <p className="font-semibold text-slate-900">{selected.student_name}</p>
                  <p className="text-sm text-slate-500">{selected.enrollment} · {selected.department_name}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Issue Detected</p>
                <p className="text-sm text-slate-600 bg-red-50 border border-red-100 rounded-lg p-3">{selected.message}</p>
              </div>

              {selected.suggestions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-600" /> AI Suggestions
                  </p>
                  <ul className="space-y-2">
                    {selected.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg p-2.5">
                        <span className="text-violet-600 font-bold mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!selected.is_resolved && (
                <button className="btn-primary w-full" onClick={() => { resolveAlert(selected.id); setSelected(null) }}>
                  <CheckCircle className="w-4 h-4" /> Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
