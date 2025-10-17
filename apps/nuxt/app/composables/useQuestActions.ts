import { unref, type MaybeRef } from 'vue'

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
) {
  if (!canMutate()) {
    return
  }

  await $fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body,
  })

  await refresh()
}

async function updateQuestStatus(
  questId: string,
  status: 'active' | 'completed',
  canMutate: () => boolean,
  refresh: () => Promise<void>,
) {
  if (!canMutate()) {
    return
  }

  await $fetch(`/api/quests/${questId}`, {
    method: 'PATCH',
    body: { status },
  })

  await refresh()
}

export function useQuestActions(options: QuestActionsOptions) {
  const canMutate = () => unref(options.isOwner)

  async function markTaskCompleted(taskId: string) {
    await mutateTask(taskId, { status: 'completed' }, canMutate, options.refresh)
  }

  async function markTaskIncomplete(taskId: string) {
    await mutateTask(taskId, { status: 'todo' }, canMutate, options.refresh)
  }

  async function updateTask(taskId: string, payload: TaskMutationPayload) {
    await mutateTask(taskId, payload, canMutate, options.refresh)
  }

  async function investigateTask(taskId: string) {
    if (!canMutate()) {
      return
    }

    await $fetch(`/api/tasks/${taskId}/investigations`, {
      method: 'POST',
    })

    await options.refresh()
  }

  async function completeQuest() {
    await updateQuestStatus(options.questId, 'completed', canMutate, options.refresh)
  }

  async function reopenQuest() {
    await updateQuestStatus(options.questId, 'active', canMutate, options.refresh)
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
