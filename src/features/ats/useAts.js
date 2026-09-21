import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { analyzeCv, listAtsReports } from '../../api/ats'

export function useAtsAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, jobOffer }) => analyzeCv(id, jobOffer),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['cvs', variables.id] })
      qc.invalidateQueries({ queryKey: ['ats-reports', variables.id] })
    },
  })
}

export function useAtsReports(id) {
  return useQuery({
    queryKey: ['ats-reports', id],
    queryFn: async () => {
      const { data } = await listAtsReports(id)
      return data
    },
    enabled: !!id,
  })
}