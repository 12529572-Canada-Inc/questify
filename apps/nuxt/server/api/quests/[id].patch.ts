import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid quest ID' })
  }

  const body = await readBody<{ status?: string }>(event)

  const quest = await prisma.quest.update({
    where: { id },
    data: {
      status: body.status,
    },
  })

  return quest
})
