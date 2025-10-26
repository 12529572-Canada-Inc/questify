import { PrismaClient } from '@prisma/client'
import { getDefaultModelId, normalizeModelType } from '../../utils/model-options'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event) // 👈 forces login

  const body = (await readBody<QuestBody>(event)) || {} as QuestBody
  const {
    title,
    goal,
    context,
    constraints,
    modelType,
  } = body

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ status: 400, statusText: 'Title is required' })
  }

  const sanitizeOptionalField = (value: unknown) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  // Access the queue from the event context
  // TODO: deretmine potentially better way to access this
  const questQueue = event.context.questQueue as QuestQueue

  const selectedModelType = normalizeModelType(modelType, getDefaultModelId())

  const quest = await prisma.quest.create({
    data: {
      title: title.trim(),
      goal: sanitizeOptionalField(goal),
      context: sanitizeOptionalField(context),
      constraints: sanitizeOptionalField(constraints),
      ownerId: user.id,
      modelType: selectedModelType,
    },
  })

  await questQueue.add('decompose', {
    questId: quest.id,
    title: title.trim(),
    goal: sanitizeOptionalField(goal),
    context: sanitizeOptionalField(context),
    constraints: sanitizeOptionalField(constraints),
    modelType: selectedModelType,
  })

  return { success: true, quest }
})

export default handler

export type CreateQuestResponse = Awaited<ReturnType<typeof handler>>
