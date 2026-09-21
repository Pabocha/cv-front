import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  guestConfirmPayment,
  guestGenerate,
  guestPay,
  guestDownloadPdf,
} from '../api/guest'
import { getTemplates, getTemplateThumbnailUrl } from '../api/templates'
import Button from '../components/ui/Button'

export default function GuestCreatePage() {
  const [description, setDescription] = useState('')
  const [generation, setGeneration] = useState(null)
  const [selected, setSelected] = useState('professionnel')
  const [paymentDone, setPaymentDone] = useState(false)

  const generate = useMutation({
    mutationFn: guestGenerate,
    onSuccess: ({ data }) => {
      setGeneration(data)
      setSelected('professionnel')
      setPaymentDone(false)
    },
  })

  const pay = useMutation({
    mutationFn: async (templateSlug) => {
      await guestPay(generation.token, templateSlug)
      await guestConfirmPayment(generation.token)
      setPaymentDone(true)
    },
  })

  const downloadPdf = useMutation({
    mutationFn: async () => {
      const { data } = await guestDownloadPdf(generation.token)
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-${generation.token.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    },
  })

  const handlePay = () => {
    pay.mutate(selected)
  }

  const rateLimited = generate.error?.response?.status === 429
  const paywalled = downloadPdf.error?.response?.status === 402

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Créez votre CV en 2 minutes, sans compte
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Décrivez votre parcours en quelques phrases : nous structurons votre CV,
          choisissez un modèle parmi 6, puis téléchargez-le en PDF (3 000 FCFA).
        </p>
      </div>

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
            onClick={() => generate.mutate(description)}
            disabled={generate.isPending || description.trim().length < 30}
          >
            {generate.isPending ? 'Structuration en cours…' : 'Générer mon CV'}
          </Button>
          {rateLimited && (
            <span className="text-sm text-red-600">
              Limite de 3 générations quotidiennes atteinte.
            </span>
          )}
        </div>
      </div>

      {generation && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Choisissez votre modèle
            </h2>
            <span className="text-sm text-slate-500">
              {generation.generated_content?.header?.full_name} · {generation.price_cfa.toLocaleString('fr-FR')} FCFA / CV
            </span>
          </div>

          <TemplatePicker
            selected={selected}
            onSelect={setSelected}
          />

          {!paymentDone ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  Télécharger ce modèle en PDF
                </p>
                <p className="text-sm text-slate-500">
                  Paiement sécurisé (simulé en démo) : {generation.price_cfa.toLocaleString('fr-FR')} FCFA, une seule fois.
                </p>
              </div>
              <Button onClick={handlePay} disabled={pay.isPending || paywalled}>
                {pay.isPending
                  ? 'Paiement en cours…'
                  : `Payer ${generation.price_cfa.toLocaleString('fr-FR')} FCFA`}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="font-semibold text-green-900">Paiement confirmé ✓</p>
              <p className="mt-1 text-sm text-green-700">
                Votre CV est prêt. Téléchargez-le ou revenez plus tard : le lien
                reste valable 48 h.
              </p>
              <Button
                className="mt-3"
                onClick={() => downloadPdf.mutate()}
                disabled={downloadPdf.isPending}
              >
                {downloadPdf.isPending ? 'Préparation…' : 'Télécharger le PDF'}
              </Button>
            </div>
          )}

          {pay.isError && (
            <p className="text-sm text-red-600">
              {pay.error?.response?.data?.detail || 'Erreur lors du paiement.'}
            </p>
          )}
          {downloadPdf.isError && !paywalled && (
            <p className="text-sm text-red-600">
              {downloadPdf.error?.response?.data?.detail || 'Erreur lors du téléchargement.'}
            </p>
          )}
        </div>
      )}
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