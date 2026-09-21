import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSection, deleteSection, getProfile, updateProfile, updateSection } from '../../api/profile'

export function useProfile() {
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  return {
    profile: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useSection(kind) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profile'] })

  const create = useMutation({
    mutationFn: (data) => createSection(kind, data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => updateSection(kind, id, data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id) => deleteSection(kind, id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}