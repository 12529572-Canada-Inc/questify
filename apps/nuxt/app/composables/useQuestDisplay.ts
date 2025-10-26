import { computed, type ComputedRef } from 'vue'
import { QuestStatus, type Quest } from '@prisma/client'
import type { QuestTaskSection, QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'

type QuestWithOwner = Quest & { owner?: { name?: string | null } | null }

type TaskActionHandler = (taskId: string) => void

type Options = {
  quest: ComputedRef<QuestWithOwner | null>
  todoTasks: ComputedRef<TaskWithInvestigations[]>
  completedTasks: ComputedRef<TaskWithInvestigations[]>
  isOwner: ComputedRef<boolean>
  markTaskCompleted: TaskActionHandler
  markTaskIncomplete: TaskActionHandler
}

export function useQuestDisplay({
  quest,
  todoTasks,
  completedTasks,
  isOwner,
  markTaskCompleted,
  markTaskIncomplete,
}: Options) {
  const questStatusMeta = computed(() => {
    const status = quest.value?.status ?? QuestStatus.draft
    const base = {
      label: 'Draft',
      icon: 'mdi-pencil-circle',
      color: 'secondary',
    }

    const map: Record<string, typeof base> = {
      [QuestStatus.draft]: base,
      [QuestStatus.active]: {
        label: 'Active',
        icon: 'mdi-timer-sand',
        color: 'primary',
      },
      [QuestStatus.completed]: {
        label: 'Completed',
        icon: 'mdi-check-circle',
        color: 'success',
      },
      [QuestStatus.failed]: {
        label: 'Failed',
        icon: 'mdi-alert-octagon',
        color: 'error',
      },
      [QuestStatus.archived]: {
        label: 'Archived',
        icon: 'mdi-archive-outline',
        color: 'grey-darken-1',
      },
    }

    return map[status] ?? base
  })

  const taskSections = computed<QuestTaskSection[]>(() => [
    {
      value: 'todo' as QuestTaskTab,
      title: 'To Do',
      color: 'primary',
      emptyMessage: 'All tasks are completed!',
      tasks: todoTasks.value,
      completed: false,
      action: isOwner.value
        ? {
            label: 'Complete',
            color: 'success',
            handler: markTaskCompleted,
          }
        : null,
    },
    {
      value: 'completed' as QuestTaskTab,
      title: 'Completed',
      color: 'success',
      emptyMessage: 'No tasks have been completed yet.',
      tasks: completedTasks.value,
      completed: true,
      action: isOwner.value
        ? {
            label: 'Mark Incomplete',
            color: 'warning',
            handler: markTaskIncomplete,
          }
        : null,
    },
  ])

  return {
    questStatusMeta,
    taskSections,
  }
}

export function useQuestErrorAlert(error: ComputedRef<{ statusCode?: number } | null | undefined>) {
  const errorType = computed(() => {
    if (!error.value) return null
    if (error.value.statusCode === 404) {
      return 'not-found'
    }
    else if (error.value.statusCode === 403 || error.value.statusCode === 401) {
      return 'unauthorized'
    }
    return 'unknown'
  })

  const questErrorAlert = computed(() => {
    switch (errorType.value) {
      case 'not-found':
        return {
          type: 'error' as const,
          title: 'Quest Not Found',
          message: 'This quest does not exist.',
        }
      case 'unauthorized':
        return {
          type: 'error' as const,
          title: 'Unauthorized',
          message: 'You are not authorized to view this quest.',
        }
      case 'unknown':
        return {
          type: 'error' as const,
          title: 'Error',
          message: 'An unexpected error occurred. Please try again later.',
        }
      default:
        return null
    }
  })

  return {
    errorType,
    questErrorAlert,
  }
}
