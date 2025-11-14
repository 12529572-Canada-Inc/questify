import type { UserMetrics } from '~/types/metrics'

/**
 * Fetches and caches the current user's dashboard metrics via `/api/users/me/metrics`.
 *
 * @returns the `useFetch` response containing metrics data, pending state, and error refs.
 */
export function useMetrics() {
  return useFetch<UserMetrics>('/api/users/me/metrics', {
    key: 'user-metrics',
  })
}
