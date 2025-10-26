import { PrismaClient } from '@prisma/client'
import { buildQuestVisibilityFilter } from '../../utils/quest-visibility'

const prisma = new PrismaClient()

function parseBoolean(value: unknown) {
  if (typeof value === 'string') {
    return ['true', '1', 'on', 'yes'].includes(value.toLowerCase())
  }

  if (Array.isArray(value)) {
    return value.some(entry => ['true', '1', 'on', 'yes'].includes(`${entry}`.toLowerCase()))
  }

  return value === true
}

const handler = defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session?.user?.id ?? null
  const query = getQuery(event)
  const includeArchived = parseBoolean(query.includeArchived)

  return prisma.quest.findMany({
    where: buildQuestVisibilityFilter(userId, { includeArchived }),
    orderBy: { createdAt: 'desc' },
  })
})

export default handler

export type QuestsResponse = Awaited<ReturnType<typeof handler>>
