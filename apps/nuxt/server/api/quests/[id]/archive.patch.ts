import { PrismaClient, QuestStatus } from '@prisma/client'
import { recordAuditLog } from '../../../utils/audit'

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
      status: true,
    },
  })

  if (!quest || quest.deletedAt) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (quest.ownerId !== user.id) {
    throw createError({ status: 403, statusText: 'You do not have permission to archive this quest' })
  }

  if (quest.status === QuestStatus.archived) {
    return prisma.quest.findUnique({ where: { id } })
  }

  const updatedQuest = await prisma.quest.update({
    where: { id },
    data: {
      status: QuestStatus.archived,
    },
  })

  await recordAuditLog({
    actorId: user.id,
    action: 'quest.archive',
    targetType: 'quest',
    targetId: id,
    metadata: { previousStatus: quest.status },
  })

  return updatedQuest
})
