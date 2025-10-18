import type { Quest, TaskInvestigation, Task, User } from '@prisma/client'

type TaskInvestigationWithUser = TaskInvestigation & {
  initiatedBy: Pick<User, 'id' | 'name' | 'email'> | null
}

type TaskWithInvestigations = Task & {
  investigations: TaskInvestigationWithUser[]
}

export function useQuest(id: string) {
  return useFetch<Quest & { tasks: TaskWithInvestigations[], owner: User }>(`/api/quests/${id}`, {
    key: `quest-${id}`,
  })
}

export function useQuests() {
  return useFetch<Quest[]>('/api/quests')
}
