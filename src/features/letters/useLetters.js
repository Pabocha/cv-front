import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLetter,
  downloadLetterPdf,
  listLetters,
  updateLetter,
} from '../../api/letters'

export function useLetters(cvId) {
  return useQuery({
    queryKey: ['letters', cvId],
    queryFn: async () => {
      const { data } = await listLetters(cvId)
      return data
    },
    enabled: !!cvId,
  })
}

export function useCreateLetter(cvId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offer) => createLetter(cvId, offer),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['letters', cvId] }),
  })
}

export function useSaveLetter(cvId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ letterId, content }) =>
      updateLetter(cvId, letterId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['letters', cvId] }),
  })
}

export function useDownloadLetterPdf() {
  return useMutation({
    mutationFn: async ({ cvId, letterId }) => {
      const { data } = await downloadLetterPdf(cvId, letterId)
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `lettre-${letterId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    },
  })
}