import { useEffect, useRef, useState } from 'react'
import { Minimize2, Scan } from '../../../components/ui/Icons'
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

/* Les contrôles ne portent pas leur propre étiquette : dans le rail d'icônes
   le nom du groupe est déjà le titre du popover, et le répéter produirait
   « Taille » puis « Taille » au-dessus de la même liste. Le libellé est donc
   fourni par le contexte (titre du popover ou GroupLabel du panneau détaillé). */
function Select({ value, onChange, options, optionLabel }) {
  return (
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
  )
}

/* `display="buttons"` (défaut, utilisé dans les popovers) déplie les valeurs en
   pastilles cliquables : une liste déroulante cachait les valeurs derrière un
   clic supplémentaire, pour une poignée d'options. L'axe est vertical dans les
   popovers — une option par ligne, cible large et valeur lisible d'un coup —
   et horizontal dans le panneau détaillé, où la place est comptée. */
function Choices({ options, value, onPick, display = 'buttons', axis = 'vertical' }) {
  if (display === 'select') {
    return <Select value={value} onChange={onPick} options={options} optionLabel={(o) => o.label} />
  }
  const vertical = axis === 'vertical'
  return (
    <div
      className={`rounded-lg bg-[#ebe9e3] p-0.5 ${vertical ? 'flex flex-col gap-0.5' : 'flex flex-wrap gap-0.5'}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          title={o.label}
          className={[
            'rounded-md px-2.5 py-1.5 text-xs font-medium transition',
            vertical && 'w-full text-left',
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ColorModeControl({ style, onChange, axis }) {
  return (
    <Choices
      axis={axis}
      options={COLOR_MODES}
      value={style.color_mode}
      onPick={(color_mode) => onChange({ color_mode })}
    />
  )
}

function AccentControl({ style, onChange }) {
  return (
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
        className="flex h-6 cursor-pointer items-center gap-1 rounded border border-slate-300 bg-white px-1.5 text-[10px] text-slate-500 hover:bg-slate-50"
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
  )
}

function FontControl({ style, onChange, display, axis = 'vertical' }) {
  return (
    <Choices
      axis={axis}
      display={display}
      options={FONT_PRESETS}
      value={style.font}
      onPick={(font) => onChange({ font })}
    />
  )
}

function FontSizeControl({ style, onChange, display, axis = 'vertical' }) {
  return (
    <Choices
      axis={axis}
      display={display}
      options={FONT_SIZES.map((s) => ({ value: s, label: s.replace('px', ' px') }))}
      value={style.font_size}
      onPick={(font_size) => onChange({ font_size })}
    />
  )
}

function LineHeightControl({ style, onChange, display, axis = 'vertical' }) {
  return (
    <Choices
      axis={axis}
      display={display}
      options={LINE_HEIGHTS.map((h) => ({ value: h, label: h }))}
      value={style.line_height}
      onPick={(line_height) => onChange({ line_height })}
    />
  )
}

function BackgroundControl({ style, onChange, display, axis = 'vertical' }) {
  return (
    <Choices
      axis={axis}
      display={display}
      options={BACKGROUNDS}
      value={style.background || 'none'}
      onPick={(background) => onChange({ background })}
    />
  )
}

const fondIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M12 9v12" />
  </svg>
)

const couleurIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <circle cx="12" cy="12" r="9" />
  </svg>
)

const policeIcon = (
  <span className="flex h-5 w-5 items-center justify-center text-[15px] font-medium leading-none" aria-hidden>
    Aa
  </span>
)

const tailleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <path d="M4 7V5h16v2M12 5v14M9 19h6" />
  </svg>
)

const interligneIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <path d="M4 6h16M4 18h16M8 12h8M12 9v6" />
  </svg>
)

const fondPageIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
  </svg>
)

const modeleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9h6v12" />
  </svg>
)

// Source unique de vérité pour les deux rendus : `Control` est monté tel quel
// dans le popover du rail et sous son GroupLabel dans le panneau détaillé, donc
// les deux ne peuvent pas diverger. `detailedDisplay` et `detailedAxis` ne
// concernent que le panneau détaillé : le rail déplie toujours les valeurs, en
// colonne.
const GROUPS = [
  {
    id: 'color_mode',
    label: 'Fond',
    icon: fondIcon,
    Control: ColorModeControl,
    detailedAxis: 'horizontal',
  },
  { id: 'accent_color', label: 'Couleur', icon: couleurIcon, Control: AccentControl },
  { id: 'font', label: 'Police', icon: policeIcon, Control: FontControl, detailedDisplay: 'select' },
  { id: 'font_size', label: 'Taille', icon: tailleIcon, Control: FontSizeControl, detailedDisplay: 'select' },
  { id: 'line_height', label: 'Interligne', icon: interligneIcon, Control: LineHeightControl, detailedDisplay: 'select' },
  { id: 'background', label: 'Arrière-plan', icon: fondPageIcon, Control: BackgroundControl, detailedDisplay: 'select' },
]

function DockButton({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-expanded={active}
      className={`rounded-full p-2.5 transition ${
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
    </button>
  )
}

function ScanButton({ onToggleScan, scanActive }) {
  if (!onToggleScan) return null
  return (
    <DockButton
      label={scanActive ? "Quitter l'agrandissement" : 'Agrandir le CV'}
      icon={scanActive ? <Minimize2 /> : <Scan />}
      active={scanActive}
      onClick={onToggleScan}
    />
  )
}

// Rail flottant : une pastille d'icônes, un groupe déployé à la fois.
// S'auto-positionne en bas à droite de son hôte, qui doit être positionné.
function DockStyleBar({ style, onChange, groups, dockRef, open, setOpen, onOpenTemplates, onToggleScan, scanActive }) {
  const current = groups.find((g) => g.id === open)
  const Control = current?.Control

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4">
      <div ref={dockRef} className="pointer-events-auto flex flex-col items-end gap-2">
        {current && Control && (
          <div
            id={`style-group-${current.id}`}
            role="group"
            aria-label={current.label}
            className="flex w-72 flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl"
          >
            <GroupLabel>{current.label}</GroupLabel>
            <Control style={style} onChange={onChange} />
          </div>
        )}

        <div className="flex items-center gap-1 rounded-full bg-white/95 p-1.5 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          {groups.map((group) => (
            <DockButton
              key={group.id}
              label={group.label}
              icon={group.icon}
              active={open === group.id}
              onClick={() => setOpen(open === group.id ? null : group.id)}
            />
          ))}

          {onOpenTemplates && (
            <DockButton label="Modèle" icon={modeleIcon} active={false} onClick={onOpenTemplates} />
          )}

          {onToggleScan && (
            <>
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
              <ScanButton onToggleScan={onToggleScan} scanActive={scanActive} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Panneau complet : tous les groupes visibles d'un coup, en flux normal.
// Panneau complet : sur desktop, liste détaillée étalée (flux normal). Sur
// mobile, il se replie en dock d'icônes pour rester compact.
function DetailedStyleBar({ style, onChange, groups, onOpenTemplates, onToggleScan, scanActive }) {
  // Sur petit écran, le panneau détaillé devient un dock repliable comme
  // dans l'éditeur : icônes seules, popover en accordéon.
  const [open, setOpen] = useState(null)
  const dockRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!dockRef.current?.contains(e.target)) setOpen(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const current = groups.find((g) => g.id === open)
  const Control = current?.Control

  // Version desktop (>= sm) : barre horizontale détaillée, en flux.
  // Version mobile (< sm) : dock repliable identique au dock flottant.
  return (
    <>
{/* Version desktop (>= sm) : barre horizontale détaillée, en flux.
   Affiche les valeurs directement en boutons (pas de select), alignées verticalement
   pour les listes sauf le groupe Fond qui reste horizontal. */}
      <div className="hidden sm:flex pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex flex-wrap items-end gap-x-5 gap-y-3 rounded-2xl border border-slate-200/80 bg-[#fbfaf7]/95 px-5 py-3.5 shadow-xl backdrop-blur">
{groups.map(({ id, label, icon, Control, detailedDisplay, detailedAxis }) => (
              <div key={id} className="flex flex-col gap-1">
                <GroupLabel icon={icon}>{label}</GroupLabel>
                <Control
                  style={style}
                  onChange={onChange}
                  display={detailedDisplay}
                  axis={detailedAxis || (detailedDisplay === 'select' ? 'horizontal' : 'vertical')}
                />
              </div>
            ))}

          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
              title="Changer de modèle"
            >
              {modeleIcon}
              Modèle
            </button>
          )}

          {onToggleScan && (
            <DockButton
              label={scanActive ? "Quitter l'agrandissement" : 'Agrandir le CV'}
              icon={scanActive ? <Minimize2 /> : <Scan />}
              active={scanActive}
              onClick={onToggleScan}
            />
          )}
        </div>
      </div>

      {/* Mobile : dock repliable */}
      <div className="sm:hidden pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div ref={dockRef} className="pointer-events-auto flex flex-col items-end gap-2">
          {current && Control && (
            <div
              id={`style-group-${current.id}`}
              role="group"
              aria-label={current.label}
              className="flex w-72 flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl"
            >
              <GroupLabel>{current.label}</GroupLabel>
              <Control
                style={style}
                onChange={onChange}
                display={current.detailedDisplay}
                axis={current.detailedAxis || (current.detailedDisplay === 'select' ? 'horizontal' : 'vertical')}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-white/95 p-1.5 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            {groups.map((group) => (
              <DockButton
                key={group.id}
                label={group.label}
                icon={group.icon}
                active={open === group.id}
                onClick={() => setOpen(open === group.id ? null : group.id)}
              />
            ))}

            {onOpenTemplates && (
              <DockButton label="Modèle" icon={modeleIcon} active={false} onClick={onOpenTemplates} />
            )}

            {onToggleScan && (
              <>
                <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:inline" aria-hidden />
                <DockButton
                  label={scanActive ? "Quitter l'agrandissement" : 'Agrandir le CV'}
                  icon={scanActive ? <Minimize2 /> : <Scan />}
                  active={scanActive}
                  onClick={onToggleScan}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function StyleBar({
  style,
  onChange,
  onOpenTemplates,
  onToggleScan,
  scanActive,
  variant = 'dock',
}) {
  // Un seul groupe déployé à la fois : la pastille reste compacte et un clic
  // sur une autre icône déplace le popover au lieu d'empiler les contrôles.
  const [open, setOpen] = useState(null)
  const dockRef = useRef(null)

  useEffect(() => {
    if (variant !== 'dock' || !open) return
    const onPointerDown = (e) => {
      if (!dockRef.current?.contains(e.target)) setOpen(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, variant])

  if (variant === 'detailed') {
    return (
      <DetailedStyleBar
        style={style}
        onChange={onChange}
        groups={GROUPS}
        onOpenTemplates={onOpenTemplates}
        onToggleScan={onToggleScan}
        scanActive={scanActive}
      />
    )
  }

  return (
    <DockStyleBar
      style={style}
      onChange={onChange}
      groups={GROUPS}
      dockRef={dockRef}
      open={open}
      setOpen={setOpen}
      onOpenTemplates={onOpenTemplates}
      onToggleScan={onToggleScan}
      scanActive={scanActive}
    />
  )
}