import api from './client'

export const analyzeCv = (id, jobOffer) =>
  api.post(`/cvs/${id}/ats-analysis/`, { job_offer: jobOffer })

export const listAtsReports = (id) => api.get(`/cvs/${id}/ats-reports/`)

export const getAtsReport = (id, reportId) =>
  api.get(`/cvs/${id}/ats-reports/${reportId}/`)