import type { UserMetrics } from '~/types/metrics'

/**
 * Fetches and caches the current user's dashboard metrics via the metrics API.
 */
export function useMetrics() {
  return useFetch<UserMetrics>('/api/users/me/metrics', {
    key: 'user-metrics',
  })
}
