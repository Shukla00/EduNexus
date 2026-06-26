import { useState, useEffect, useRef } from 'react'
import { studentsApi } from '../../services/api'
import { Download, Printer, GraduationCap, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function StudentIDCard() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef(null)

  useEffect(() => {
    studentsApi.me()
      .then(({ data }) => setStudent(data))
      .catch(() => toast.error('Failed to load student data'))
      .finally(() => setLoading(false))
  }, [])

  const print = () => window.print()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  const qrData = JSON.stringify({
    id: student?.enrollment_number,
    name: student?.full_name,
    dept: student?.department_name,
    sem: student?.semester,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Student ID Card</h1>
          <p className="page-subtitle">Your official EduNexus digital identity card</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={print}>
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* ID Card */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-96 rounded-2xl overflow-hidden shadow-2xl bg-white border border-surface-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-900 p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Goel Institute of Technology & Management</p>
                <p className="text-primary-200 text-xs">Lucknow, Uttar Pradesh</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-primary-300 text-xs uppercase tracking-widest">Student Identity Card</p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 flex gap-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {student?.full_name?.[0]}
                </span>
              </div>
              <QRCodeSVG value={qrData} size={72} level="M" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">{student?.full_name}</p>
              </div>
              {[
                { label: 'Enrollment No.', value: student?.enrollment_number, mono: true },
                { label: 'Department', value: student?.department_name },
                { label: 'Semester', value: `Semester ${student?.semester}` },
                { label: 'Academic Year', value: '2024-2025' },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-primary-600 px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-xs">Valid for Academic Year 2024-25</p>
              <p className="text-white text-xs font-medium">Dr. A.P.J. Abdul Kalam Technical University</p>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <QrCode className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">QR Code Information</p>
            <p className="text-xs text-slate-500 mt-1">
              The QR code on your ID card contains your enrollment number, name, department, and semester.
              It can be scanned by faculty for quick attendance verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
