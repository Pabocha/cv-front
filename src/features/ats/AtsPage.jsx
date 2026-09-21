import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCv } from '../cv/useCvs'
import { useAtsAnalysis, useAtsReports } from './useAts'
import Button from '../../components/ui/Button'
import PaywallModal from '../payment/PaywallModal'
import PremiumGate from '../payment/PremiumGate'

function scoreColor(score) {
  if (score >= 75) return 'bg-green-100 text-green-800 border-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function Chip({ match }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        match
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {match ? '✓' : '✕'} {match ? 'Présent' : 'À ajouter'}
    </span>
  )
}

export default function AtsPage() {
  const { id } = useParams()
  const { data: cv, isLoading: cvLoading } = useCv(id)
  const analyze = useAtsAnalysis()
  const { data: reports, refetch: refetchReports } = useAtsReports(id)
  const [offer, setOffer] = useState('')
  const [result, setResult] = useState(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const handleAnalyze = async () => {
    const res = await analyze.mutateAsync({ id, jobOffer: offer })
    setResult(res.data.analysis)
    refetchReports()
  }

  if (cvLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Chargement…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/cv/${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
          ← Retour au CV
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Analyse ATS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Collez une offre d'emploi pour mesurer la compatibilité avec « {cv?.title} ».
        </p>
      </div>

      {cv?.status !== 'generated' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Générez d'abord le contenu de votre CV (
          <Link to={`/cv/${id}`} className="font-medium underline">
            retour au CV
          </Link>
          ) avant de lancer une analyse.
        </div>
      )}

      <PremiumGate
        title="Analyse ATS"
        message="L'analyse de compatibilité avec les offres d'emploi est réservée aux abonnés Premium."
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
          <div className="mt-3 flex items-center gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={analyze.isPending || offer.trim().length < 20 || cv?.status !== 'generated'}
            >
              {analyze.isPending ? 'Analyse en cours…' : 'Analyser la compatibilité'}
            </Button>
            {result && (
              <Button variant="secondary" onClick={() => setResult(null)}>
                Nouvelle analyse
              </Button>
            )}
          </div>
          {analyze.isError &&
            analyze.error?.response?.status !== 402 && (
              <p className="mt-2 text-sm text-red-600">
                {analyze.error?.response?.data?.detail || 'Erreur lors de l’analyse.'}
              </p>
            )}
        </div>

        {result && <AnalysisResult result={result} />}
      </PremiumGate>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Analyse ATS"
        message="L'analyse de compatibilité avec les offres d'emploi est réservée aux abonnés Premium."
        onSuccess={() => setPaywallOpen(false)}
      />

      {reports?.length > 1 && !result && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Dernières analyses ({reports.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setResult(r.analysis)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Score {r.score} — {new Date(r.created_at).toLocaleDateString('fr-FR')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisResult({ result }) {
  const breakdown = Object.entries(result.score_breakdown || {})
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-slate-200 bg-white p-5">
        <div
          className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 ${scoreColor(
            result.score,
          )} p-2`}
        >
          <span className="text-3xl font-bold">{result.score}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide">
            / 100
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">
            {result.score >= 75
              ? 'Excellente compatibilité avec l’offre'
              : result.score >= 50
                ? 'Compatibilité correcte, quelques ajustements utiles'
                : 'Compatibilité faible : à améliorer'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Le score combine la couverture des mots-clés, les langues,
            l'expérience, les diplômes et la structure du CV.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Compétences présentes" emoji="✓">
          {result.matched_skills.length === 0 && <Empty text="Aucune compétence identifiée en commun." />}
          <div className="flex flex-wrap gap-2">
            {result.matched_skills.map((s) => (
              <Chip key={s} match />
            ))}
          </div>
        </Section>
        <Section title="Compétences à ajouter" emoji="✕">
          {result.missing_skills.length === 0 && <Empty text="Aucune compétence manquante." />}
          <div className="flex flex-wrap gap-2">
            {result.missing_skills.map((s) => (
              <Chip key={s} />
            ))}
          </div>
        </Section>
      </div>

      {result.missing_keywords.length > 0 && (
        <Section title="Mots-clés de l’offre absents du CV" emoji="✕">
          <div className="flex flex-wrap gap-2">
            {result.missing_keywords.slice(0, 12).map((k) => (
              <Chip key={k} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommandations" emoji="💡">
        <ol className="list-decimal space-y-2 pl-5">
          {result.recommendations.length === 0 && (
            <li className="text-sm text-slate-500">
              Aucune recommandation : excellent travail !
            </li>
          )}
          {result.recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-slate-600">
              {rec}
            </li>
          ))}
        </ol>
      </Section>

      {breakdown.length > 0 && (
        <Section title="Détail du score" emoji="⚖️">
          <div className="space-y-3">
            {breakdown.map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span className="capitalize">{name}</span>
                  <span className="font-mono">poids {value.weight} %</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      value.ratio >= 0.7
                        ? 'bg-green-500'
                        : value.ratio >= 0.4
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.round(value.ratio * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, emoji, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        {emoji} {title}
      </h3>
      {children}
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400">{text}</p>
}