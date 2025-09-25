import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = defineEventHandler(async () => {
  return prisma.quest.findMany({
    orderBy: { createdAt: 'desc' },
  })
})

export default handler

export type QuestsResponse = Awaited<ReturnType<typeof handler>>
