import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const body = await readBody<{ status?: string }>(event)

  const quest = await prisma.quest.update({
    where: { id },
    data: {
      status: body.status,
    },
  })

  return quest
})
