import { QuestStatus } from '@prisma/client'
import type { UserMetrics } from '~/types/metrics'
import { prisma } from 'shared/server'

const handler = defineEventHandler(async (event): Promise<UserMetrics> => {
  const session = await getUserSession(event)
  const userId = session?.user?.id

  if (!userId) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const [
    totalQuests,
    activeQuests,
    completedQuests,
    publicQuests,
    totalTasks,
    completedTasks,
    latestQuest,
  ] = await prisma.$transaction([
    prisma.quest.count({
      where: {
        ownerId: userId,
        deletedAt: null,
        status: { not: QuestStatus.archived },
      },
    }),
    prisma.quest.count({
      where: {
        ownerId: userId,
        deletedAt: null,
        status: QuestStatus.active,
      },
    }),
    prisma.quest.count({
      where: {
        ownerId: userId,
        deletedAt: null,
        status: QuestStatus.completed,
      },
    }),
    prisma.quest.count({
      where: {
        ownerId: userId,
        deletedAt: null,
        status: { not: QuestStatus.archived },
        isPublic: true,
      },
    }),
    prisma.task.count({
      where: {
        quest: {
          ownerId: userId,
          deletedAt: null,
          status: { not: QuestStatus.archived },
        },
      },
    }),
    prisma.task.count({
      where: {
        status: 'completed',
        quest: {
          ownerId: userId,
          deletedAt: null,
          status: { not: QuestStatus.archived },
        },
      },
    }),
    prisma.quest.findFirst({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const completionRate = totalTasks === 0 ? 0 : completedTasks / totalTasks

  return {
    totalQuests,
    activeQuests,
    completedQuests,
    publicQuests,
    totalTasks,
    completedTasks,
    completionRate,
    privateQuests: totalQuests - publicQuests,
    lastActiveAt: latestQuest?.updatedAt.toISOString() ?? null,
  }
})

export default handler

export type UserMetricsResponse = Awaited<ReturnType<typeof handler>>
