import type { H3Event } from 'h3'
import type { Prisma } from '@prisma/client'
import { prisma } from 'shared/server'

const QUEST_GUARD_SELECT = {
  id: true,
  ownerId: true,
  deletedAt: true,
  status: true,
  isPublic: true,
} satisfies Prisma.QuestSelect

export type GuardedQuest = Prisma.QuestGetPayload<{ select: typeof QUEST_GUARD_SELECT }>

interface QuestOwnershipOptions {
  userId?: string
}

async function resolveUserId(event: H3Event, provided?: string | null) {
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
  event: H3Event,
  questId: string | null | undefined,
  options: QuestOwnershipOptions = {},
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
