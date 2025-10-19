import { watch, type ComputedRef, type Ref } from 'vue'
import type { QuestTaskTab } from '~/types/quest-tasks'

type Options = {
  taskTab: Ref<QuestTaskTab>
  highlightedTaskId: ComputedRef<string | null>
  tasksLoading: ComputedRef<boolean>
  todoTaskIds: ComputedRef<string[]>
  completedTaskIds: ComputedRef<string[]>
}

export function useQuestTaskHighlight({
  taskTab,
  highlightedTaskId,
  tasksLoading,
  todoTaskIds,
  completedTaskIds,
}: Options) {
  watch(
    [highlightedTaskId, () => tasksLoading.value, todoTaskIds, completedTaskIds],
    ([taskId, loading, todoIds, completedIds]) => {
      if (!taskId || loading) {
        return
      }

      if (todoIds.includes(taskId)) {
        taskTab.value = 'todo'
      }
      else if (completedIds.includes(taskId)) {
        taskTab.value = 'completed'
      }
    },
    { immediate: true },
  )
}
