import { useIntervalFn } from '@vueuse/core'
import { watch, type ComputedRef } from 'vue'

type Options = {
  tasksLoading: ComputedRef<boolean>
  hasPendingInvestigations: ComputedRef<boolean>
  investigatingTaskIds: ComputedRef<string[]>
}

/**
 * Starts/stops periodic refreshes of quest data when tasks are loading or
 * investigations are pending, avoiding unnecessary polling when idle.
 *
 * @param refresh - Callback invoked when the polling timer fires.
 * @param options - Reactive flags describing when polling should be active.
 */
export function useQuestPolling(refresh: () => void | Promise<void>, {
  tasksLoading,
  hasPendingInvestigations,
  investigatingTaskIds,
}: Options) {
  const { pause, resume } = useIntervalFn(() => {
    refresh()
  }, 2000, { immediate: false })

  watch(
    () => [tasksLoading.value, hasPendingInvestigations.value, investigatingTaskIds.value.length] as const,
    ([loading, pendingInvestigations, activeInvestigations]) => {
      const shouldPoll = loading || pendingInvestigations || activeInvestigations > 0
      if (shouldPoll) resume()
      else pause()
    },
    { immediate: true },
  )

  return {
    pause,
    resume,
  }
}
