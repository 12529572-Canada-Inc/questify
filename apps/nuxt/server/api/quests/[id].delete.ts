import { QuestStatus } from '@prisma/client'
import { prisma } from 'shared/server'
import { recordAuditLog } from '../../utils/audit'
import { requireQuestOwner } from '../../utils/ownership'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  await requireQuestOwner(event, id, { userId: user.id })

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
