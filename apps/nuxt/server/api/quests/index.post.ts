import { prisma } from 'shared/server'
import { getDefaultModelId, normalizeModelType } from '../../utils/model-options'
import { normalizeOptionalString, sanitizeImageInputs } from '../../utils/sanitizers'

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event) // 👈 forces login

  const body = (await readBody<QuestBody>(event)) || {} as QuestBody
  const {
    title,
    goal,
    context,
    constraints,
    modelType,
    isPublic,
    images,
  } = body

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ status: 400, statusText: 'Title is required' })
  }

  if (typeof isPublic !== 'undefined' && typeof isPublic !== 'boolean') {
    throw createError({ status: 400, statusText: 'isPublic must be a boolean' })
  }

  // Access the queue from the event context
  // TODO: deretmine potentially better way to access this
  const questQueue = event.context.questQueue as QuestQueue

  const selectedModelType = normalizeModelType(modelType, getDefaultModelId())
  const isQuestPublic = Boolean(isPublic)
  const sanitizedImages = sanitizeImageInputs(images, { fieldLabel: 'quest images' })

  const quest = await prisma.quest.create({
    data: {
      title: title.trim(),
      goal: normalizeOptionalString(goal),
      context: normalizeOptionalString(context),
      constraints: normalizeOptionalString(constraints),
      ownerId: user.id,
      modelType: selectedModelType,
      isPublic: isQuestPublic,
      images: sanitizedImages,
    },
  })

  await questQueue.add('decompose', {
    questId: quest.id,
    title: title.trim(),
    goal: normalizeOptionalString(goal),
    context: normalizeOptionalString(context),
    constraints: normalizeOptionalString(constraints),
    modelType: selectedModelType,
    images: sanitizedImages,
  })

  return { success: true, quest }
})

export default handler

export type CreateQuestResponse = Awaited<ReturnType<typeof handler>>
