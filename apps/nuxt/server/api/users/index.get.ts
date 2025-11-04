import { PrismaClient } from '@prisma/client'
import { requirePrivilege } from '../../utils/access-control'

const prisma = new PrismaClient()

const handler = defineEventHandler(async (event) => {
  await requirePrivilege(event, 'user:read')

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, avatarUrl: true, themePreference: true },
  })
  return users
})

export default handler

export type UsersResponse = Awaited<ReturnType<typeof handler>>
