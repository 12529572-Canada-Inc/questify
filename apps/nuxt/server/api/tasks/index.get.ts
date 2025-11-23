import { prisma } from 'shared/server'

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  return prisma.task.findMany({
    where: {
      quest: {
        ownerId: user.id,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      details: true,
      extraContent: true,
      questId: true,
      status: true,
      order: true,
      createdAt: true,
      quest: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  })
})

export default handler

export type TasksResponse = Awaited<ReturnType<typeof handler>>
