import { QuestStatus } from '@prisma/client'
import { prisma } from 'shared/server'
import { recordAuditLog } from '../../../utils/audit'
import { requireQuestOwner } from '../../../utils/ownership'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  const quest = await requireQuestOwner(event, id, { userId: user.id })

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
