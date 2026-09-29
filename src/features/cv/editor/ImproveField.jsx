import { useState } from 'react'
import Button from '../../../components/ui/Button'
import { htmlToText, textToHtml } from './htmlText'

// Reprise de `ai.prompts.ANGLE_LABELS` côté client : l'utilisateur lit un
// libellé, jamais un identifiant technique.
const ANGLE_LABELS = {
  concis: 'Plus concis',
  competences: 'Orienté compétences',
  cible: 'Adapté au poste',
}

function errorMessage(err) {
  if (err?.response?.status === 429) {
    return err.response.data?.detail || "Limite d'améliorations atteinte pour aujourd'hui."
  }
  if (typeof err?.response?.data?.detail === 'string') return err.response.data.detail
  return "L'amélioration n'a pas abouti. Réessayez dans un instant."
}

/**
 * « ✨ Améliorer » : des reformulations proposées, jamais appliquées seules.
 *
 * L'utilisateur choisit : il utilise une proposition, l'applique pour la
 * retravailler, ou conserve son texte (ia.txt §6 et §17 — l'IA ne modifie
 * jamais le CV sans validation).
 *
 * Le bouton n'apparaît que sur un élément déjà enregistré : le serveur
 * rebuild le contexte du CV depuis la base et localise l'élément par son index.
 * Sur un élément en cours de création, il n'y a rien à améliorer côté serveur.
 */
export default function ImproveField({ field, section, index, value, onApply, ai }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const isSummary = field === 'summary'
  const text = htmlToText(value)
  const quota = ai?.quota
  const exhausted = quota?.remaining === 0
  const canRequest = isSummary || Number.isInteger(index)

  const apply = (suggestionText, keepOpen = false) => {
    onApply(textToHtml(suggestionText))
    if (!keepOpen) setOpen(false)
  }

  const request = async () => {
    setLoading(true)
    setError('')
    setOpen(true)
    try {
      // Le contexte envoyé au modèle est reconstruit côté serveur depuis le CV
      // enregistré : on force la sauvegarde avant de demander quoi que ce soit,
      // sinon l'IA travaillerait sur une version périmée du CV.
      if (ai?.flushNow) await ai.flushNow()
      setResult(await ai.suggest({ field, section, index, text }))
    } catch (err) {
      setResult(null)
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!canRequest) return null

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-2.5 py-1 text-xs"
          onClick={request}
          disabled={loading || exhausted || !text.trim()}
          title={
            exhausted
              ? "Limite d'améliorations atteinte pour aujourd'hui"
              : text.trim()
                ? 'Proposer des reformulations de ce champ'
                : 'Renseignez ce champ pour pouvoir l’améliorer'
          }
        >
          {loading ? 'Amélioration…' : '✨ Améliorer'}
        </Button>
        {quota && !exhausted && (
          <span className="text-xs text-slate-400">
            {quota.remaining} amélioration{quota.remaining > 1 ? 's' : ''} restante
            {quota.remaining > 1 ? 's' : ''} aujourd’hui
          </span>
        )}
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-indigo-800">Propositions</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Fermer"
              className="rounded p-0.5 text-xs text-slate-400 hover:bg-white hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          {loading && <p className="text-xs text-slate-500">Analyse en cours…</p>}

          {error && <p className="text-xs text-red-600">{error}</p>}

          {!loading && result?.already_good && !error && (
            <p className="text-xs text-slate-600">
              Ce texte est déjà clair. Aucune reformulation n’ajouterait d’information sans
              inventer.
            </p>
          )}

          {!loading && result?.suggestions?.length > 0 && (
            <ul className="space-y-2">
              {result.suggestions.map((suggestion) => (
                <li
                  key={suggestion.angle}
                  className="rounded-lg border border-slate-200 bg-white p-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-indigo-700">
                      {ANGLE_LABELS[suggestion.angle] || suggestion.angle}
                    </span>
                    <span className="flex gap-1">
                      <Button
                        type="button"
                        className="px-2 py-0.5 text-xs"
                        onClick={() => apply(suggestion.text)}
                      >
                        Utiliser
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-2 py-0.5 text-xs"
                        onClick={() => apply(suggestion.text, true)}
                      >
                        Modifier
                      </Button>
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800">
                    {suggestion.text}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {result?.warnings?.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
              <p className="text-xs font-semibold text-amber-800">
                Retiré par le garde-fou anti-invention
              </p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                {result.warnings.map((warning) => (
                  <li key={warning} className="text-xs text-amber-700">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                onClick={() => setOpen(false)}
              >
                Conserver mon texte
              </Button>
              {exhausted && (
                <span className="text-xs text-slate-500">
                  Quota épuisé pour aujourd’hui, réessayez demain.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
