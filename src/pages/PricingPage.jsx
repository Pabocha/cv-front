import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../layouts/PublicLayout'
import Button from '../components/ui/Button'
import { useAuth } from '../features/auth/AuthContext'
import { useEntitlements, useSubscribe } from '../features/payment/usePayments'

const PLANS = [
  {
    slug: 'premium',
    name: 'Premium',
    price: '3 000 FCFA',
    period: '/ mois',
    highlight: true,
    features: [
      'Compte personnel gratuit',
      'Création et génération de CV illimitées',
      'Tous les modèles (6 styles)',
      'Téléchargement PDF illimité',
      'Analyse ATS illimitée',
      'Adaptation à une offre illimitée',
      '2 lettres de motivation / mois',
      'Support prioritaire',
    ],
  },
  {
    slug: 'premium-plus',
    name: 'Premium+',
    price: '5 000 FCFA',
    period: '/ mois',
    highlight: false,
    features: [
      'Tout Premium, sans limite',
      'Lettres de motivation illimitées',
      'Adaptations et analyses illimitées',
      'Support prioritaire renforcé',
      'Nouveaux modèles en avant-première',
    ],
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const entitlements = useEntitlements()
  const subscribe = useSubscribe()
  const [activated, setActivated] = useState(null)
  const isPremium = entitlements.data?.is_premium
  const activePlan = entitlements.data?.plan_slug

  const handleActivate = async (slug) => {
    await subscribe.mutateAsync(slug)
    setActivated(slug)
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Des tarifs simples et accessibles
          </h1>
          <p className="mt-4 text-indigo-100">
            La création de compte est gratuite. Toutes les fonctionnalités de CV
            (création, génération, PDF, ATS, lettres) nécessitent une offre
            Premium. Paiement simulé en démo — sans engagement, résiliable à tout
            moment.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {PLANS.map((plan) => {
              const isActive = isPremium && activePlan === plan.slug
              return (
                <div
                  key={plan.slug}
                  className={`rounded-2xl border bg-white p-8 ${
                    plan.highlight
                      ? 'border-indigo-600 shadow-lg ring-2 ring-indigo-600'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {plan.name}
                    </h3>
                    {isActive && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Abonnement actif
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-2">
                        <span className="text-green-600">✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  {!user ? (
                    <Link
                      to="/register"
                      className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-medium ${
                        plan.highlight
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      Créer un compte puis s’abonner
                    </Link>
                  ) : isActive ? (
                    <div className="mt-6 rounded-lg bg-green-50 py-2.5 text-center text-sm font-medium text-green-700">
                      {activated === plan.slug ? 'Abonnement activé ✓' : 'Offre active'}
                    </div>
                  ) : (
                    <Button
                      className="mt-6 w-full"
                      variant={plan.highlight ? 'primary' : 'secondary'}
                      onClick={() => handleActivate(plan.slug)}
                      disabled={subscribe.isPending}
                    >
                      {subscribe.isPending
                        ? 'Activation…'
                        : `Activer ${plan.name}`}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {subscribe.isError && (
            <p className="mt-4 text-center text-sm text-red-600">
              {subscribe.error?.response?.data?.detail ||
                'Une erreur est survenue lors de l’activation.'}
            </p>
          )}
          {activated && (
            <p className="mt-6 text-center text-sm text-green-700">
              {user ? 'Abonnement activé avec succès. Bonne chance dans vos candidatures !' : ''}
            </p>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">
            Démo : l’abonnement est simulé pour une durée de 30 jours.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-semibold text-slate-900">
              Pas de compte ? À la carte
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Créez un seul CV sans créer de compte : décrivez votre parcours,
              choisissez un modèle, payez 3 000 FCFA et téléchargez le PDF
              (lien valable 48 h).
            </p>
            <Link
              to="/creer-cv"
              className="mt-4 inline-block rounded-lg border border-indigo-600 px-5 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Créer mon CV sans compte
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-semibold text-slate-900">
              Vous ne savez pas rédiger de CV ?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Commandez votre CV sur WhatsApp : notre équipe le crée pour vous,
              vous le recevez sur WhatsApp et payez à la livraison.
            </p>
            <Link
              to="/commander"
              className="mt-4 inline-block rounded-lg border border-indigo-600 px-5 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Commander un CV sur WhatsApp
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}