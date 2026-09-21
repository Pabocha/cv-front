import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplates } from '../cv/useCvs'
import { useEntitlements } from '../payment/usePayments'
import { getTemplateThumbnailUrl } from '../../api/templates'
import PaywallModal from '../payment/PaywallModal'

export default function TemplatesPage() {
  const { data: templates, isLoading, isError, refetch } = useTemplates()
  const { data: entitlements } = useEntitlements()
  const isPremium = entitlements?.is_premium
  const [lockedSlug, setLockedSlug] = useState(null)
  const navigate = useNavigate()

  const chooseTemplate = (tpl) => {
    if (tpl.is_premium && !isPremium) {
      setLockedSlug(tpl.slug)
      return
    }
    navigate(`/cv/new?tpl=${tpl.slug}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Choisissez un modèle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Chaque modèle est professionnel, lisible et compatible avec les logicielles
          de tri de CV (ATS).
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Chargement des modèles…</p>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            Impossible de charger les modèles. Vérifiez votre connexion puis réessayez.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates?.map((tpl) => (
            <TemplateCard key={tpl.slug} tpl={tpl} onUse={() => chooseTemplate(tpl)} />
          ))}
        </div>
      )}

      <PaywallModal
        open={lockedSlug !== null}
        onClose={() => setLockedSlug(null)}
        title="Templates Premium"
        message="Les modèles Premium sont réservés aux abonnés. Abonnez-vous à Premium (3 000 FCFA/mois) pour profiter de tous les modèles."
        onSuccess={() => setLockedSlug(null)}
      />
    </div>
  )
}

function TemplateCard({ tpl, onUse }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="pointer-events-none h-64 overflow-hidden bg-slate-100">
        <img
          src={getTemplateThumbnailUrl(tpl.slug)}
          alt={`Aperçu ${tpl.name}`}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
          {tpl.is_premium && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Premium
            </span>
          )}
        </div>
        <p className="flex-1 text-sm text-slate-500">{tpl.description}</p>
        <button
          onClick={onUse}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Utiliser ce modèle
        </button>
      </div>
    </div>
  )
}