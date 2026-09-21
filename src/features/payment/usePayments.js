import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkoutSubscription,
  getMyEntitlements,
} from '../../api/payments'

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