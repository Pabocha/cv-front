import api from './client'

export const getTemplates = () => api.get('/templates/')

export const getTemplatePreviewUrl = (slug) => {
  const base = api.defaults.baseURL.replace(/\/$/, '')
  return `${base}/templates/${slug}/preview/`
}

export const getTemplateThumbnailUrl = (slug) => {
  const base = api.defaults.baseURL.replace(/\/$/, '')
  return `${base}/templates/${slug}/thumbnail.png`
}