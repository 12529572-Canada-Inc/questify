import { PrismaClient } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, userId } = body

  const prisma = new PrismaClient()

  const { $questQueue } = useNuxtApp()

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await $questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
