import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async () => {
  const quests = await prisma.quest.findMany({
    include: {
      owner: true,
      tasks: { orderBy: { order: 'asc' } }
    }
  })

  return quests
})
