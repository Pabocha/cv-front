import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Button from '../components/ui/Button'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { to: '/profile', label: 'Profil', icon: 'profile' },
  { to: '/cvs', label: 'Mes CV', icon: 'cvs' },
  { to: '/templates', label: 'Templates', icon: 'templates' },
  { to: '/cv/new', label: 'Nouveau CV', icon: 'new' },
]

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
  cvs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  new: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
}

function isActive(pathname, to) {
  if (pathname === to) return true
  if (to === '/cvs') {
    return pathname.startsWith('/cvs/') || pathname.startsWith('/cv/')
  }
  return false
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        <Link to="/dashboard" className="px-6 py-6 text-xl font-bold text-white">
          CVPro
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(location.pathname, item.to)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {ICONS[item.icon]}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-800 px-4 py-4">
          <p className="truncate text-sm text-slate-400">{user?.email}</p>
          <Button variant="secondary" onClick={logout} className="w-full bg-slate-800 text-xs text-slate-200 hover:bg-slate-700">
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-56">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link to="/dashboard" className="text-lg font-bold text-indigo-600">
            CVPro
          </Link>
          <Button variant="secondary" onClick={logout} className="text-xs">
            Déconnexion
          </Button>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(location.pathname, item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? 'text-indigo-700' : 'text-slate-500'
              }`}
            >
              {ICONS[item.icon]}
              <span className="max-w-full truncate px-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}