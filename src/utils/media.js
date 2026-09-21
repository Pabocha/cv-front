const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path}`
}