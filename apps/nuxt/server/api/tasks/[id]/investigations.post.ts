import { PrismaClient } from '@prisma/client'
import { normalizeModelType } from '../../../utils/model-options'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Task id is required' })
  }

  const body = (await readBody<TaskInvestigationBody>(event)) || {} as TaskInvestigationBody
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : null

  if (prompt && prompt.length > 1000) {
    throw createError({ status: 400, statusText: 'Investigation context is too long' })
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      quest: {
        select: {
          ownerId: true,
          modelType: true,
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

  const selectedModelType = normalizeModelType(body.modelType, task.quest.modelType)

  const investigation = await prisma.taskInvestigation.create({
    data: {
      taskId: id,
      initiatedById: user.id,
      prompt,
      status: 'pending',
      modelType: selectedModelType,
    },
  })

  const taskQueue = event.context.taskQueue as TaskQueue | undefined

  if (taskQueue) {
    await taskQueue.add('investigate-task', {
      investigationId: investigation.id,
      taskId: id,
      prompt,
      modelType: selectedModelType,
    })
  }
  else {
    console.warn('Task queue not configured; investigation will remain pending until processed manually.')
  }

  return {
    investigation,
  }
})
