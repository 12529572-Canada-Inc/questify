import { storeToRefs } from 'pinia'
import type { Quest, User } from '@prisma/client'
import type { TaskWithInvestigations } from '~/types/quest-tasks'
import { useQuestStore } from '~/stores/quest'

export function useQuest(id: string) {
  return useFetch<Quest & { tasks: TaskWithInvestigations[], owner: User }>(`/api/quests/${id}`, {
    key: `quest-${id}`,
  })
}

type QuestFetchOptions = { force?: boolean }

export async function useQuests(options: QuestFetchOptions = {}) {
  const questStore = useQuestStore()
  const { quests, loading, error } = storeToRefs(questStore)

  await questStore.fetchQuests(options).catch(() => undefined)

  return {
    data: quests,
    pending: loading,
    error,
    refresh: () => questStore.fetchQuests({ force: true }),
  }
}
