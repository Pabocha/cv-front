import api from './client'

/**
 * Flux « CV sans compte » — le paiement précède la génération IA.
 * L'ordre est imposé par le backend : initiate → payment → confirm →
 * generate → template. Appeler `guestGenerate` avant `guestPay` renvoie un 402.
 */
export const guestInitiate = (description) =>
  api.post('/guest-cvs/', { description })

export const guestPay = (token, templateSlug) =>
  api.post(`/guest-cvs/${token}/payment/`, { template: templateSlug })

export const guestConfirmPayment = (token) =>
  api.post(`/guest-cvs/${token}/payment/confirm/`, {})

export const guestGenerate = (token) =>
  api.post(`/guest-cvs/${token}/generate/`, {})

export const guestSetTemplate = (token, templateSlug) =>
  api.post(`/guest-cvs/${token}/template/`, { template: templateSlug })

export const guestStatus = (token) => api.get(`/guest-cvs/${token}/status/`)

export const guestClaim = (token) => api.post(`/guest-cvs/${token}/claim/`, {})

export const guestDownloadPdf = (token) =>
  api.get(`/guest-cvs/${token}/pdf/`, { responseType: 'blob' })

export const guestPreviewUrl = (token, slug) => {
  const base = api.defaults.baseURL.replace(/\/$/, '')
  return `${base}/guest-cvs/${token}/preview/${slug}/`
}

/** Prix affiché avant paiement : toujours celui renvoyé par le backend. */
export const formatCfa = (amount) =>
  new Intl.NumberFormat('fr-FR').format(amount ?? 0)
