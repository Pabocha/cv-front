import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkoutSubscription,
  getMyEntitlements,
  getPlans,
} from '../../api/payments'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await getPlans()).data,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEntitlements() {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const { data } = await getMyEntitlements()
      return data
    },
    retry: 1,
  })
}

export function useSubscribe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: checkoutSubscription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entitlements'] }),
  })
}