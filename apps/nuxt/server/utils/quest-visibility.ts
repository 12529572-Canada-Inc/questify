import { QuestStatus, type Prisma } from '@prisma/client'

export type QuestVisibilityTarget = {
  ownerId: string
  isPublic: boolean
  status: QuestStatus
  deletedAt: Date | null
}

export type QuestVisibilityOptions = {
  includeArchived?: boolean
}

export function buildQuestVisibilityFilter(userId?: string | null, options: QuestVisibilityOptions = {}): Prisma.QuestWhereInput {
  const includeArchived = Boolean(options.includeArchived && userId)
  const baseFilter: Prisma.QuestWhereInput = {
    deletedAt: null,
  }

  if (!includeArchived) {
    baseFilter.status = { not: QuestStatus.archived }
  }

  if (userId) {
    const publicFilter: Prisma.QuestWhereInput = {
      isPublic: true,
      status: { not: QuestStatus.archived },
    }

    return {
      ...baseFilter,
      OR: [
        { ownerId: userId },
        publicFilter,
      ],
    }
  }

  return {
    ...baseFilter,
    isPublic: true,
  }
}

export function canViewQuest(quest: QuestVisibilityTarget, userId?: string | null) {
  if (quest.deletedAt) {
    return false
  }

  if (quest.ownerId === userId) {
    return true
  }

  if (quest.status === QuestStatus.archived) {
    return false
  }

  if (!userId && quest.isPublic) {
    return true
  }

  return quest.isPublic
}
