import type { Quest, Task, User } from '@prisma/client'

export function useQuest(id: string) {
  return useFetch<Quest & { tasks: Task[], owner: User }>(`/api/quests/${id}`, {
    key: `quest-${id}`,
  })
}

export function useQuests() {
  return useFetch<Quest[]>('/api/quests')
}
