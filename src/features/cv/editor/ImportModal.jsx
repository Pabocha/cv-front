import { useState } from 'react'
import { extractTextFile, parseCvText } from './importCv'
import { SECTION_LABELS } from './editorConfigs'
import Button from '../../../components/ui/Button'

const LABELS = SECTION_LABELS.fr

export default function ImportModal({ open, onClose, onApply }) {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [mode, setMode] = useState('paste')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)

  if (!open) return null

  const sectionCount = (key) => {
    if (!parsed) return 0
    if (key === 'summary') return parsed.summary ? 1 : 0
    const items = parsed.sections[key] || []
    return items.length
  }

  const handleParse = async () => {
    setBusy(true)
    setError('')
    try {
      const raw = mode === 'file' && file ? await extractTextFile(file) : text
      if (!raw || !raw.trim()) {
        setError('Aucun texte à analyser. Collez du texte ou choisissez un fichier.')
        return
      }
      const result = parseCvText(raw, 'fr')
      setParsed(result)
    } catch {
      setError("Impossible d'extraire le texte de ce fichier. Essayez de coller le contenu directement.")
    } finally {
      setBusy(false)
    }
  }

  const handleApply = () => {
    if (!parsed) return
    onApply(parsed)
    onClose()
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
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 w-fit">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                mode === 'paste' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Coller le texte
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                mode === 'file' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Fichier (.txt · .docx · .pdf)
            </button>
          </div>

          {mode === 'paste' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Collez ici le contenu de votre CV existant (nom, coordonnées, expériences, formations, compétences…)."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
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
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

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
                  {(parsed.header?.full_name ? 1 : 0) + Object.keys(parsed.header || {}).filter((k) => k !== 'full_name').length} champ(s)
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
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          {!parsed ? (
            <Button onClick={handleParse} disabled={busy}>
              {busy ? 'Analyse…' : 'Analyser'}
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={busy}>
              Appliquer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}