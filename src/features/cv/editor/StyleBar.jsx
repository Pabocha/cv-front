import {
  ACCENT_PALETTE,
  BACKGROUNDS,
  COLOR_MODES,
  FONT_PRESETS,
  FONT_SIZES,
  LINE_HEIGHTS,
} from './editorConfigs'

function GroupLabel({ icon, children }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
      {icon}
      {children}
    </span>
  )
}

function Select({ label, icon, value, onChange, options, optionLabel }) {
  return (
    <label className="flex flex-col gap-1">
      <GroupLabel icon={icon}>{label}</GroupLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {optionLabel(o)}
          </option>
        ))}
      </select>
    </label>
  )
}

const tailleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
    <path d="M4 7V5h16v2M12 5v14M9 19h6" />
  </svg>
)

export default function StyleBar({ style, onChange, onOpenTemplates }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-1">
        <GroupLabel icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M12 9v12" />
          </svg>
        }>
          Fond
        </GroupLabel>
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {COLOR_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange({ color_mode: mode.value })}
              title={mode.label}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                style.color_mode === mode.value
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <GroupLabel icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
            <circle cx="12" cy="12" r="9" />
          </svg>
        }>
          Couleur
        </GroupLabel>
        <div className="flex flex-wrap items-center gap-1">
          {ACCENT_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ accent_color: color })}
              title={color}
              className={`h-6 w-6 rounded-full border ${
                style.accent_color === color
                  ? 'border-slate-900 ring-2 ring-offset-1'
                  : 'border-slate-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <label
            className="flex h-6 cursor-pointer items-center gap-1 rounded border border-slate-300 px-1.5 text-[10px] text-slate-500 hover:bg-slate-50"
            title="Choisir une couleur"
          >
            <input
              type="color"
              value={style.accent_color}
              onChange={(e) => onChange({ accent_color: e.target.value })}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
            Libre
          </label>
        </div>
      </div>

      <Select
        label="Police"
        icon="Aa"
        value={style.font}
        onChange={(font) => onChange({ font })}
        options={FONT_PRESETS}
        optionLabel={(o) => o.label}
      />

      <Select
        label="Taille"
        icon={tailleIcon}
        value={style.font_size}
        onChange={(font_size) => onChange({ font_size })}
        options={FONT_SIZES.map((s) => ({ value: s, label: s.replace('px', ' px') }))}
        optionLabel={(o) => o.label}
      />

      <Select
        label="Interligne"
        icon="↕"
        value={style.line_height}
        onChange={(line_height) => onChange({ line_height })}
        options={LINE_HEIGHTS.map((h) => ({ value: h, label: h }))}
        optionLabel={(o) => o.label}
      />

      <Select
        label="Arrière-plan"
        value={style.background || 'none'}
        onChange={(background) => onChange({ background })}
        options={BACKGROUNDS}
        optionLabel={(o) => o.label}
      />

      {onOpenTemplates && (
        <button
          type="button"
          onClick={onOpenTemplates}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
          title="Changer de modèle"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9h6v12" />
          </svg>
          Modèle
        </button>
      )}
    </div>
  )
}