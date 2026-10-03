import { useState } from 'react'
import Button from '../../../components/ui/Button'
import FieldInput, { FieldLabel, fieldControlClass } from '../../../components/ui/FieldInput'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Trash,
} from '../../../components/ui/Icons'
import RichEditor from './RichEditor'
import {
  MONTH_NAMES,
  SECTION_FIELD_CONFIGS,
  composeDate,
  composePeriod,
  parseDate,
  parsePeriod,
  yearOptions,
} from './editorConfigs'

const YEARS = yearOptions()

function MonthYear({ value, onChange, language, options }) {
  const compactClass = `${fieldControlClass} min-w-0 flex-1 px-2 py-1.5`
  return (
    <span className="flex w-full gap-1">
      <select
        value={value.month ?? ''}
        onChange={(e) => onChange({ ...value, month: e.target.value })}
        className={compactClass}
      >
        <option value="">Mois</option>
        {(MONTH_NAMES[language] || MONTH_NAMES.fr).map((name, i) => (
          <option key={name} value={String(i + 1)}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={value.year ?? ''}
        onChange={(e) => onChange({ ...value, year: e.target.value })}
        disabled={value.disabled}
        className={`${compactClass} disabled:bg-slate-100 disabled:text-slate-400`}
      >
        <option value="">Année</option>
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </span>
  )
}

function PeriodPicker({ value, onChange, language, currentLabel }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0">
        <FieldLabel label="Date de début" />
        <MonthYear
          value={{ month: value.startMonth, year: value.startYear }}
          onChange={(v) => onChange({ ...value, startMonth: v.month, startYear: v.year })}
          language={language}
          options={YEARS}
        />
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <FieldLabel label="Date de fin" />
          <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(value.current)}
              onChange={(e) => onChange({ ...value, current: e.target.checked })}
            />
            {currentLabel}
          </label>
        </div>
        <MonthYear
          value={{ month: value.endMonth, year: value.endYear, disabled: value.current }}
          onChange={(v) => onChange({ ...value, endMonth: v.month, endYear: v.year })}
          language={language}
          options={YEARS}
        />
      </div>
    </div>
  )
}

function DatePicker({ value, onChange, language }) {
  return <MonthYear value={value} onChange={onChange} language={language} options={YEARS} />
}

function DragButtons({ onMove, index, count }) {
  return (
    <span className="flex shrink-0 flex-col">
      <button
        type="button"
        disabled={index === 0}
        onClick={(e) => {
          e.stopPropagation()
          onMove(index - 1)
        }}
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Monter"
        title="Monter"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={(e) => {
          e.stopPropagation()
          onMove(index + 1)
        }}
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Descendre"
        title="Descendre"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

function defaultValue(f, item) {
  if (f.type === 'period') return parsePeriod(item?.[f.name])
  if (f.type === 'date') return parseDate(item?.[f.name])
  if (f.type === 'rating') return Number(item?.[f.name]) || 0
  return item?.[f.name] ?? ''
}

function rawValue(f, value, language) {
  if (f.type === 'period') return composePeriod(value, language).trim()
  if (f.type === 'date') return composeDate(value, language).trim()
  if (f.type === 'rating') {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? Math.min(5, Math.round(n)) : null
  }
  return (value ?? '').trim()
}

function RatingPicker({ value, onChange }) {
  const current = Number(value) || 0
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Niveau ${n} sur 5`}
          onClick={() => onChange(n === current ? 0 : n)}
          className={`h-6 w-6 rounded border text-xs ${
            n <= current
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-slate-300 bg-white text-slate-400 hover:border-indigo-400 hover:text-indigo-600'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(0)}
        className="ml-1 text-xs text-slate-400 hover:text-slate-600"
      >
        Effacer
      </button>
    </span>
  )
}

function FieldControl({ field: f, value, onChange, language }) {
  if (f.type === 'textarea') return <RichEditor value={value ?? ''} onChange={onChange} rows={2} />
  if (f.type === 'period')
    return (
      <PeriodPicker
        value={value}
        onChange={onChange}
        language={language}
        currentLabel={f.currentLabel || 'En poste'}
      />
    )
  if (f.type === 'date')
    return <DatePicker value={value} onChange={onChange} language={language} />
  if (f.type === 'select')
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldControlClass} w-full py-2.5 pl-3 pr-3`}
      >
        <option value="">Non renseigné</option>
        {(f.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  if (f.type === 'rating') return <RatingPicker value={value ?? 0} onChange={onChange} />
  return null
}

const CUSTOM_CONTROL_TYPES = ['textarea', 'period', 'date', 'select', 'rating']

function ItemEditor({ config, item, onSave, onCancel, language }) {
  const [form, setForm] = useState(
    config.fields.reduce((acc, f) => ({ ...acc, [f.name]: defaultValue(f, item) }), {}),
  )
  const [error, setError] = useState('')

  const set = (name, value) => setForm({ ...form, [name]: value })

  const submit = (e) => {
    e.preventDefault()
    const missing = config.fields.filter(
      (f) => f.required && rawValue(f, form[f.name], language) === '',
    )
    if (missing.length) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }
    const payload = config.fields.reduce((acc, f) => {
      const value = rawValue(f, form[f.name], language)
      return { ...acc, [f.name]: value === '' ? null : value }
    }, {})
    onSave(payload)
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-slate-100 pt-2">
      {config.fields.map((f) =>
        CUSTOM_CONTROL_TYPES.includes(f.type) ? (
          <div key={f.name}>
            <FieldLabel label={f.label} required={f.required} />
            <FieldControl
              field={f}
              value={form[f.name]}
              onChange={(v) => set(f.name, v)}
              language={language}
            />
          </div>
        ) : (
          <FieldInput
            key={f.name}
            label={f.label}
            required={f.required}
            value={form[f.name] ?? ''}
            onChange={(e) => set(f.name, e.target.value)}
            type={f.type === 'url' ? 'url' : 'text'}
          />
        ),
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="text-xs">Enregistrer</Button>
        <Button type="button" variant="secondary" className="text-xs" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}

function ListSection({ config, items, ops, language }) {
  const [editing, setEditing] = useState(null) // index | 'new' | null

  const saveItem = (index, value) => {
    ops.updateSectionItem(config.sectionKey, index, value)
    setEditing(null)
  }

  const itemLabel = (item) =>
    config.titleField ? item?.[config.titleField] : item

  const itemSub = (item) =>
    config.subtitleField ? item?.[config.subtitleField] : ''

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${itemLabel(item)}-${index}`} className="rounded-lg border border-slate-200 bg-white">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-slate-50"
            onClick={() => setEditing(editing === index ? null : index)}
            role="button"
            tabIndex={0}
            aria-expanded={editing === index}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setEditing(editing === index ? null : index)
              }
            }}
          >
            <DragButtons
              index={index}
              count={items.length}
              onMove={(to) => ops.moveSectionItem(config.sectionKey, index, to)}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {itemLabel(item) || 'Nouvel élément'}
              </p>
              {itemSub(item) && (
                <p className="truncate text-xs text-slate-500">{itemSub(item)}</p>
              )}
            </div>
            {editing === index && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Supprimer cet élément ?')) ops.removeSectionItem(config.sectionKey, index)
                }}
                className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label={`Supprimer ${itemLabel(item) || 'cet élément'}`}
                title="Supprimer cet élément"
              >
                <Trash className="h-4 w-4" />
              </button>
            )}
          </div>
          {editing === index && (
            <div className="px-2 pb-2">
              <ItemEditor
                config={config}
                item={items[index]}
                language={language}
                onSave={(v) => saveItem(index, v)}
                onCancel={() => setEditing(null)}
              />
            </div>
          )}
        </div>
      ))}
      <Button
        variant="secondary"
        className="text-xs"
        onClick={() => {
          if (editing === 'new') return
          setEditing('new')
        }}
      >
        + Ajouter
      </Button>
      {editing === 'new' && (
        <div className="rounded-lg border border-slate-200 bg-white p-2 pt-0">
          <ItemEditor
            config={config}
            item={null}
            language={language}
            onSave={(v) => {
              ops.addSectionItem(config.sectionKey, { ...v })
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  )
}

function InterestsSection({ items, ops, label }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    ops.addSectionItem('interests', { text: value })
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5">
        {items.map((value, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <DragButtons
              index={index}
              count={items.length}
              onMove={(to) => ops.moveSectionItem('interests', index, to)}
            />
            <span className="inline-flex min-w-0 flex-1 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-3 pr-1">
              <input
                value={value ?? ''}
                onChange={(e) => ops.updateSectionItem('interests', index, { text: e.target.value })}
                aria-label={label}
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-indigo-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => ops.removeSectionItem('interests', index)}
                aria-label="Retirer"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
              >
                ×
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Ajouter un centre d'intérêt…"
          className="min-w-0 flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button variant="secondary" className="text-xs" onClick={add}>
          + Ajouter
        </Button>
      </div>
    </div>
  )
}

export default function SectionCard({
  section,
  isTwoCol,
  content,
  style,
  ops,
  sectionIndex,
  sectionCount,
  language = 'fr',
  pageBreak = false,
  dragHandle = null,
}) {
  const [open, setOpen] = useState(section.key === 'summary' || section.key === 'experiences')

  const label = style.labels[section.key] || section.key

  const toggleVisibility = (e) => {
    e.stopPropagation()
    ops.toggleSectionVisibility(section.key)
  }

  const toggleBreak = (e) => {
    e.stopPropagation()
    ops.togglePageBreak(section.key)
  }

  const moveBy = (e, dir) => {
    e.stopPropagation()
    ops.moveSection(section.key, dir)
  }

  const switchColumn = (e, column) => {
    e.stopPropagation()
    ops.setSectionColumn(section.key, column)
  }

  const hasContent =
    section.key === 'summary'
      ? Boolean((content.summary || '').trim())
      : Array.isArray(content[section.key]) && content[section.key].length > 0

  // Dans les modèles 2 colonnes, la page est une grille à deux cellules
  // (`.cv-page { display: grid }`) : un saut de page dans la colonne latérale
  // ne déplace pas la colonne principale, il produit une page dont la moitié
  // est vide. Le bouton n'a donc aucun sens sur ces sections.
  const inSidebar = isTwoCol && section.column === 'sidebar'

  return (
    <div className={`rounded-xl border bg-white shadow-sm ${section.visible ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}
      >
        <span className="flex items-center gap-1.5">
          {dragHandle && (
            <span
              className="flex cursor-grab touch-none select-none items-center text-slate-400 hover:text-slate-700"
              title="Faire glisser pour réordonner"
              {...dragHandle.attributes}
              {...dragHandle.listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <span className="flex flex-col">
            <button
              type="button"
              disabled={sectionIndex === 0}
              onClick={(e) => moveBy(e, -1)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Monter la rubrique"
              title="Monter la rubrique"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={sectionIndex === sectionCount - 1}
              onClick={(e) => moveBy(e, 1)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Descendre la rubrique"
              title="Descendre la rubrique"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-base font-semibold ${section.visible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
            {label}
          </span>
          {!hasContent && (
            <span className="block text-xs text-amber-600">Contenu vide</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {isTwoCol && section.key !== 'summary' && (
            <>
              <button
                type="button"
                onClick={(e) => switchColumn(e, 'main')}
                title="Placer dans la colonne principale"
                className={`rounded px-1.5 py-0.5 text-xs ${
                  section.column === 'main' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                1 col
              </button>
              <button
                type="button"
                onClick={(e) => switchColumn(e, 'sidebar')}
                title="Placer dans la colonne latérale"
                className={`rounded px-1.5 py-0.5 text-xs ${
                  section.column === 'sidebar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                2 col
              </button>
            </>
          )}
          {/* `|| pageBreak` : un saut déjà enregistré sur cette section doit rester
              désactivable, sinon la donnée deviendrait inatteignable. */}
          {(!inSidebar || pageBreak) && (
            <button
              type="button"
              onClick={toggleBreak}
              title="Commencer sur une nouvelle page"
              className={`rounded px-1.5 py-0.5 text-xs ${
                pageBreak ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              ⏎
            </button>
          )}
          <button
            type="button"
            onClick={toggleVisibility}
            title={section.visible ? 'Masquer la rubrique' : 'Afficher la rubrique'}
            aria-label={section.visible ? 'Masquer la rubrique' : 'Afficher la rubrique'}
            className={`rounded p-1.5 transition-colors hover:bg-slate-100 ${
              section.visible ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(!open)
            }}
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={open ? 'Replier' : 'Déplier'}
            title={open ? 'Replier' : 'Déplier'}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </span>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-3">
          {section.key === 'summary' ? (
            <RichEditor
              value={content.summary || ''}
              onChange={(v) => ops.updateSummary(v)}
              rows={4}
              placeholder="Décrivez votre profil en quelques lignes…"
            />
          ) : section.key === 'interests' ? (
            <InterestsSection
              items={content.interests || []}
              ops={ops}
              label={style.labels.interests}
            />
          ) : (
            <ListSection
              config={{
                ...SECTION_FIELD_CONFIGS[section.key],
                sectionKey: section.key,
              }}
              items={content[section.key] || []}
              ops={ops}
              language={language}
            />
          )}
        </div>
      )}
    </div>
  )
}