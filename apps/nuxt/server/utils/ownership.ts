import type { Prisma } from '@prisma/client'
import { prisma } from 'shared/server'

const QUEST_GUARD_SELECT = {
  id: true,
  ownerId: true,
  deletedAt: true,
  status: true,
  isPublic: true,
} satisfies Prisma.QuestSelect

const TASK_GUARD_SELECT = {
  id: true,
  quest: {
    select: {
      id: true,
      ownerId: true,
      modelType: true,
    },
  },
} satisfies Prisma.TaskSelect

export type GuardedQuest = Prisma.QuestGetPayload<{ select: typeof QUEST_GUARD_SELECT }>
export type GuardedTask = Prisma.TaskGetPayload<{ select: typeof TASK_GUARD_SELECT }>

type NitroEvent = Parameters<typeof requireUserSession>[0]

interface OwnershipOptions {
  userId?: string
}

async function resolveUserId(event: NitroEvent, provided?: string | null) {
  if (provided) {
    return provided
  }

  const session = await requireUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  return userId
}

export async function requireQuestOwner(
  event: NitroEvent,
  questId: string | null | undefined,
  options: OwnershipOptions = {},
): Promise<GuardedQuest> {
  if (!questId) {
    throw createError({ status: 400, statusText: 'Quest id is required' })
  }

  const userId = await resolveUserId(event, options.userId)

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    select: QUEST_GUARD_SELECT,
  })

  if (!quest || quest.deletedAt) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (quest.ownerId !== userId) {
    throw createError({
      status: 403,
      statusText: 'You do not have permission to modify this quest',
    })
  }

  return quest
}

export async function requireTaskOwner(
  event: NitroEvent,
  taskId: string | null | undefined,
  options: OwnershipOptions = {},
): Promise<GuardedTask> {
  if (!taskId) {
    throw createError({ status: 400, statusText: 'Task id is required' })
  }

  const userId = await resolveUserId(event, options.userId)

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: TASK_GUARD_SELECT,
  })

  if (!task) {
    throw createError({ status: 404, statusText: 'Task not found' })
  }

  if (task.quest.ownerId !== userId) {
    throw createError({
      status: 403,
      statusText: 'You do not have permission to modify this task',
    })
  }

  return task
}
