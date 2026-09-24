export const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path}`
}

export function cvPhotoUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:)/.test(path)) return path
  const base = path.startsWith('/') ? '' : '/media/'
  return `${API_ORIGIN}${base}${path.replace(/^\/+/, '')}`
}