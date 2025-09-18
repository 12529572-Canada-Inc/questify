// server/api/quests/index.post.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, userId } = body

  // Access queue from Nitro’s locals
  const questQueue = event.node.req.context.nitro.locals.questQueue

  const quest = await prisma.quest.create({
    data: { title, description, ownerId: userId }
  })

  await questQueue.add('decompose', { questId: quest.id, title, description })

  return { success: true, quest }
})
