import { unref, type MaybeRef } from 'vue'

interface QuestActionsOptions {
  questId: string
  refresh: () => Promise<void>
  isOwner: MaybeRef<boolean>
}

async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'completed',
  canMutate: () => boolean,
  refresh: () => Promise<void>,
) {
  if (!canMutate()) {
    return
  }

  await $fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: { status },
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
    await updateTaskStatus(taskId, 'completed', canMutate, options.refresh)
  }

  async function markTaskIncomplete(taskId: string) {
    await updateTaskStatus(taskId, 'todo', canMutate, options.refresh)
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
    completeQuest,
    reopenQuest,
  }
}
