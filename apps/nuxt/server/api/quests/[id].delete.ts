import { PrismaClient, QuestStatus } from '@prisma/client'
import { recordAuditLog } from '../../utils/audit'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Quest id is required' })
  }

  const quest = await prisma.quest.findUnique({
    where: { id },
    select: {
      ownerId: true,
      deletedAt: true,
    },
  })

  if (!quest || quest.deletedAt) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (quest.ownerId !== user.id) {
    throw createError({ status: 403, statusText: 'You do not have permission to delete this quest' })
  }

  await prisma.$transaction([
    prisma.taskInvestigation.deleteMany({
      where: {
        task: {
          questId: id,
        },
      },
    }),
    prisma.task.deleteMany({
      where: { questId: id },
    }),
    prisma.quest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: QuestStatus.archived,
        isPublic: false,
      },
    }),
  ])

  await recordAuditLog({
    actorId: user.id,
    action: 'quest.delete',
    targetType: 'quest',
    targetId: id,
  })

  return { success: true }
})
