import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const nav = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-200 font-display">404</p>
        <p className="text-xl font-semibold text-slate-900 mt-4">Page Not Found</p>
        <p className="text-slate-500 mt-2">The page you are looking for doesn't exist.</p>
        <button className="btn-primary mt-6" onClick={() => nav('/')}>Go Home</button>
      </div>
    </div>
  )
}
