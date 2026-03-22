import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, GraduationCap, Brain, Shield, Users, BarChart3 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Admin')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.first_name}!`)
      const map = { ADMIN: '/admin', HOD: '/hod', FACULTY: '/faculty', STUDENT: '/student' }
      navigate(map[user.role] || '/')
    } catch (err) {
      toast.error(err?.response?.data?.non_field_errors?.[0] || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl font-display">EduNexus</h1>
              <p className="text-primary-200 text-xs">Smart AI-Enabled College ERP</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Intelligent<br />Academic<br />Management
          </h2>
          <p className="text-primary-200 text-lg leading-relaxed">
            AI-powered insights, automated alerts, and centralized data management for modern educational institutions.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: Brain, label: 'AI Analytics', desc: 'Smart performance insights' },
            { icon: Shield, label: 'Role-based Access', desc: 'Secure multi-role system' },
            { icon: Users, label: 'All Stakeholders', desc: 'Admin, HOD, Faculty, Student' },
            { icon: BarChart3, label: 'Real-time Data', desc: 'Live dashboards & reports' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <Icon className="w-5 h-5 text-primary-200 mb-2" />
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-primary-300 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl font-display text-slate-900">EduNexus</h1>
              <p className="text-slate-500 text-xs">Smart AI-Enabled College ERP</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 font-display">Sign in</h2>
            <p className="text-slate-500 mt-1">Access your EduNexus dashboard</p>
          </div>

          <div className="flex bg-surface-100 p-1 rounded-xl mb-6">
            {['Admin', 'HOD', 'Faculty', 'Student'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-1.5 text-sm rounded-lg transition-all ${
                  selectedRole === role
                    ? 'bg-white text-primary-700 font-bold shadow-sm'
                    : 'text-slate-500 font-medium hover:text-slate-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@institution.edu"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPwd(p => !p)}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Goel Institute of Technology & Management, Lucknow<br />
            Affiliated to Dr. A.P.J. Abdul Kalam Technical University
          </p>
        </div>
      </div>
    </div>
  )
}
