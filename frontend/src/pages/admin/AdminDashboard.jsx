import { useState, useEffect } from 'react'
import { usersApi, alertsApi, studentsApi } from '../../services/api'
import { Users, GraduationCap, Building2, AlertTriangle, Brain, TrendingUp, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'



function StatCard({ icon: Icon, label, value, color, change }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-display">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [alertStats, setAlertStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiRunning, setAiRunning] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([usersApi.stats(), alertsApi.stats()])
        setStats(s.data)
        setAlertStats(a.data)
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const runAI = async () => {
    setAiRunning(true)
    try {
      const { data } = await alertsApi.runAI()
      toast.success(data.message)
    } catch {
      toast.error('AI evaluation failed')
    } finally {
      setAiRunning(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  const totalRisk = alertStats ? alertStats.low + alertStats.medium + alertStats.high : 0;
  const riskData = alertStats ? [
    { name: 'Low Risk', value: alertStats.low, pct: totalRisk ? Math.round(alertStats.low/totalRisk*100) : 0, color: '#10b981' },
    { name: 'Medium Risk', value: alertStats.medium, pct: totalRisk ? Math.round(alertStats.medium/totalRisk*100) : 0, color: '#f59e0b' },
    { name: 'High Risk', value: alertStats.high, pct: totalRisk ? Math.round(alertStats.high/totalRisk*100) : 0, color: '#ef4444' },
  ] : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Institution-wide overview and analytics</p>
        </div>
        <button
          onClick={runAI}
          disabled={aiRunning}
          className="btn-primary gap-2"
        >
          <Brain className="w-4 h-4" />
          {aiRunning ? 'Running AI...' : 'Run AI Evaluation'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats?.total_students} color="bg-blue-600" />
        <StatCard icon={GraduationCap} label="Total Faculty" value={stats?.total_faculty} color="bg-emerald-600" />
        <StatCard icon={Building2} label="Departments" value={stats?.total_departments} color="bg-violet-600" />
        <StatCard icon={AlertTriangle} label="Active AI Alerts" value={stats?.active_alerts} color="bg-amber-500" />
      </div>

      {/* Alert Risk Summary */}
      {alertStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 border-l-4 border-red-500">
            <p className="text-2xl font-bold text-red-600 font-display">{alertStats.high}</p>
            <p className="text-sm text-slate-500">High Risk Students</p>
          </div>
          <div className="card p-4 border-l-4 border-amber-500">
            <p className="text-2xl font-bold text-amber-600 font-display">{alertStats.medium}</p>
            <p className="text-sm text-slate-500">Medium Risk Students</p>
          </div>
          <div className="card p-4 border-l-4 border-emerald-500">
            <p className="text-2xl font-bold text-emerald-600 font-display">{alertStats.low}</p>
            <p className="text-sm text-slate-500">Low Risk Alerts</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 font-display">Attendance Trend</h3>
              <p className="text-xs text-slate-500">Monthly average attendance %</p>
            </div>
            <div className="ai-badge"><Brain className="w-3 h-3" /> AI Monitored</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.attendance_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                formatter={v => [`${v}%`, 'Attendance']}
              />
              <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 font-display">Grade Distribution</h3>
            <p className="text-xs text-slate-500">Across all courses this semester</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.marks_dist || []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(stats?.marks_dist || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Risk Distribution Pie */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 font-display">AI Risk Distribution</h3>
            <p className="text-xs text-slate-500">Student risk level classification</p>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {riskData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-900 ml-auto">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Alert Module Info */}
        <div className="card p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 font-display">AI Engine Status</h3>
              <p className="text-xs text-violet-600 font-medium">Rule-Based Analysis Active</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Attendance threshold', value: '75%' },
              { label: 'Marks threshold', value: '40%' },
              { label: 'Alert cooldown', value: '7 days' },
              { label: 'Last evaluation', value: 'Today, 6:00 AM' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
          <button onClick={runAI} disabled={aiRunning} className="btn-primary w-full mt-4">
            <Activity className="w-4 h-4" />
            {aiRunning ? 'Running...' : 'Trigger Manual Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}
