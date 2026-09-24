import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTemplates, useCreateCv } from './useCvs'
import { getTemplateThumbnailUrl } from '../../api/templates'
import { useEntitlements } from '../payment/usePayments'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PaywallModal from '../payment/PaywallModal'

export default function CvCreatePage() {
  const { data: templates, isLoading: loadingTemplates, isError, refetch } = useTemplates()
  const { data: entitlements } = useEntitlements()
  const createCv = useCreateCv()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isPremium = entitlements?.is_premium
  const initialTpl = searchParams.get('tpl') || 'professionnel'
  const initialPremium =
    !isPremium && templates?.some((t) => t.slug === initialTpl && t.is_premium)

  const [title, setTitle] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [templateSlug, setTemplateSlug] = useState(
    initialPremium ? 'professionnel' : initialTpl,
  )
  const [paywallOpen, setPaywallOpen] = useState(false)

  const trySelectTemplate = (tpl) => {
    if (tpl.is_premium && !isPremium) {
      setPaywallOpen(true)
      return
    }
    setTemplateSlug(tpl.slug)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data } = await createCv.mutateAsync({
      title,
      template: templateSlug,
      target_job: targetJob,
    })
    navigate(`/cv/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau CV</h1>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez les informations de base, puis générez le contenu de votre CV.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Titre du CV
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : CV Développeur Full Stack"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Poste visé
            </label>
            <Input
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="Ex : Développeur Python"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Template
          </label>
          {loadingTemplates ? (
            <p className="text-sm text-slate-400">Chargement des templates…</p>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">
                Impossible de charger les modèles. Vérifiez votre connexion puis réessayez.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {templates?.map((tpl) => (
                <button
                  key={tpl.slug}
                  type="button"
                  onClick={() => trySelectTemplate(tpl)}
                  className={`overflow-hidden rounded-xl border-2 text-left transition ${
                    templateSlug === tpl.slug
                      ? 'border-indigo-600 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${tpl.is_premium && !isPremium ? 'opacity-90' : ''}`}
                >
                  <span className="pointer-events-none flex h-64 overflow-hidden bg-slate-100">
                    <img
                      src={getTemplateThumbnailUrl(tpl.slug)}
                      alt={`Aperçu ${tpl.name}`}
                      loading="lazy"
                      className="mx-auto block h-full max-w-full object-contain"
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2 p-3">
                    <span className="block text-sm font-semibold text-slate-900">
                      {tpl.name}
                    </span>
                    {tpl.is_premium && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Premium
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={createCv.isPending || !title}>
          {createCv.isPending ? 'Création…' : 'Créer le CV'}
        </Button>

        {createCv.isError && (
          <p className="text-sm text-red-600">
            {createCv.error?.response?.data?.detail || 'Erreur lors de la création.'}
          </p>
        )}
      </form>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Templates Premium"
        message="Les modèles Premium sont réservés aux abonnés. Abonnez-vous à Premium (3 000 FCFA/mois) pour profiter de tous les modèles."
        onSuccess={() => setPaywallOpen(false)}
      />
    </div>
  )
}