import { unref, type MaybeRef } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { resolveApiError } from '~/utils/error'

interface QuestActionsOptions {
  questId: string
  refresh: () => Promise<void>
  isOwner: MaybeRef<boolean>
}

type TaskMutationPayload = {
  status?: 'todo' | 'pending' | 'in-progress' | 'completed' | 'draft'
  title?: string
  details?: string | null
  extraContent?: string | null
}

async function mutateTask(
  taskId: string,
  body: TaskMutationPayload,
  canMutate: () => boolean,
  refresh: () => Promise<void>,
  showSnackbar: ReturnType<typeof useSnackbar>['showSnackbar'],
  messages: { success: string, error: string },
) {
  if (!canMutate()) {
    return
  }

  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body,
    })

    await refresh()
    showSnackbar(messages.success, { variant: 'success' })
  }
  catch (err) {
    const message = resolveApiError(err, messages.error)
    showSnackbar(message, { variant: 'error' })
    throw err
  }
}

async function updateQuestStatus(
  questId: string,
  status: 'active' | 'completed',
  canMutate: () => boolean,
  refresh: () => Promise<void>,
  showSnackbar: ReturnType<typeof useSnackbar>['showSnackbar'],
  messages: { success: string, error: string },
) {
  if (!canMutate()) {
    return
  }

  try {
    await $fetch(`/api/quests/${questId}`, {
      method: 'PATCH',
      body: { status },
    })

    await refresh()
    showSnackbar(messages.success, { variant: 'success' })
  }
  catch (err) {
    const message = resolveApiError(err, messages.error)
    showSnackbar(message, { variant: 'error' })
    throw err
  }
}

export function useQuestActions(options: QuestActionsOptions) {
  const canMutate = () => unref(options.isOwner)
  const { showSnackbar } = useSnackbar()

  async function markTaskCompleted(taskId: string) {
    await mutateTask(
      taskId,
      { status: 'completed' },
      canMutate,
      options.refresh,
      showSnackbar,
      {
        success: 'Task marked as completed.',
        error: 'Unable to mark the task as completed. Please try again.',
      },
    )
  }

  async function markTaskIncomplete(taskId: string) {
    await mutateTask(
      taskId,
      { status: 'todo' },
      canMutate,
      options.refresh,
      showSnackbar,
      {
        success: 'Task moved back to to-do.',
        error: 'Unable to move the task back to to-do. Please try again.',
      },
    )
  }

  async function updateTask(taskId: string, payload: TaskMutationPayload) {
    await mutateTask(
      taskId,
      payload,
      canMutate,
      options.refresh,
      showSnackbar,
      {
        success: 'Task updated successfully.',
        error: 'Unable to update the task. Please try again.',
      },
    )
  }

  async function investigateTask(taskId: string, payload: { prompt: string, modelType: string }) {
    if (!canMutate()) {
      return
    }

    try {
      await $fetch(`/api/tasks/${taskId}/investigations`, {
        method: 'POST',
        body: {
          prompt: payload.prompt.trim(),
          modelType: payload.modelType,
        },
      })

      await options.refresh()
      showSnackbar('Investigation request submitted.', { variant: 'success' })
    }
    catch (err) {
      const message = resolveApiError(err, 'Unable to start the investigation. Please try again.')
      showSnackbar(message, { variant: 'error' })
      throw err
    }
  }

  async function completeQuest() {
    await updateQuestStatus(
      options.questId,
      'completed',
      canMutate,
      options.refresh,
      showSnackbar,
      {
        success: 'Quest marked as completed.',
        error: 'Unable to complete the quest. Please try again.',
      },
    )
  }

  async function reopenQuest() {
    await updateQuestStatus(
      options.questId,
      'active',
      canMutate,
      options.refresh,
      showSnackbar,
      {
        success: 'Quest reopened and set to active.',
        error: 'Unable to reopen the quest. Please try again.',
      },
    )
  }

  return {
    markTaskCompleted,
    markTaskIncomplete,
    updateTask,
    investigateTask,
    completeQuest,
    reopenQuest,
  }
}
