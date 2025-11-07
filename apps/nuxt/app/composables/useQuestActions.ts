import { unref, type MaybeRef } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useMutationExecutor } from '~/composables/useMutationExecutor'

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

export function useQuestActions(options: QuestActionsOptions) {
  const canMutate = () => unref(options.isOwner)
  const { showSnackbar } = useSnackbar()
  const { execute } = useMutationExecutor({
    canMutate,
    refresh: options.refresh,
    showSnackbar,
  })

  async function mutateTask(taskId: string, body: TaskMutationPayload, messages: { success: string, error: string }) {
    await execute(
      () => $fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body,
      }),
      messages,
    )
  }

  async function updateQuestStatus(
    questId: string,
    status: 'active' | 'completed',
    messages: { success: string, error: string },
  ) {
    await execute(
      () => $fetch(`/api/quests/${questId}`, {
        method: 'PATCH',
        body: { status },
      }),
      messages,
    )
  }

  async function markTaskCompleted(taskId: string) {
    await mutateTask(
      taskId,
      { status: 'completed' },
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
      {
        success: 'Task updated successfully.',
        error: 'Unable to update the task. Please try again.',
      },
    )
  }

  async function investigateTask(taskId: string, payload: { prompt: string, modelType: string }) {
    const trimmedPrompt = payload.prompt.trim()
    await execute(
      () => $fetch(`/api/tasks/${taskId}/investigations`, {
        method: 'POST',
        body: {
          prompt: trimmedPrompt,
          modelType: payload.modelType,
        },
      }),
      {
        success: 'Investigation request submitted.',
        error: 'Unable to start the investigation. Please try again.',
      },
    )
  }

  async function completeQuest() {
    await updateQuestStatus(
      options.questId,
      'completed',
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
