export function useQuest(id: number) {
  return useFetch(`/api/quests/${id}`)
}

export function useQuests() {
  return useFetch('/api/quests')
}
