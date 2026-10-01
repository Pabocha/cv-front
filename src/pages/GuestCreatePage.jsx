import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  formatCfa,
  guestClaim,
  guestConfirmPayment,
  guestDownloadPdf,
  guestGenerate,
  guestInitiate,
  guestPay,
  guestSetTemplate,
  guestStatus,
} from '../api/guest'
import {
  clearGuestToken,
  getGuestToken,
  setGuestToken,
} from '../features/guest/guestToken'
import { getTemplates, getTemplateThumbnailUrl } from '../api/templates'
import { useAuth } from '../features/auth/AuthContext'
import Button from '../components/ui/Button'

const MIN_DESCRIPTION = 30

export default function GuestCreatePage() {
  const { user } = useAuth()

  const [description, setDescription] = useState('')
  const [state, setState] = useState(null)
  const [selected, setSelected] = useState('professionnel')
  const [resumed, setResumed] = useState(false)
  const [claimed, setClaimed] = useState(null)

  // Reprise : un token non réclamé dans le localStorage permet de retrouver un
  // parcours payé la veille au lieu d'encaisser un second paiement.
  useEffect(() => {
    const token = getGuestToken()
    if (!token) return
    let cancelled = false
    guestStatus(token)
      .then(({ data }) => {
        if (cancelled) return
        setState(data)
        setSelected(data.template || 'professionnel')
        setResumed(true)
      })
      .catch(() => clearGuestToken())
    return () => {
      cancelled = true
    }
  }, [])

  const initiate = useMutation({
    mutationFn: guestInitiate,
    onSuccess: ({ data }) => {
      setGuestToken(data.token)
      setState(data)
      setSelected('professionnel')
      setResumed(false)
    },
  })

  const pay = useMutation({
    mutationFn: async (templateSlug) => {
      const paid = await guestPay(state.token, templateSlug)
      const confirmed = await guestConfirmPayment(state.token)
      return { paid: paid.data, confirmed: confirmed.data }
    },
    onSuccess: ({ confirmed }) => setState(confirmed),
  })

  const generate = useMutation({
    mutationFn: () => guestGenerate(state.token),
    onSuccess: ({ data }) => setState(data),
  })

  const applyTemplate = useMutation({
    mutationFn: (slug) => guestSetTemplate(state.token, slug),
    onSuccess: ({ data }) => setState((prev) => ({ ...prev, ...data })),
  })

  const downloadPdf = useMutation({
    mutationFn: async () => {
      const { data } = await guestDownloadPdf(state.token)
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-${state.token.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    },
  })

  const claim = useMutation({
    mutationFn: () => guestClaim(state.token),
    onSuccess: ({ data }) => {
      clearGuestToken()
      setClaimed(data)
    },
  })

  const startOver = () => {
    clearGuestToken()
    setState(null)
    setDescription('')
    setResumed(false)
    setClaimed(null)
  }

  if (claimed) {
    return (
      <ResultPanel tone="success">
        <p className="text-lg font-semibold text-green-900">
          Votre CV est dans votre espace ✓
        </p>
        <p className="mt-1 text-sm text-green-700">{claimed.message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => window.location.assign(claimed.url)}>
            Modifier mon CV
          </Button>
          <Button variant="secondary" onClick={startOver}>
            Créer un autre CV
          </Button>
        </div>
      </ResultPanel>
    )
  }

  const step = state
    ? state.claimed
      ? 4
      : state.generated
        ? 3
        : state.paid
          ? 2
          : 1
    : 0

  const canChooseTemplate = state?.generated

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Créez votre CV en 2 minutes, sans compte
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Décrivez votre parcours, payez {state ? formatCfa(state.price_cfa) : '3 000'}{' '}
          FCFA une seule fois, et obtenez un CV structuré parmi 6 modèles. Sans
          compte : PDF uniquement. Créez un compte gratuit pour le modifier.
        </p>
      </div>

      <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
        {['Description', 'Paiement', 'Génération', 'Choix du modèle'].map(
          (label, index) => (
            <li
              key={label}
              className={`flex items-center gap-2 ${
                step > index ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold">
                {step > index ? '✓' : index + 1}
              </span>
              {label}
            </li>
          ),
        )}
      </ol>

      {!state && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Décrivez votre parcours
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Ex : Awa Diop, développeuse Django avec 4 ans d'expérience chez Sonatel. Compétences : Python, Django, PostgreSQL. Diplômée d'une licence en informatique. Poste visé : développeuse backend."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => initiate.mutate(description.trim())}
              disabled={initiate.isPending || description.trim().length < MIN_DESCRIPTION}
            >
              {initiate.isPending ? 'Enregistrement…' : 'Continuer'}
            </Button>
            <span className="text-sm text-slate-400">
              {description.trim().length < MIN_DESCRIPTION
                ? `${MIN_DESCRIPTION - description.trim().length} caractères minimum`
                : 'Aucun appel IA ni paiement à cette étape.'}
            </span>
          </div>
          {initiate.isError && (
            <ErrorMessage error={initiate.error} />
          )}
        </div>
      )}

      {state && (
        <div className="space-y-4">
          {resumed && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
              Parcours retrouvé : votre lien reste valable 48 h.
              <button
                type="button"
                onClick={startOver}
                className="ml-2 font-medium underline"
              >
                Repartir de zéro
              </button>
            </div>
          )}

          {step === 1 && (
            <ResultPanel tone="neutral">
              <p className="text-lg font-semibold text-slate-900">
                Payez {formatCfa(state.price_cfa)} FCFA pour générer votre CV
              </p>
              <p className="mt-1 text-sm text-slate-600">
                La génération IA n'est lancée qu'après paiement : aucun euro n'est
                engagé avant. Paiement unique, sans abonnement.
              </p>
              <Button
                className="mt-4"
                onClick={() => pay.mutate(selected)}
                disabled={pay.isPending}
              >
                {pay.isPending
                  ? 'Paiement en cours…'
                  : `Payer ${formatCfa(state.price_cfa)} FCFA`}
              </Button>
              {pay.isError && <ErrorMessage error={pay.error} />}
            </ResultPanel>
          )}

          {step === 2 && (
            <ResultPanel tone="success">
              <p className="text-lg font-semibold text-green-900">
                Paiement confirmé ✓
              </p>
              <p className="mt-1 text-sm text-green-700">
                Nous structurons maintenant votre parcours en CV.
              </p>
              <Button
                className="mt-4"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                {generate.isPending ? 'Structuration en cours…' : 'Générer mon CV'}
              </Button>
              {generate.isError && <ErrorMessage error={generate.error} />}
            </ResultPanel>
          )}

          {state.generated && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  Choisissez votre modèle
                </h2>
                <span className="text-sm text-slate-500">
                  {state.generated_content?.header?.full_name} ·{' '}
                  {formatCfa(state.price_cfa)} FCFA / CV
                </span>
              </div>

              {canChooseTemplate && (
                <TemplatePicker
                  selected={selected}
                  onSelect={(slug) => {
                    setSelected(slug)
                    applyTemplate.mutate(slug)
                  }}
                />
              )}

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-900">
                  Votre CV est prêt
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Téléchargez le PDF, ou créez un compte gratuit pour le modifier
                  à l'aise.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => downloadPdf.mutate()}
                    disabled={downloadPdf.isPending}
                  >
                    {downloadPdf.isPending
                      ? 'Préparation…'
                      : 'Télécharger le PDF'}
                  </Button>
                  {user ? (
                    <Button
                      variant="secondary"
                      onClick={() => claim.mutate()}
                      disabled={claim.isPending}
                    >
                      {claim.isPending
                        ? 'Ajout en cours…'
                        : 'Ajouter à mon espace'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.assign('/register')
                      }}
                    >
                      Créer un compte gratuit
                    </Button>
                  )}
                </div>
                {downloadPdf.isError && (
                  <ErrorMessage error={downloadPdf.error} />
                )}
                {claim.isError && <ErrorMessage error={claim.error} />}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ErrorMessage({ error }) {
  const status_ = error?.response?.status
  const detail = error?.response?.data?.detail
  if (!detail) return null
  return (
    <p className="mt-3 text-sm text-red-600">
      {detail}
      {status_ === 429 && ' (limite quotidienne)'}
    </p>
  )
}

function ResultPanel({ children, tone }) {
  const tones = {
    success: 'border-green-200 bg-green-50',
    neutral: 'border-slate-200 bg-white',
  }
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}

function TemplatePicker({ selected, onSelect }) {
  const [templates, setTemplates] = useState(null)

  useEffect(() => {
    getTemplates()
      .then(({ data }) => setTemplates(data.results))
      .catch(() => setTemplates([]))
  }, [])

  if (!templates) {
    return <p className="text-sm text-slate-400">Chargement des modèles…</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((tpl) => (
        <button
          key={tpl.slug}
          type="button"
          onClick={() => onSelect(tpl.slug)}
          className={`overflow-hidden rounded-xl border-2 bg-white text-left transition ${
            selected === tpl.slug
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="pointer-events-none flex h-40 overflow-hidden bg-slate-100">
            <img
              src={getTemplateThumbnailUrl(tpl.slug)}
              alt={`Aperçu ${tpl.name}`}
              loading="lazy"
              className="h-full min-w-full object-cover object-top"
            />
          </span>
          <span className="flex items-center justify-between p-3">
            <span className="font-semibold text-slate-900">{tpl.name}</span>
            {tpl.is_premium && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Premium
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
