import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, userId } = body

  // Access the queue from the event context
  // TODO: deretmine potentially better way to access this
  const questQueue = event.context.questQueue

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
