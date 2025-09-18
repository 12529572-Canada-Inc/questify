import { PrismaClient } from '@prisma/client'
import { Queue } from 'bullmq'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const questQueue = new Queue('quests', {
    connection: {
      host: config.redis.host,
      port: Number(config.redis.port),
      password: config.redis.password || undefined
    }
  })

  const body = await readBody(event)
  const { title, description, userId } = body

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
