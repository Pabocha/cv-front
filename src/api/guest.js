import api from './client'

export const guestGenerate = (description) =>
  api.post('/guest-cvs/generate/', { description })

export const guestPreviewUrl = (token, slug) => {
  const base = api.defaults.baseURL.replace(/\/$/, '')
  return `${base}/guest-cvs/${token}/preview/${slug}/`
}

export const guestPay = (token, templateSlug) =>
  api.post(`/guest-cvs/${token}/payment/`, { template: templateSlug })

export const guestConfirmPayment = (token) =>
  api.post(`/guest-cvs/${token}/payment/confirm/`, {})

export const guestStatus = (token) => api.get(`/guest-cvs/${token}/status/`)

export const guestDownloadPdf = (token) =>
  api.get(`/guest-cvs/${token}/pdf/`, { responseType: 'blob' })