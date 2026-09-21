export default function Input({ label, error, className = '', id, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-slate-300 focus:ring-indigo-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}