import type { Task, TaskInvestigation, User } from '@prisma/client'

export type TaskInvestigationWithUser = TaskInvestigation & {
  initiatedBy: Pick<User, 'id' | 'name' | 'email'> | null
}

export type TaskWithInvestigations = Task & {
  investigations: TaskInvestigationWithUser[]
}

export type QuestTaskTab = 'todo' | 'completed'

export type QuestTaskSectionAction = {
  label: string
  color: string
  handler: (taskId: string) => void | Promise<void>
}

export type QuestTaskSection = {
  value: QuestTaskTab
  title: string
  color: string
  tasks: TaskWithInvestigations[]
  completed: boolean
  emptyMessage: string
  action?: QuestTaskSectionAction | null
}
