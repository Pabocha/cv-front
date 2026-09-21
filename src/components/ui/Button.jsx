export default function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50'
  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}