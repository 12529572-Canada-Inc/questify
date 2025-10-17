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
    throw createError({ status: 403, statusText: 'You do not have permission to modify this task' })
  }

  const body = (await readBody<TaskBody>(event)) || {} as TaskBody

  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const status = body.status
    const allowedStatuses = ['todo', 'pending', 'in-progress', 'completed', 'draft'] as const

    if (!status) {
      throw createError({ status: 400, statusText: 'Status cannot be empty' })
    }

    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) {
      throw createError({ status: 400, statusText: 'Invalid task status' })
    }

    updates.status = status
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      throw createError({ status: 400, statusText: 'Invalid task title' })
    }

    const trimmedTitle = body.title.trim()

    if (!trimmedTitle) {
      throw createError({ status: 400, statusText: 'Task title cannot be empty' })
    }

    updates.title = trimmedTitle
  }

  const sanitizeOptionalText = (value: unknown) => {
    if (value === undefined) {
      return undefined
    }

    if (value === null) {
      return null
    }

    if (typeof value !== 'string') {
      throw createError({ status: 400, statusText: 'Invalid task content' })
    }

    const trimmed = value.trim()

    return trimmed.length > 0 ? trimmed : null
  }

  const details = sanitizeOptionalText(body.details)
  if (details !== undefined) {
    updates.details = details
  }

  const extraContent = sanitizeOptionalText(body.extraContent)
  if (extraContent !== undefined) {
    updates.extraContent = extraContent
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ status: 400, statusText: 'No task fields were provided for update' })
  }

  const task = await prisma.task.update({
    where: { id },
    data: updates,
  })

  return task
})
