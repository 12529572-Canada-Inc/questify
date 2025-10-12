import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task id is required' })
  }

  const taskRecord = await prisma.task.findUnique({
    where: { id },
    select: {
      quest: {
        select: { ownerId: true },
      },
    },
  })

  if (!taskRecord) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  if (taskRecord.quest.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to modify this task' })
  }

  const body = await readBody(event)
  const status = (body as { status?: string } | null | undefined)?.status

  const task = await prisma.task.update({
    where: { id },
    data: {
      status,
    },
  })

  return task
})
