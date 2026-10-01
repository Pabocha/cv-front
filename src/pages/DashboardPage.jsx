import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useEntitlements, usePlans } from '../features/payment/usePayments'

const formatCfa = (amount) => new Intl.NumberFormat('fr-FR').format(amount ?? 0)

export default function DashboardPage() {
  const { user } = useAuth()
  const entitlements = useEntitlements()
  const { data: plans } = usePlans()
  const isPremium = entitlements.data?.is_premium
  const premiumPrice = plans?.find((p) => p.slug === 'premium')?.amount_cfa
  // `clean_pdfs_remaining` vaut null quand l'export est illimité (Premium).
  const cleanLeft = entitlements.data?.clean_pdfs_remaining

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
          <div className="flex items-start justify-between gap-6">
            <div>
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Compte gratuit
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Tout est déjà ouvert, sauf le filigrane
              </h2>
              <p className="mt-1 max-w-lg text-sm text-slate-600">
                Création, édition, génération depuis votre profil, aperçu et
                analyse ATS : tout est gratuit, sans limite. Il vous reste{' '}
                <strong>
                  {typeof cleanLeft === 'number' ? cleanLeft : 1} export PDF
                  sans filigrane
                </strong>{' '}
                ce mois-ci ; les suivants restent téléchargeables, mais portent la
                mention « version gratuite ». L&apos;offre Premium ajoute la
                création par prompt, l&apos;adaptation à une offre et les
                lettres de motivation.
              </p>
              {premiumPrice && (
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Premium à {formatCfa(premiumPrice)} FCFA / mois.
                </p>
              )}
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