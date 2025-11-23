import { nextTick, watch, type ComputedRef, type Ref } from 'vue'
import type { QuestTaskTab } from '~/types/quest-tasks'

type Options = {
  taskTab: Ref<QuestTaskTab>
  highlightedTaskId: ComputedRef<string | null>
  tasksLoading: ComputedRef<boolean>
  todoTaskIds: ComputedRef<string[]>
  completedTaskIds: ComputedRef<string[]>
}

/**
 * Watches the highlighted task id and ensures the correct tab is active when
 * deep-linking into a quest so the target task is visible once data loads.
 *
 * @param options - Reactive refs for current tab, highlight id, and task buckets.
 */
export function useQuestTaskHighlight({
  taskTab,
  highlightedTaskId,
  tasksLoading,
  todoTaskIds,
  completedTaskIds,
}: Options) {
  const canAccessDom = typeof window !== 'undefined' && typeof document !== 'undefined'

  watch(
    [
      highlightedTaskId,
      () => tasksLoading.value,
      todoTaskIds,
      completedTaskIds,
      () => taskTab.value,
    ],
    async ([taskId, loading, todoIds, completedIds]) => {
      if (!taskId || loading) {
        return
      }

      if (todoIds.includes(taskId)) {
        taskTab.value = 'todo'
      }
      else if (completedIds.includes(taskId)) {
        taskTab.value = 'completed'
      }

      if (canAccessDom) {
        await nextTick()
        const target = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    { immediate: true },
  )
}
