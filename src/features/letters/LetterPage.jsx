import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCv } from '../cv/useCvs'
import Button from '../../components/ui/Button'
import PaywallModal from '../payment/PaywallModal'
import PremiumGate from '../payment/PremiumGate'
import {
  useCreateLetter,
  useDownloadLetterPdf,
  useLetters,
  useSaveLetter,
} from './useLetters'

export default function LetterPage() {
  const { id } = useParams()
  const { data: cv } = useCv(id)
  const letters = useLetters(id)
  const create = useCreateLetter(id)
  const download = useDownloadLetterPdf()
  const [offer, setOffer] = useState('')
  const [paywallOpen, setPaywallOpen] = useState(false)

  const isPaywalled =
    letters.isError && letters.error?.response?.status === 402

  const quota = letters.data?.quota
  const quotaLabel =
    quota?.limit === -1
      ? 'Premium+ · illimité'
      : quota
        ? `${quota.used} / ${quota.limit} ce mois`
        : ''

  const handleGenerate = async () => {
    try {
      await create.mutateAsync(offer)
      setOffer('')
    } catch (err) {
      if (err.response?.status === 402) {
        setPaywallOpen(true)
        letters.refetch()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lettre de motivation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {cv ? <>Pour le CV « {cv.title} » · </> : ''}
            Rédigée à partir de vos informations réelles, jamais inventées.
          </p>
        </div>
        <Link to={`/cv/${id}`}>
          <Button variant="secondary" className="text-xs">
            Retour au CV
          </Button>
        </Link>
      </div>

      {quotaLabel && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{quotaLabel}</span>{' '}
          · les lettres font partie de l'offre Premium et Premium+.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Générer une nouvelle lettre
        </h2>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Offre ou poste visé (facultatif)
        </label>
        <textarea
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          rows={3}
          placeholder="Collez ici le descriptif de l'offre pour personnaliser la lettre…"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <Button
          className="mt-3"
          onClick={handleGenerate}
          disabled={create.isPending}
        >
          {create.isPending ? 'Génération…' : 'Générer la lettre'}
        </Button>
        {create.isError && !isPaywalled && (
          <p className="mt-2 text-sm text-red-600">
            {create.error?.response?.data?.detail ||
              'Une erreur est survenue.'}
          </p>
        )}
      </div>

      {letters.isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Chargement…</div>
      ) : letters.isError && isPaywalled ? (
        <PremiumGate
          title="Lettres de motivation Premium"
          message="Les lettres de motivation sont réservées aux abonnés Premium (2 lettres/mois) et Premium+ (illimitées). Activez une offre pour commencer."
        />
      ) : (
        <div className="space-y-4">
          {(letters.data?.letters ?? []).map((letter) => (
            <LetterCard
              key={letter.id}
              cvId={id}
              letter={letter}
              onDownload={(letterId) =>
                download.mutate({ cvId: id, letterId })
              }
            />
          ))}
          {(letters.data?.letters ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Aucune lettre pour le moment. Générez-en une ci-dessus.
            </div>
          )}
        </div>
      )}

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Lettre de motivation Premium"
        message="Les lettres sont réservées aux abonnés Premium (2/mois) et Premium+ (illimitées)."
        onSuccess={() => {
          setPaywallOpen(false)
          letters.refetch()
        }}
      />
    </div>
  )
}

function LetterCard({ cvId, letter, onDownload }) {
  const save = useSaveLetter(cvId)
  const [value, setValue] = useState(letter.content)
  const [dirty, setDirty] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Créée le {new Date(letter.created_at).toLocaleDateString('fr-FR')}
          {letter.offer ? ' · avec contexte d’offre' : ''}
        </p>
        <Button variant="secondary" className="text-xs" onClick={() => onDownload(letter.id)}>
          Télécharger PDF
        </Button>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setDirty(true)
        }}
        rows={14}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-indigo-500 focus:outline-none"
      />
      {dirty && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => {
              setValue(letter.content)
              setDirty(false)
            }}
          >
            Annuler
          </Button>
          <Button
            className="text-xs"
            onClick={() => save.mutate({ letterId: letter.id, content: value })}
            disabled={save.isPending}
          >
            {save.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}
      {save.isError && (
        <p className="mt-2 text-sm text-red-600">
          {save.error?.response?.data?.content?.join(' ') ||
            'Erreur lors de l’enregistrement.'}
        </p>
      )}
    </div>
  )
}