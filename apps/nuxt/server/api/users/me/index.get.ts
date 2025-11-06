import { PrismaClient } from '@prisma/client'
import { getUserAccessProfile } from '../../../utils/access-control'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user

  if (!sessionUser) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      themePreference: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw createError({ status: 404, statusText: 'User not found' })
  }

  const providers = sessionUser.providers
    ?? await prisma.oAuthAccount.findMany({
      where: { userId: user.id },
      select: { provider: true },
    }).then(rows => rows.map(row => row.provider))

  const roles = sessionUser.roles
  const privileges = sessionUser.privileges

  const access = (roles && privileges)
    ? { roles, privileges }
    : await getUserAccessProfile(user.id)

  return {
    ...user,
    roles: access.roles,
    privileges: access.privileges,
    providers,
  }
})
