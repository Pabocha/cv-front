import api from './client'

export const listLetters = (cvId) => api.get(`/cvs/${cvId}/letters/`)

export const createLetter = (cvId, offer) =>
  api.post(`/cvs/${cvId}/letters/`, { offer })

export const updateLetter = (cvId, letterId, content) =>
  api.patch(`/cvs/${cvId}/letters/${letterId}/`, { content })

export const downloadLetterPdf = (cvId, letterId) =>
  api.get(`/cvs/${cvId}/letters/${letterId}/pdf/`, { responseType: 'blob' })