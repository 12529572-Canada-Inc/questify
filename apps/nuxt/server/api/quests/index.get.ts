import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = defineEventHandler(async () => {
  const quests = await prisma.quest.findMany({
    include: {
      owner: true,
      tasks: { orderBy: { order: 'asc' } },
    },
  })

  return quests
})

export default handler

export type QuestsResponse = Awaited<ReturnType<typeof handler>>
