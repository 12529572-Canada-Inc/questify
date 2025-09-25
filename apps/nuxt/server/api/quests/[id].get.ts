import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid quest ID' })
  }

  const quest = await prisma.quest.findUnique({
    where: { id },
  })

  if (!quest) {
    throw createError({ statusCode: 404, statusMessage: 'Quest not found' })
  }

  return quest
})
