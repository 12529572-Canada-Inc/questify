import { PrismaClient } from '@prisma/client'
import { Queue } from 'bullmq'

const prisma = new PrismaClient()
const questQueue = new Queue('quests', { connection: { host: 'localhost', port: 6379 } })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, userId } = body

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
