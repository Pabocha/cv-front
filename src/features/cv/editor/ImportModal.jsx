import { useState } from 'react'
import { parseCvFile } from './importCv'
import { SECTION_LABELS } from './editorConfigs'
import Button from '../../../components/ui/Button'

const LABELS = SECTION_LABELS.fr

// Une data URL plutôt qu'un object URL : aucun cycle de vie à révoquer, et la
// vignette n'existe que le temps de la modale.
const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => resolve('')
    reader.readAsDataURL(blob)
  })

export default function ImportModal({ open, onClose, onApply, pending = false, error = '' }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parsed, setParsed] = useState(null)
  const [includePhoto, setIncludePhoto] = useState(true)
  const [photoPreview, setPhotoPreview] = useState('')

  if (!open) return null

  const sectionCount = (key) => {
    if (!parsed) return 0
    if (key === 'summary') return parsed.summary ? 1 : 0
    const items = parsed.sections[key] || []
    return items.length
  }

  // Plusieurs sections vides pendant que le résumé déborde : la détection des
  // titres a échoué. On le dit, sinon l'utilisateur ne verrait qu'un CV bancal
  // sans aucun indice de la cause.
  const emptySections = parsed
    ? Object.keys(LABELS).filter(
        (key) => key !== 'summary' && key !== 'contact' && !sectionCount(key),
      ).length
    : 0
  const layoutFailed = Boolean(parsed) && emptySections >= 4 && (parsed.summary || '').length > 600

  const handleParse = async () => {
    setBusy(true)
    setParseError('')
    try {
      // Le chemin PDF passe par un pipeline distinct, qui exploite la mise en forme.
      // `photo` demande en plus la photo du fichier, sans quoi l'import la perdrait.
      const result = await parseCvFile(file, 'fr', { photo: true })
      setParsed(result)
      setPhotoPreview(result.photoBlob ? await blobToDataUrl(result.photoBlob) : '')
      setIncludePhoto(true)
    } catch (err) {
      // Le message d'origine est indispensable : « impossible d'extraire » ne
      // disait rien du vrai défaut (PDF scanné, .docx illisible, bug).
      console.error('[import] extraction du fichier impossible', err)
      setParseError(`Impossible d'analyser ce fichier : ${err?.message || 'erreur inconnue'}`)
    } finally {
      setBusy(false)
    }
  }

  // Le parent redirige vers le nouveau CV en cas de succès : fermer ici averted
  // l'écran, donc l'utilisateur ne verrait jamais le message d'erreur.
  const handleApply = () => {
    if (!parsed || pending) return
    onApply(parsed, { includePhoto: includePhoto && Boolean(parsed.photoBlob) })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Importer un CV</h2>
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
            Un <strong>nouveau CV</strong> sera créé avec le contenu de votre fichier et le
            <strong> même design</strong> que le CV actuel. Votre CV actuel n&apos;est pas
            modifié.
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
            <input
              type="file"
              accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Choisir un fichier CV'}
            </span>
            <span className="text-xs text-slate-500">
              Formats acceptés : PDF, Word (.docx) ou texte brut
            </span>
            <span className="text-xs text-slate-500">
              Le PDF doit contenir du texte sélectionnable : un PDF scanné ou composé
              d&apos;images n&apos;est pas exploitable.
            </span>
          </label>

          {(parseError || error) && <p className="text-sm text-red-600">{parseError || error}</p>}

          {parsed && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Contenu détecté</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  À vérifier
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                L&apos;import est automatique mais imparfait : vérifiez et complétez chaque champ après l&apos;import.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-900">En-tête :</span>{' '}
                  {(parsed.header?.full_name ? 1 : 0) +
                    Object.keys(parsed.header || {}).filter((k) => k !== 'full_name').length}{' '}
                  champ(s)
                </p>
                {Object.keys(LABELS).map((key) =>
                  key === 'contact' ? null : (
                    <p key={key} className="text-xs text-slate-600">
                      <span className="font-medium text-slate-900">{LABELS[key]} :</span>{' '}
                      {sectionCount(key)}
                    </p>
                  ),
                )}
              </div>
              {parsed.summary && (
                <p className="mt-3 rounded-lg bg-white p-2 text-xs text-slate-600">
                  {LABELS.summary} : {parsed.summary.slice(0, 120)}
                  {parsed.summary.length > 120 ? '…' : ''}
                </p>
              )}
              {parsed.photoBlob && (
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg bg-white p-2">
                  <input
                    type="checkbox"
                    checked={includePhoto}
                    onChange={(e) => setIncludePhoto(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Photo détectée dans le fichier"
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-900">
                      Photo détectée dans le fichier
                    </span>
                    <span className="block text-xs text-slate-500">
                      {includePhoto
                        ? 'Elle sera ajoutée au nouveau CV. Décochez si ce n’est pas votre photo.'
                        : 'Elle ne sera pas ajoutée au nouveau CV.'}
                    </span>
                  </span>
                </label>
              )}
              {layoutFailed && (
                <p className="mt-3 rounded-lg bg-amber-100 p-2 text-xs text-amber-900">
                  Les titres de sections de ce fichier n&apos;ont pas été reconnus : la
                  plupart des informations se retrouve dans « {LABELS.summary} ». Vous
                  pourrez les répartir après l&apos;import.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          {!parsed ? (
            <Button onClick={handleParse} disabled={busy || !file}>
              {busy ? 'Analyse…' : 'Analyser'}
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={pending}>
              {pending ? 'Création…' : 'Créer le CV'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}