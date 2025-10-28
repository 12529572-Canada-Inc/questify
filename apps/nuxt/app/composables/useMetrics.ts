import type { UserMetrics } from '~/types/metrics'

export function useMetrics() {
  return useFetch<UserMetrics>('/api/users/me/metrics', {
    key: 'user-metrics',
  })
}
