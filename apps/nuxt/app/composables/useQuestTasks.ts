import { computed, ref, unref, watch, type MaybeRef } from 'vue'
import type { QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'

type QuestWithTasks = {
  status?: string | null
  tasks?: TaskWithInvestigations[] | null
} | null | undefined

/**
 * Normalizes quest tasks into reactive collections (todo vs completed) and
 * exposes UI helpers such as the currently active tab and loading flags.
 */
export function useQuestTasks(quest: MaybeRef<QuestWithTasks>) {
  const questValue = computed(() => unref(quest) ?? null)

  const allTasks = computed<TaskWithInvestigations[]>(() => {
    const tasks = (questValue.value?.tasks ?? []).map(task => ({
      ...task,
      investigations: Array.isArray(task.investigations) ? task.investigations : [],
    }))

    return tasks.sort((a, b) => {
      const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
      const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER

      if (aOrder === bOrder) {
        return a.id.localeCompare(b.id)
      }

      return aOrder - bOrder
    })
  })

  const tasksLoading = computed(() => {
    if (!questValue.value) {
      return false
    }

    const tasks = questValue.value.tasks ?? []
    return questValue.value.status === 'draft' && tasks.length === 0
  })

  const todoTasks = computed(() =>
    allTasks.value.filter(task => task.status !== 'completed'),
  )

  const completedTasks = computed(() =>
    allTasks.value.filter(task => task.status === 'completed'),
  )

  const hasTasks = computed(() => allTasks.value.length > 0)

  return {
    questValue,
    allTasks,
    tasksLoading,
    todoTasks,
    completedTasks,
    hasTasks,
  }
}

export function useQuestTaskTabs(
  todoTasks: MaybeRef<TaskWithInvestigations[]>,
  completedTasks: MaybeRef<TaskWithInvestigations[]>,
) {
  const taskTab = ref<QuestTaskTab>('todo')

  watch([
    () => unref(todoTasks).length,
    () => unref(completedTasks).length,
  ], ([todo, completed]) => {
    if (taskTab.value === 'todo' && todo === 0 && completed > 0) {
      taskTab.value = 'completed'
    }
    else if (taskTab.value === 'completed' && completed === 0 && todo > 0) {
      taskTab.value = 'todo'
    }
  }, { immediate: true })

  return { taskTab }
}
