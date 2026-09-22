import { useLayoutEffect, useRef, useState } from 'react'

function ToolbarButton({ label, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
    >
      {label}
    </button>
  )
}

export default function RichTextarea({ value, onChange, rows = 2, placeholder }) {
  const ref = useRef(null)
  const [cursor, setCursor] = useState(null)

  useLayoutEffect(() => {
    if (cursor && ref.current) {
      ref.current.focus()
      ref.current.setSelectionRange(cursor.start, cursor.end)
    }
  }, [cursor])

  const apply = (transform) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = el.value.slice(start, end)
    const { value: next, caret } = transform(el.value, start, end, sel)
    onChange(next)
    setCursor(caret)
  }

  const wrap = (before, after) =>
    apply((text, s, e, sel) => {
      const next = sel
        ? `${text.slice(0, s)}${before}${sel}${after}${text.slice(e)}`
        : `${text.slice(0, s)}${before}${after}${text.slice(e)}`
      const caret = sel
        ? { start: s + before.length + sel.length + after.length, end: s + before.length + sel.length + after.length }
        : { start: s + before.length, end: s + before.length }
      return { value: next, caret }
    })

  const toggleList = () =>
    apply((text, s, e) => {
      const lines = text.split('\n')
      const startLine = text.slice(0, s).split('\n').length - 1
      const endLine = text.slice(0, e).split('\n').length - 1
      const allBulleted = lines
        .slice(startLine, endLine + 1)
        .every((l) => l.trim() === '' || /^\s*-\s+/.test(l))
      for (let i = startLine; i <= endLine; i += 1) {
        if (allBulleted) {
          lines[i] = lines[i].replace(/^\s*-\s+/, '')
        } else if (lines[i].trim() !== '') {
          lines[i] = `- ${lines[i].trimStart()}`
        }
      }
      return { value: lines.join('\n'), caret: { start: s, end: e } }
    })

  return (
    <div>
      <div className="mb-1 flex gap-1">
        <ToolbarButton label="B" title="Gras" onClick={() => wrap('**', '**')} />
        <ToolbarButton label="I" title="Italique" onClick={() => wrap('*', '*')} />
        <ToolbarButton label="U" title="Souligné" onClick={() => wrap('__', '__')} />
        <ToolbarButton label="• Liste" title="Liste à puces" onClick={toggleList} />
      </div>
      <textarea
        ref={ref}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}