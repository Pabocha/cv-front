import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}