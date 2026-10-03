import { useEffect, useRef } from 'react'
import { fieldControlClass } from '../../../components/ui/FieldInput'

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      {children}
    </svg>
  )
}

function ToolbarButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <span className="mx-0.5 w-px self-stretch bg-slate-200" aria-hidden />
}

export default function RichEditor({ value, onChange, rows = 2, placeholder }) {
  const ref = useRef(null)

  const sync = () => {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const exec = (cmd, arg = null) => {
    const el = ref.current
    if (!el) return
    el.focus()
    try {
      if (document.queryCommandSupported && !document.queryCommandSupported(cmd)) return
      document.execCommand(cmd, false, arg)
    } catch {
      return
    }
    sync()
  }

  const clearFormat = () => exec('removeFormat')

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') || ''
    exec('insertText', text)
  }

  return (
    <div>
      <style>{`[data-rich-editor]:empty::before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none}`}</style>
      <div className="mb-1 flex flex-wrap gap-1">
        <ToolbarButton title="Gras" onClick={() => exec('bold')}>
          <Icon>
            <path d="M6 12h9a4 4 0 0 0 0-8H6z" />
            <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Italique" onClick={() => exec('italic')}>
          <Icon>
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Souligné" onClick={() => exec('underline')}>
          <Icon>
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Barré" onClick={() => exec('strikeThrough')}>
          <Icon>
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </Icon>
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton title="Liste à puces" onClick={() => exec('insertUnorderedList')}>
          <Icon>
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <line x1="4" y1="6" x2="4.01" y2="6" />
            <line x1="4" y1="12" x2="4.01" y2="12" />
            <line x1="4" y1="18" x2="4.01" y2="18" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Liste numérotée" onClick={() => exec('insertOrderedList')}>
          <Icon>
            <line x1="10" y1="6" x2="20" y2="6" />
            <line x1="10" y1="12" x2="20" y2="12" />
            <line x1="10" y1="18" x2="20" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18h2a1 1 0 0 0 0-2H6a1 1 0 0 1 0-2h2" />
          </Icon>
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton title="Aligner à gauche" onClick={() => exec('justifyLeft')}>
          <Icon>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="12" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Centrer" onClick={() => exec('justifyCenter')}>
          <Icon>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Aligner à droite" onClick={() => exec('justifyRight')}>
          <Icon>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="12" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton title="Justifier" onClick={() => exec('justifyFull')}>
          <Icon>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </Icon>
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton title="Effacer la mise en forme" onClick={clearFormat}>
          <Icon>
            <path d="M7 21l-4.3-4.3a2.4 2.4 0 0 1 0-3.4l9.6-9.6a2.4 2.4 0 0 1 3.4 0l5.6 5.6a2.4 2.4 0 0 1 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="M5 11l9 9" />
          </Icon>
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-rich-editor
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
        onPaste={handlePaste}
        style={{ minHeight: `${Math.max(2, rows) * 1.5}rem` }}
        className={`${fieldControlClass} w-full py-2.5 pl-3 pr-3`}
      />
    </div>
  )
}