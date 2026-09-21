import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useEntitlements } from '../features/payment/usePayments'

export default function DashboardPage() {
  const { user } = useAuth()
  const entitlements = useEntitlements()
  const isPremium = entitlements.data?.is_premium

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bienvenue, {user?.first_name || user?.email}
        </p>
      </div>

      {!isPremium && !entitlements.isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Compte gratuit
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Activez votre offre pour créer vos CV
              </h2>
              <p className="mt-1 max-w-lg text-sm text-slate-600">
                La création de compte est gratuite. Activez une offre Premium dès
                3 000 FCFA/mois pour accéder à la création, la génération, le
                PDF, l'ATS, l'adaptation et les lettres de motivation.
              </p>
            </div>
            <Link
              to="/pricing"
              className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Découvrir les offres
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Mon profil" desc="Complétez vos informations pour un CV précis." to="/profile" />
        <Card title="Nouveau CV" desc="Créez votre CV professionnel en quelques étapes." to="/cv/new" />
        <Card title="Mes CV" desc="Consultez et gérez vos CV existants." to="/cvs" />
        <Card title="Templates" desc="Choisissez un style pour votre CV." to="/templates" />
        <Card title="Commander sur WhatsApp" desc="Notre équipe crée votre CV, payez à la livraison." to="/commander" />
      </div>
    </div>
  )
}

function Card({ title, desc, to, disabled }) {
  return (
    <a
      href={to}
      className={`block rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
        disabled ? 'pointer-events-none border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'
      }`}
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </a>
  )
}