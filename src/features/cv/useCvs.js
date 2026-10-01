import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCvs,
  getCv,
  createCv,
  updateCv,
  deleteCv,
  generateCv,
  previewCv,
  pdfCv,
  importCv,
} from '../../api/cvs'
import { getTemplates } from '../../api/templates'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await getTemplates()
      return data.results
    },
  })
}

export function useCvs() {
  return useQuery({
    queryKey: ['cvs'],
    queryFn: async () => {
      const { data } = await listCvs()
      return data.results
    },
  })
}

export function useCv(id) {
  return useQuery({
    queryKey: ['cvs', id],
    queryFn: async () => {
      const { data } = await getCv(id)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCv,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  })
}

export function useUpdateCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => updateCv(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      qc.invalidateQueries({ queryKey: ['cvs', variables.id] })
    },
  })
}

export function useDeleteCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCv,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  })
}

export function useGenerateCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateCv,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['cvs', id] })
      qc.invalidateQueries({ queryKey: ['cvs'] })
    },
  })
}

// L'import renvoie `{ cv, preview_html }` : on invalide la liste (le nouveau CV
// y apparaît) et la source, dont le statut vient de changer.
export function useImportCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }) => importCv(id, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      qc.invalidateQueries({ queryKey: ['cvs', variables.id] })
    },
  })
}

export function usePreviewCv() {
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await previewCv(id)
      return data
    },
  })
}

export function usePdfCv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data, headers } = await pdfCv(id)
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = filenameFrom(headers['content-disposition']) || 'cv.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      // Le backend signale dans l'en-tête si le fichier porte un filigrane, et
      // le compteur de PDF propres a changé : on renvoie les deux à l'appelant.
      return { watermarked: headers['x-cv-watermarked'] === '1' }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['entitlements'] }),
  })
}

/** Extrait le nom de fichier de l'en-tête Content-Disposition. */
function filenameFrom(disposition) {
  const match = /filename="?([^";]+)"?/.exec(disposition || '')
  return match ? match[1] : null
}
