import { computed, ref, unref, watch, type MaybeRef } from 'vue'
import type { Task } from '@prisma/client'

type QuestWithTasks = {
  status?: string | null
  tasks?: Task[] | null
} | null | undefined

export function useQuestTasks(quest: MaybeRef<QuestWithTasks>) {
  const questValue = computed(() => unref(quest) ?? null)

  const allTasks = computed<Task[]>(() => questValue.value?.tasks ?? [])

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

type TaskTab = 'todo' | 'completed'

export function useQuestTaskTabs(
  todoTasks: MaybeRef<Task[]>,
  completedTasks: MaybeRef<Task[]>,
) {
  const taskTab = ref<TaskTab>('todo')

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

  return {
    taskTab,
  }
}
