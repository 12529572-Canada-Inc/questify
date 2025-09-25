import type { Quest } from '@prisma/client'

export function useQuest(id: string) {
  return useFetch<Quest>(`/api/quests/${id}`)
}

export function useQuests() {
  return useFetch<Quest[]>('/api/quests')
}
