import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { guestClaim } from '../api/guest'
import { clearGuestToken, getGuestToken } from '../features/guest/guestToken'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const { user, register } = useAuth()

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(null)

  // Le panneau « réclamé » passe avant la redirection : la réclamation rend le
  // visiteur connecté, donc `user` est déjà renseigné à ce moment-là.
  if (claimed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenue, votre CV vous attend
          </h1>
          <p className="text-sm text-slate-600">{claimed.message}</p>
          <Button
            className="w-full"
            onClick={() => window.location.assign(claimed.url)}
          >
            Modifier mon CV
          </Button>
        </div>
      </div>
    )
  }

  if (user) return <Navigate to="/pricing" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      // Le visiteur qui a payé 3 000 FCFA avant de s'inscrire ne doit pas
      // perdre son CV : on le réclame immédiatement après la création du
      // compte. Le token est effacé seulement en cas de succès.
      const token = getGuestToken()
      if (token) {
        try {
          const { data } = await guestClaim(token)
          clearGuestToken()
          setClaimed(data)
        } catch {
          /* le token reste en localStorage : la page /creer-cv réessaiera */
        }
      }
    } catch (err) {
      const data = err.response?.data
      if (data) setErrors(data)
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text') => (
    <Input
      id={key}
      label={label}
      type={type}
      required={key === 'password'}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      error={Array.isArray(errors[key]) ? errors[key].join(' ') : errors[key]}
    />
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
          <p className="mt-1 text-sm text-slate-500">Commencez à créer vos CV aujourd'hui</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('first_name', 'Prénom')}
          {field('last_name', 'Nom')}
          {field('email', 'Email', 'email')}
          {field('password', 'Mot de passe (min. 8 caractères)', 'password')}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}