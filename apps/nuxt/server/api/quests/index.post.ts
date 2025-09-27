import { PrismaClient } from '@prisma/client'
import { getUserSession } from '#auth'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { title, description } = body

  // Access the queue from the event context
  // TODO: deretmine potentially better way to access this
  const questQueue = event.context.questQueue

  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      ownerId: session.user.id,
    },
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})

export default handler

export type CreateQuestResponse = Awaited<ReturnType<typeof handler>>
