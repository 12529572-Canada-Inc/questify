import type { Quest, Task } from '@prisma/client'

export const TASK_STATUS = {
  todo: 'todo',
  pending: 'pending',
  inProgress: 'in-progress',
  completed: 'completed',
  draft: 'draft',
} as const

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

export type TaskListItem = Task & {
  quest: Pick<Quest, 'id' | 'title' | 'status'>
}
