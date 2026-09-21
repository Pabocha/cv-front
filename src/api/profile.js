import api from './client'

export const getProfile = () => api.get('/profile/')

export const updateProfile = (data) => {
  const isFormData = data instanceof FormData
  return api.put('/profile/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

const sectionUrl = (kind, id) => `/profile/${kind}/${id ? `${id}/` : ''}`

export const createSection = (kind, data) => api.post(sectionUrl(kind), data)

export const updateSection = (kind, id, data) => api.patch(sectionUrl(kind, id), data)

export const deleteSection = (kind, id) => api.delete(sectionUrl(kind, id))