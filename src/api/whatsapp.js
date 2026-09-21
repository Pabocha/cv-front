import api from './client'

export const getWhatsAppConfig = () => api.get('/whatsapp/config/')

export const createWhatsAppOrder = (payload) =>
  api.post('/whatsapp/orders/', payload)