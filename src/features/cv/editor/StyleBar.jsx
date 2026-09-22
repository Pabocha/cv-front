import {
  ACCENT_PALETTE,
  COLOR_MODES,
  FONT_PRESETS,
  FONT_SIZES,
  LINE_HEIGHTS,
} from './editorConfigs'

function Select({ label, value, onChange, options, optionLabel }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="shrink-0">{label}</span>
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

export default function StyleBar({ style, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-600">Fond</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
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

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-600">Couleur</span>
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
        value={style.font}
        onChange={(font) => onChange({ font })}
        options={FONT_PRESETS}
        optionLabel={(o) => o.label}
      />

      <Select
        label="Taille"
        value={style.font_size}
        onChange={(font_size) => onChange({ font_size })}
        options={FONT_SIZES.map((s) => ({ value: s, label: s.replace('px', ' px') }))}
        optionLabel={(o) => o.label}
      />

      <Select
        label="Interligne"
        value={style.line_height}
        onChange={(line_height) => onChange({ line_height })}
        options={LINE_HEIGHTS.map((h) => ({ value: h, label: h }))}
        optionLabel={(o) => o.label}
      />
    </div>
  )
}