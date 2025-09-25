export function useQuest(id: string) {
  return useFetch(`/api/quests/${id}`)
}

export function useQuests() {
  return useFetch('/api/quests')
}
