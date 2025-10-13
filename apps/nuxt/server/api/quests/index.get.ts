import { PrismaClient } from '@prisma/client'
import { buildQuestVisibilityFilter } from '../utils/quest-visibility'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session?.user?.id ?? null

  return prisma.quest.findMany({
    where: buildQuestVisibilityFilter(userId),
    orderBy: { createdAt: 'desc' },
  })
})

export default handler

export type QuestsResponse = Awaited<ReturnType<typeof handler>>
