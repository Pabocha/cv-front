import api from './client'

export const listCvs = () => api.get('/cvs/')

export const getCv = (id) => api.get(`/cvs/${id}/`)

export const createCv = (data) => api.post('/cvs/', data)

export const updateCv = (id, data) => api.patch(`/cvs/${id}/`, data)

export const deleteCv = (id) => api.delete(`/cvs/${id}/`)

export const generateCv = (id) => api.post(`/cvs/${id}/generate/`)

export const adaptCv = (id, jobOffer) =>
  api.post(`/cvs/${id}/adapt/`, { job_offer: jobOffer })

export const previewCv = (id) =>
  api.get(`/cvs/${id}/preview/`, { responseType: 'text' })

export const pdfCv = (id) =>
  api.get(`/cvs/${id}/pdf/`, { responseType: 'blob' })

export const uploadCvPhoto = (id, file) => {
  const data = new FormData()
  data.append('photo', file)
  return api.post(`/cvs/${id}/upload_photo/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
