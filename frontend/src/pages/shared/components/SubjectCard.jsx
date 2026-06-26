import React from 'react'

export default function SubjectCard({ subject, data }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-base font-semibold text-slate-900">{subject}</p>
        <span className="text-xs font-medium uppercase text-slate-500">{data?.risk_level || 'Unknown'}</span>
      </div>
      <p className="text-sm text-slate-500">{data?.description || 'No subject details available.'}</p>
    </div>
  )
}
