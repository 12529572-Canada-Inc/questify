import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sortBy = query.sortBy as string || 'createdAt'
  const order = query.order as 'asc' | 'desc' || 'desc'

  // Build order by clause
  const orderBy: Record<string, 'asc' | 'desc'> = {}

  if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
    orderBy[sortBy] = order
  }
  else {
    // Default to createdAt if invalid sortBy
    orderBy.createdAt = 'desc'
  }

  const quests = await prisma.quest.findMany({
    where: { isPublic: true },
    orderBy,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  // Transform to include task counts
  return quests.map((quest) => {
    const taskCounts = {
      total: quest.tasks.length,
      todo: quest.tasks.filter(t => t.status === 'todo').length,
      inProgress: quest.tasks.filter(t => t.status === 'in-progress').length,
      completed: quest.tasks.filter(t => t.status === 'completed').length,
    }

    const { tasks, ...questData } = quest

    return {
      ...questData,
      taskCounts,
    }
  })
})

export default handler

export type PublicQuestsResponse = Awaited<ReturnType<typeof handler>>
