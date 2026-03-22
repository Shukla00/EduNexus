import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">{title || "Confirm Deletion"}</h2>
          <p className="text-slate-500 mb-6 text-sm">{message || "Are you sure you want to delete this? This action cannot be undone."}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5"
            >
              No, Cancel
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex-1"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
