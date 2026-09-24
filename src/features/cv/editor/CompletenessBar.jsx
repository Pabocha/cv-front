export default function CompletenessBar({ content, layout, labels }) {
  const hasContent = (key) =>
    key === 'summary'
      ? Boolean((content.summary || '').trim())
      : Array.isArray(content[key]) && content[key].length > 0

  const sections = layout.sections.filter((s) => s.visible)
  const filled = sections.filter((s) => hasContent(s.key)).length
  const percent = sections.length ? Math.round((filled / sections.length) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Complétude du CV</p>
        <p className="text-sm font-bold text-indigo-600">{percent}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${
            percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-3 space-y-1">
        {sections.map((s) => {
          const ok = hasContent(s.key)
          return (
            <li
              key={s.key}
              className={`flex items-center justify-between text-xs ${
                ok ? 'text-slate-500' : 'text-amber-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={ok ? 'text-emerald-600' : 'text-slate-300'}>
                  {ok ? '✓' : '○'}
                </span>
                {labels[s.key]}
              </span>
              {ok ? (
                <span className="text-emerald-600">ok</span>
              ) : (
                <span>à remplir</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}