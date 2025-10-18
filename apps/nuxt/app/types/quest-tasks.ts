import type { Task, TaskInvestigation, User } from '@prisma/client'

export type TaskInvestigationWithUser = TaskInvestigation & {
  initiatedBy: Pick<User, 'id' | 'name' | 'email'> | null
}

export type TaskWithInvestigations = Task & {
  investigations: TaskInvestigationWithUser[]
}

export type QuestTaskTab = 'todo' | 'completed'
