import { useState } from 'react'
import Button from '../../../components/ui/Button'
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
  return (
    <span className="flex gap-1">
      <select
        value={value.month ?? ''}
        onChange={(e) => onChange({ ...value, month: e.target.value })}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
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
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Début</span>
        <MonthYear
          value={{ month: value.startMonth, year: value.startYear }}
          onChange={(v) => onChange({ ...value, startMonth: v.month, startYear: v.year })}
          language={language}
          options={YEARS}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Fin</span>
        <MonthYear
          value={{ month: value.endMonth, year: value.endYear, disabled: value.current }}
          onChange={(v) => onChange({ ...value, endMonth: v.month, endYear: v.year })}
          language={language}
          options={YEARS}
        />
        <label className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(value.current)}
            onChange={(e) => onChange({ ...value, current: e.target.checked })}
          />
          {currentLabel}
        </label>
      </div>
    </div>
  )
}

function DatePicker({ value, onChange, language }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <MonthYear value={value} onChange={onChange} language={language} options={YEARS} />
    </div>
  )
}

function DragButtons({ onMove, index, count }) {
  return (
    <span className="flex flex-col gap-0.5">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="disabled:opacity-30"
        aria-label="Monter"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        className="disabled:opacity-30"
        aria-label="Descendre"
      >
        ▼
      </button>
    </span>
  )
}

function defaultValue(f, item) {
  if (f.type === 'period') return parsePeriod(item?.[f.name])
  if (f.type === 'date') return parseDate(item?.[f.name])
  return item?.[f.name] ?? ''
}

function rawValue(f, value, language) {
  if (f.type === 'period') return composePeriod(value, language).trim()
  if (f.type === 'date') return composeDate(value, language).trim()
  return (value ?? '').trim()
}

function ItemEditor({ config, item, onSave, onCancel, language }) {
  const [form, setForm] = useState(
    config.fields.reduce((acc, f) => ({ ...acc, [f.name]: defaultValue(f, item) }), {}),
  )
  const [error, setError] = useState('')

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
      {config.fields.map((f) => (
        <div key={f.name}>
          <label className="mb-0.5 block text-xs font-medium text-slate-600">
            {f.label}
            {f.required && <span className="text-red-500"> *</span>}
          </label>
          {f.type === 'textarea' ? (
            <RichEditor
              value={form[f.name] ?? ''}
              onChange={(v) => setForm({ ...form, [f.name]: v })}
              rows={2}
            />
          ) : f.type === 'period' ? (
            <PeriodPicker
              value={form[f.name]}
              onChange={(v) => setForm({ ...form, [f.name]: v })}
              language={language}
              currentLabel={f.currentLabel || 'En poste'}
            />
          ) : f.type === 'date' ? (
            <DatePicker
              value={form[f.name]}
              onChange={(v) => setForm({ ...form, [f.name]: v })}
              language={language}
            />
          ) : (
            <input
              value={form[f.name] ?? ''}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              type={f.type === 'url' ? 'url' : 'text'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
      ))}
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
        <div key={`${itemLabel(item)}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2">
          <div className="flex items-center gap-2">
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
            <div className="flex shrink-0 gap-1">
              {editing !== index && editing !== 'new' && (
                <Button variant="secondary" className="text-xs" onClick={() => setEditing(index)}>
                  Modifier
                </Button>
              )}
              <Button
                variant="danger"
                className="text-xs"
                onClick={() => {
                  if (window.confirm('Supprimer cet élément ?')) ops.removeSectionItem(config.sectionKey, index)
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
          {editing === index && (
            <div className="mt-2">
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
  return (
    <div className="space-y-2">
      {items.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <DragButtons
            index={index}
            count={items.length}
            onMove={(to) => ops.moveSectionItem('interests', index, to)}
          />
          <input
            value={value ?? ''}
            onChange={(e) => ops.updateSectionItem('interests', index, { text: e.target.value })}
            placeholder={label}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            variant="danger"
            className="text-xs"
            onClick={() => ops.removeSectionItem('interests', index)}
          >
            Supprimer
          </Button>
        </div>
      ))}
      <Button variant="secondary" className="text-xs" onClick={() => ops.addSectionItem('interests', { text: '' })}>
        + Ajouter
      </Button>
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
              className="flex cursor-grab touch-none select-none flex-col text-slate-400 hover:text-slate-700"
              title="Faire glisser pour réordonner"
              {...dragHandle.attributes}
              {...dragHandle.listeners}
              onClick={(e) => e.stopPropagation()}
            >
              ⠿
            </span>
          )}
          <span className="flex flex-col text-xs text-slate-400">
            <button
              type="button"
              disabled={sectionIndex === 0}
              onClick={(e) => moveBy(e, -1)}
              className="disabled:opacity-30 hover:text-slate-700"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={sectionIndex === sectionCount - 1}
              onClick={(e) => moveBy(e, 1)}
              className="disabled:opacity-30 hover:text-slate-700"
            >
              ▼
            </button>
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-semibold ${section.visible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
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
          <button
            type="button"
            onClick={toggleVisibility}
            title={section.visible ? 'Masquer la rubrique' : 'Afficher la rubrique'}
            className={`rounded px-1.5 py-0.5 text-xs ${
              section.visible ? 'text-emerald-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            {section.visible ? '◉' : '○'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100"
            aria-label={open ? 'Replier' : 'Déplier'}
          >
            {open ? '−' : '+'}
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