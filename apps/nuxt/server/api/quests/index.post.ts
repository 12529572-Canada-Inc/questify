import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event) // 👈 forces login

  const body = await readBody(event)
  const {
    title,
    description,
    goal,
    context,
    constraints,
  } = body

  // Access the queue from the event context
  // TODO: deretmine potentially better way to access this
  const questQueue = event.context.questQueue

  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      goal,
      context,
      constraints,
      ownerId: user.id,
    },
  })

  await questQueue.add('decompose', {
    questId: quest.id,
    title,
    description,
    goal,
    context,
    constraints,
  })

  return { success: true, quest }
})

export default handler

export type CreateQuestResponse = Awaited<ReturnType<typeof handler>>
