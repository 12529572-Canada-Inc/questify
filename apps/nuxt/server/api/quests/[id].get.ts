import { PrismaClient } from '@prisma/client'
import { canViewQuest } from '../../utils/quest-visibility'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Quest id is required' })
  }

  const session = await getUserSession(event)
  const userId = session?.user?.id ?? null

  const quest = await prisma.quest.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: 'asc' },
        include: {
          investigations: {
            orderBy: { createdAt: 'desc' },
            include: {
              initiatedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!quest) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (!canViewQuest(quest, userId)) {
    throw createError({ status: 403, statusText: 'You do not have permission to view this quest' })
  }

  return quest
})
