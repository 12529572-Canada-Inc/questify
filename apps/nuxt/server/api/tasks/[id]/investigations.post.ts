import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Task id is required' })
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      quest: {
        select: {
          ownerId: true,
        },
      },
    },
  })

  if (!task) {
    throw createError({ status: 404, statusText: 'Task not found' })
  }

  if (task.quest.ownerId !== user.id) {
    throw createError({ status: 403, statusText: 'You do not have permission to investigate this task' })
  }

  const investigation = await prisma.taskInvestigation.create({
    data: {
      taskId: id,
      initiatedById: user.id,
      status: 'pending',
    },
  })

  const taskQueue = event.context.taskQueue as TaskQueue | undefined

  if (taskQueue) {
    await taskQueue.add('investigate-task', {
      investigationId: investigation.id,
      taskId: id,
    })
  }
  else {
    console.warn('Task queue not configured; investigation will remain pending until processed manually.')
  }

  return {
    investigation,
  }
})
