import api from './client'

export const getPlans = () => api.get('/payments/plans/')

export const getMyEntitlements = () => api.get('/payments/me/')

export const checkoutSubscription = (plan) =>
  api.post('/payments/checkout/', { plan })