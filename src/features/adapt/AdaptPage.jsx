import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useCv } from '../cv/useCvs'
import { adaptCv } from '../../api/cvs'
import Button from '../../components/ui/Button'
import PremiumGate from '../payment/PremiumGate'

export default function AdaptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cv, isLoading } = useCv(id)
  const [offer, setOffer] = useState('')
  const [result, setResult] = useState(null)

  const adapt = useMutation({
    mutationFn: (jobOffer) => adaptCv(id, jobOffer),
    onSuccess: ({ data }) => {
      setResult(data)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Chargement…
      </div>
    )
  }

  const canAdapt = cv?.status === 'generated' || cv?.status === 'adapted'

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/cv/${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
          ← Retour au CV
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Adapter mon CV à une offre</h1>
        <p className="mt-1 text-sm text-slate-500">
          Collez une offre d'emploi : vos informations existantes sont réorganisées
          et reformulées pour correspondre au poste — sans jamais en inventer.
        </p>
      </div>

      {!canAdapt && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Générez d'abord le contenu de votre CV (
          <Link to={`/cv/${id}`} className="font-medium underline">
            retour au CV
          </Link>
          ) avant de l'adapter.
        </div>
      )}

      <PremiumGate
        title="Adaptation à une offre"
        message="L'adaptation de votre CV à une offre d'emploi est réservée aux abonnés Premium."
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Offre d'emploi
          </label>
          <textarea
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            rows={8}
            placeholder="Collez ici le descriptif complet de l'offre d'emploi…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="mt-3">
            <Button
              onClick={() => adapt.mutate(offer)}
              disabled={adapt.isPending || offer.trim().length < 20 || !canAdapt}
            >
              {adapt.isPending ? 'Adaptation en cours…' : 'Adapter mon CV à cette offre'}
            </Button>
          </div>
          {adapt.isError && (
            <p className="mt-2 text-sm text-red-600">
              {adapt.error?.response?.data?.detail || 'Erreur lors de l’adaptation.'}
            </p>
          )}
        </div>

        {result && (
          <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-green-900">
                  CV adapté avec succès
                </h2>
                <p className="mt-1 text-sm text-green-700">
                  Une nouvelle version « {result.cv.title} » a été créée. Votre CV
                  d'origine reste inchangé.
                </p>
              </div>
              <Button onClick={() => navigate(`/cv/${result.cv.id}`)}>
                Voir ma version adaptée
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-green-800">
                  Compétences mises en avant
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.matched_skills.length === 0 && (
                    <span className="text-sm text-slate-500">
                      Aucune compétence de l'offre dans votre profil.
                    </span>
                  )}
                  {result.matched_skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-amber-800">
                  Demandés par l'offre mais absents de votre profil
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Ils n'ont pas été ajoutés au CV : ajoutez-les seulement si vous les
                  possédez réellement.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.missing_skills.length === 0 && (
                    <span className="text-sm text-slate-500">
                      Toutes les compétences de l'offre sont couvertes.
                    </span>
                  )}
                  {result.missing_skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                    >
                      ✕ {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </PremiumGate>
    </div>
  )
}