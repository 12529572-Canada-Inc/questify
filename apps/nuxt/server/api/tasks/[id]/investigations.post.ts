import { normalizeModelType } from '../../../utils/model-options'
import { prisma } from 'shared/server'
import { requireTaskOwner } from '../../../utils/ownership'
import { sanitizeImageInputs } from '../../../utils/sanitizers'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Task id is required' })
  }

  const body = (await readBody<TaskInvestigationBody>(event)) || {} as TaskInvestigationBody
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : null
  const images = sanitizeImageInputs(body.images, { fieldLabel: 'investigation images' })

  if (prompt && prompt.length > 1000) {
    throw createError({ status: 400, statusText: 'Investigation context is too long' })
  }

  const task = await requireTaskOwner(event, id, { userId: user.id })

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
      images,
    })
  }
  else {
    console.warn('Task queue not configured; investigation will remain pending until processed manually.')
  }

  return {
    investigation,
  }
})
