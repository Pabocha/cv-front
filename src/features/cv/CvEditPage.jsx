import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTemplates, usePdfCv } from './useCvs'
import { getTemplateThumbnailUrl } from '../../api/templates'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Button from '../../components/ui/Button'
import PaywallModal from '../payment/PaywallModal'
import { useEntitlements } from '../payment/usePayments'
import useEditor from './editor/useEditor'
import LivePreview from './editor/LivePreview'
import SectionCard from './editor/SectionCard'
import StyleBar from './editor/StyleBar'
import PhotoField from './editor/PhotoField'
import CompletenessBar from './editor/CompletenessBar'

const ImportModal = lazy(() => import('./editor/ImportModal'))
import {
  HEADER_FIELDS,
  OPTIONAL_HEADER_FIELDS,
  SECTION_LABELS,
  TWO_COL_TEMPLATES,
} from './editor/editorConfigs'

const SAVE_LABELS = {
  idle: '',
  dirty: 'Modifications non enregistrées…',
  saving: 'Enregistrement…',
  saved: 'Enregistré ✓',
  error: "Erreur d'enregistrement",
}

function SaveIndicator({ saveState }) {
  if (saveState === 'idle') return null
  const color =
    saveState === 'error'
      ? 'text-red-600'
      : saveState === 'saved'
        ? 'text-emerald-600'
        : 'text-amber-600'
  return <span className={`text-xs font-medium ${color}`}>{SAVE_LABELS[saveState]}</span>
}

function HeaderEditor({ header, labels, onChange, cvId }) {
  const [addOpen, setAddOpen] = useState(false)
  const available = OPTIONAL_HEADER_FIELDS.filter((f) => !(f.name in header))
  const activeOptional = OPTIONAL_HEADER_FIELDS.filter((f) => f.name in header)
  const gridFields = HEADER_FIELDS.filter(
    (f) => f.name !== 'full_name' && f.name !== 'photo',
  )

  return (
    <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
        <span className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          {labels.contact || 'Contact'}
        </span>
      </summary>
      <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <PhotoField
              value={header.photo || ''}
              onChange={(v) => onChange('photo', v)}
              cvId={cvId}
            />
            <div className="min-w-0 flex-1">
              <label className="mb-0.5 block text-xs font-medium text-slate-600">
                Nom complet
              </label>
              <input
                value={header.full_name || ''}
                onChange={(e) => onChange('full_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        {gridFields.map((f) => (
          <div key={f.name}>
            <label className="mb-0.5 block text-xs font-medium text-slate-600">
              {f.label}
            </label>
            <input
              value={header[f.name] || ''}
              onChange={(e) => onChange(f.name, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}

        {activeOptional.map((f) => (
          <div key={f.name}>
            <label className="mb-0.5 block text-xs font-medium text-slate-600">
              {f.label}
            </label>
            <div className="relative">
              <input
                value={header[f.name] || ''}
                onChange={(e) => onChange(f.name, e.target.value)}
                placeholder={f.placeholder || ''}
                className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => onChange(f.name, null)}
                title={`Retirer ${f.label.toLowerCase()}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {available.length > 0 && (
          <div className="relative sm:col-span-2">
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 focus:outline-none"
            >
              ＋ Ajouter une information
            </button>
            {addOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {available.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      onChange(f.name, header[f.name] || '')
                      setAddOpen(false)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

function SortableSectionCard({
  section,
  sectionIndex,
  sectionCount,
  isTwoCol,
  content,
  labels,
  ops,
  pageBreak,
  language,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.key })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <SectionCard
        section={section}
        isTwoCol={isTwoCol}
        content={content}
        style={{ labels }}
        ops={ops}
        sectionIndex={sectionIndex}
        sectionCount={sectionCount}
        pageBreak={pageBreak}
        dragHandle={{ attributes, listeners }}
        language={language}
      />
    </div>
  )
}

export default function CvEditPage() {
  const { id } = useParams()
  const editor = useEditor(id)
  const { data: templatesData } = useTemplates()
  const templates = templatesData || []
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const { data: entitlements } = useEntitlements()
  const isPremium = entitlements?.is_premium
  const downloadPdf = usePdfCv()
  const [importOpen, setImportOpen] = useState(false)
  const [templatePaywallOpen, setTemplatePaywallOpen] = useState(false)
  const [pdfPaywallOpen, setPdfPaywallOpen] = useState(false)

  useEffect(() => {
    if (downloadPdf.isError && downloadPdf.error?.response?.status === 402) {
      setPdfPaywallOpen(true)
    }
  }, [downloadPdf.isError, downloadPdf.error])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (editor.isLoading || !editor.draft) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Chargement de l'éditeur…
      </div>
    )
  }

  const { cv, draft, liveHtml, saveState, saveError, undo, redo, canUndo, canRedo } = editor
  const twoCol = TWO_COL_TEMPLATES.includes(draft.template)
  const lang = SECTION_LABELS[draft.language] ? draft.language : 'fr'
  const labels = SECTION_LABELS[lang]
  const orderedSections = draft.layout.sections || []

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    editor.moveSectionTo(active.id, over.id)
  }

  const ops = {
    updateHeader: editor.updateHeader,
    updateSummary: editor.updateSummary,
    addSectionItem: editor.addSectionItem,
    updateSectionItem: editor.updateSectionItem,
    removeSectionItem: editor.removeSectionItem,
    moveSectionItem: editor.moveSectionItem,
    moveSection: editor.moveSection,
    toggleSectionVisibility: editor.toggleSectionVisibility,
    setSectionColumn: editor.setSectionColumn,
    togglePageBreak: editor.togglePageBreak,
  }

  const handlePdfDownload = async () => {
    await editor.flushNow()
    downloadPdf.mutate(cv.id)
  }

  const handleApplyImport = (parsed) => {
    if (
      cv.status !== 'draft' &&
      !window.confirm(
        "L'import remplacera le contenu actuel (y compris vos modifications personnalisées) par celui de votre fichier. Continuer ?",
      )
    ) {
      return
    }
    const content = editor.draft.content
    Object.entries(parsed.header || {}).forEach(([field, value]) => {
      if (value) editor.updateHeader(field, value)
    })
    editor.updateSummary(parsed.summary || '')
    Object.entries(parsed.sections || {}).forEach(([key, items]) => {
      const current = Array.isArray(content[key]) ? content[key] : []
      for (let i = current.length - 1; i >= 0; i -= 1) editor.removeSectionItem(key, i)
      items.forEach((item) => editor.addSectionItem(key, item))
    })
    setImportOpen(false)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-3">
        <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Tableau de bord
        </Link>
        <h1 className="text-base font-bold text-slate-900">{cv.title}</h1>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTemplateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            title="Choisir un modèle"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden
            >
              <rect x="3" y="3" width="18" height="21" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
            <span className="hidden sm:inline">Modèles</span>
          </button>
          <select
            value={draft.language}
            onChange={(e) => editor.updateLanguage(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:outline-none"
            title="Langue du CV"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <Button variant="secondary" className="text-xs" onClick={() => setImportOpen(true)}>
            Importer
          </Button>
          <Button
            variant="secondary"
            className="text-xs"
            onClick={handlePdfDownload}
            disabled={downloadPdf.isPending}
          >
            {downloadPdf.isPending ? 'PDF…' : 'Télécharger PDF'}
          </Button>
          <Button variant="secondary" className="text-xs" onClick={undo} disabled={!canUndo} title="Annuler">
            ↩ Annuler
          </Button>
          <Button variant="secondary" className="text-xs" onClick={redo} disabled={!canRedo} title="Rétablir">
            ↪ Rétablir
          </Button>
          <SaveIndicator saveState={saveState} />
        </div>
      </div>

      {saveState === 'error' && saveError && (
        <p className="bg-red-50 px-4 py-2 text-xs text-red-600">{saveError}</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 lg:w-1/2 lg:flex-none lg:overflow-y-auto">
          <HeaderEditor
            header={draft.content.header || {}}
            labels={labels}
            onChange={editor.updateHeader}
            cvId={cv.id}
          />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={orderedSections.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              {orderedSections.map((section, index) => (
                <SortableSectionCard
                  key={section.key}
                  section={section}
                  isTwoCol={twoCol}
                  content={draft.content}
                  labels={labels}
                  ops={ops}
                  sectionIndex={index}
                  sectionCount={orderedSections.length}
                  pageBreak={draft.layout.page_breaks?.includes(section.key) || false}
                  language={lang}
                />
              ))}
            </SortableContext>
          </DndContext>
          <CompletenessBar
            content={draft.content}
            layout={draft.layout}
            labels={labels}
          />
        </div>

        <div className="flex h-[60vh] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-auto lg:w-1/2">
          <StyleBar
            style={draft.style}
            onChange={editor.updateStyle}
            onOpenTemplates={() => setTemplateModalOpen(true)}
          />
          <div className="min-h-0 flex-1">
            <LivePreview html={liveHtml} />
          </div>
        </div>
      </div>

      {templateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Choisir un modèle</h2>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                title="Fermer"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Chargement des modèles…
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((tpl) => (
                  <button
                    key={tpl.slug}
                    type="button"
                    onClick={() => {
                      if (tpl.is_premium && !isPremium) {
                        setTemplatePaywallOpen(true)
                        return
                      }
                      editor.setTemplate(tpl.slug)
                      setTemplateModalOpen(false)
                    }}
                    className={`overflow-hidden rounded-xl border-2 text-left transition ${
                      draft.template === tpl.slug
                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block h-80 bg-slate-100">
                      <img
                        src={getTemplateThumbnailUrl(tpl.slug)}
                        alt={`Aperçu ${tpl.name}`}
                        loading="lazy"
                        className="mx-auto block h-full max-w-full object-contain"
                      />
                    </span>
                    <span className="flex items-center justify-between gap-2 px-3 py-2">
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
        </div>
      )}

      <PaywallModal
        open={editor.paywall}
        onClose={() => {
          editor.clearPaywall()
          editor.flushNow()
        }}
        title="Éditeur Premium"
        message="La personnalisation de votre CV est réservée aux abonnés Premium. Activez une offre pour enregistrer vos modifications."
        onSuccess={() => {
          editor.clearPaywall()
          editor.flushNow()
        }}
      />

      <PaywallModal
        open={templatePaywallOpen}
        onClose={() => setTemplatePaywallOpen(false)}
        title="Modèles Premium"
        message="Les modèles Premium sont réservés aux abonnés. Abonnez-vous à Premium (3 000 FCFA/mois) pour profiter de tous les modèles."
        onSuccess={() => setTemplatePaywallOpen(false)}
      />

      <PaywallModal
        open={pdfPaywallOpen}
        onClose={() => {
          setPdfPaywallOpen(false)
          downloadPdf.reset()
        }}
        title="Export PDF Premium"
        message="Le téléchargement du PDF est réservé aux abonnés Premium. Activez une offre pour y accéder."
        onSuccess={() => {
          setPdfPaywallOpen(false)
          downloadPdf.reset()
          handlePdfDownload()
        }}
      />

      {importOpen && (
        <Suspense fallback={null}>
          <ImportModal
            open
            onClose={() => setImportOpen(false)}
            onApply={handleApplyImport}
          />
        </Suspense>
      )}
    </div>
  )
}