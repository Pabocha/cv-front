import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError(null)
    setErrors({})
    setLoading(true)
    try {
      await login(form)
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) setGlobalError(data.detail)
      else setErrors(data || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="mt-1 text-sm text-slate-500">Accédez à votre espace CVPro</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{globalError}</div>
          )}
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}