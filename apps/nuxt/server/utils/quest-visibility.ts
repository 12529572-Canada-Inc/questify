import type { Prisma } from '@prisma/client'

export type QuestVisibilityTarget = {
  ownerId: string
  isPublic: boolean
}

export function buildQuestVisibilityFilter(userId?: string | null): Prisma.QuestWhereInput {
  if (userId) {
    return {
      OR: [
        { ownerId: userId },
        { isPublic: true },
      ],
    }
  }

  return { isPublic: true }
}

export function canViewQuest(quest: QuestVisibilityTarget, userId?: string | null) {
  if (quest.isPublic) {
    return true
  }

  if (!userId) {
    return false
  }

  return quest.ownerId === userId
}
