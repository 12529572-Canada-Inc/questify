import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const questQueue = useNuxtApp().$questQueue

  // read body
  const body = await readBody(event)
  const { title, description, userId } = body

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
