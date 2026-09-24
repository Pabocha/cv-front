import { useEffect, useRef } from 'react'

function ToolbarButton({ label, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
    >
      {label}
    </button>
  )
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
        <ToolbarButton label="B" title="Gras" onClick={() => exec('bold')} />
        <ToolbarButton label="I" title="Italique" onClick={() => exec('italic')} />
        <ToolbarButton label="U" title="Souligné" onClick={() => exec('underline')} />
        <ToolbarButton label="S" title="Barré" onClick={() => exec('strikeThrough')} />
        <ToolbarButton label="• Liste" title="Liste à puces" onClick={() => exec('insertUnorderedList')} />
        <ToolbarButton label="1. Liste" title="Liste numérotée" onClick={() => exec('insertOrderedList')} />
        <span className="w-px self-stretch bg-slate-200" />
        <ToolbarButton label="Gauche" title="Aligner à gauche" onClick={() => exec('justifyLeft')} />
        <ToolbarButton label="Centré" title="Centrer" onClick={() => exec('justifyCenter')} />
        <ToolbarButton label="Droite" title="Aligner à droite" onClick={() => exec('justifyRight')} />
        <ToolbarButton label="Justifié" title="Justifier" onClick={() => exec('justifyFull')} />
        <ToolbarButton label="↺" title="Effacer la mise en forme" onClick={clearFormat} />
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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}