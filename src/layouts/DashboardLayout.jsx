import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Button from '../components/ui/Button'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/profile', label: 'Profil' },
  { to: '/cvs', label: 'Mes CV' },
  { to: '/templates', label: 'Templates' },
  { to: '/cv/new', label: 'Nouveau CV' },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
          CVPro
        </Link>
        <nav className="hidden gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium hover:text-indigo-600 ${
                location.pathname === item.to ? 'text-indigo-600' : 'text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:block">{user?.email}</span>
          <Button variant="secondary" onClick={logout} className="text-xs">
            Déconnexion
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}