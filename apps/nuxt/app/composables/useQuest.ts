import type { Quest, User } from '@prisma/client'
import type { TaskWithInvestigations } from '~/types/quest-tasks'

export function useQuest(id: string) {
  return useFetch<Quest & { tasks: TaskWithInvestigations[], owner: User }>(`/api/quests/${id}`, {
    key: `quest-${id}`,
  })
}

export function useQuests() {
  return useFetch<Quest[]>('/api/quests')
}
