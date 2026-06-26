import React from 'react'

export default function ConfidenceChart({ subjects }) {
  return (
    <div className="mt-6 bg-white shadow rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Confidence Chart</h3>
      </div>
      <p className="text-sm text-slate-500">Confidence analytics will display here once the AI summary is available.</p>
    </div>
  )
}
