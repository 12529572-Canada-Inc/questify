import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Task id is required' })
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
    throw createError({ status: 404, statusText: 'Task not found' })
  }

  if (taskRecord.quest.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusText: 'You do not have permission to modify this task' })
  }

  const body = (await readBody<TaskBody>(event)) || {} as TaskBody
  const status = body.status

  if (!status) {
    throw createError({ status: 400, statusText: 'Status is required' })
  }

  const allowedStatuses = ['todo', 'pending', 'in-progress', 'completed', 'draft'] as const

  if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) {
    throw createError({ status: 400, statusText: 'Invalid task status' })
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      status,
    },
  })

  return task
})
