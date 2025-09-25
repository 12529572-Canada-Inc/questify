import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const quest = await prisma.quest.findUnique({
    where: { id },
  })

  if (!quest) {
    throw createError({ statusCode: 404, statusMessage: 'Quest not found' })
  }

  return quest
})
