import { PrismaClient } from '@prisma/client'
import { canViewQuest } from '~/server/utils/quest-visibility'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Quest id is required' })
  }

  const session = await getUserSession(event)
  const userId = session?.user?.id ?? null

  const quest = await prisma.quest.findUnique({
    where: { id },
    include: { tasks: true, owner: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    } },
  })

  if (!quest) {
    throw createError({ statusCode: 404, statusMessage: 'Quest not found' })
  }

  if (!canViewQuest(quest, userId)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to view this quest' })
  }

  return quest
})
