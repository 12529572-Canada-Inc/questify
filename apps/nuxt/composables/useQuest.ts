import type { Quest, Task } from '@prisma/client'

export function useQuest(id: string) {
  return useFetch<Quest & { tasks: Task[] }>(`/api/quests/${id}`, {
    key: `quest-${id}`,
  })
}

export function useQuests() {
  return useFetch<Quest[]>('/api/quests')
}
