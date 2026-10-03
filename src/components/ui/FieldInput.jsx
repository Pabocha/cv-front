export const fieldControlClass =
  'rounded-md border border-slate-200 bg-gray-100 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

const SIZES = {
  md: 'py-2.5',
  lg: 'py-3',
}

export function FieldLabel({ label, required = false }) {
  if (!label) return null
  return (
    <label className="mb-0.5 block text-xs font-medium text-slate-600">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

export default function FieldInput({
  label,
  required = false,
  size = 'md',
  onClear,
  clearTitle,
  wrapperClassName = '',
  className = '',
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      <FieldLabel label={label} required={required} />
      <div className={onClear ? 'relative' : undefined}>
        <input
          className={`${fieldControlClass} w-full pl-3 ${SIZES[size]} ${
            onClear ? 'pr-8' : 'pr-3'
          } ${className}`}
          {...props}
        />
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            title={clearTitle}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
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
        )}
      </div>
    </div>
  )
}