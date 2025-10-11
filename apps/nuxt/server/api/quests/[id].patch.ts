import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Quest id is required' })
  }

  const quest = await prisma.quest.findUnique({
    where: { id },
    select: { ownerId: true },
  })

  if (!quest) {
    throw createError({ statusCode: 404, statusMessage: 'Quest not found' })
  }

  if (quest.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to modify this quest' })
  }

  const body = await readBody(event)
  const status = (body as { status?: string } | null | undefined)?.status

  if (status === 'completed') {
    // Transaction: complete quest + all tasks
    const [updatedQuest] = await prisma.$transaction([
      prisma.quest.update({
        where: { id },
        data: { status: 'completed' },
      }),
      prisma.task.updateMany({
        where: { questId: id },
        data: { status: 'completed' },
      }),
    ])

    return updatedQuest
  }

  // fallback if status is something else
  return prisma.quest.update({
    where: { id },
    data: { status },
  })
})
