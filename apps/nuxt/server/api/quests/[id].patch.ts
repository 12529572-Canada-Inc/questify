import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const body = await readBody<{ status?: string }>(event)

  if (body.status === 'completed') {
    // Transaction: complete quest + all tasks
    const [quest] = await prisma.$transaction([
      prisma.quest.update({
        where: { id },
        data: { status: 'completed' },
      }),
      prisma.task.updateMany({
        where: { questId: id },
        data: { status: 'completed' },
      }),
    ])

    return quest
  }

  // fallback if status is something else
  return prisma.quest.update({
    where: { id },
    data: { status: body.status },
  })
})
