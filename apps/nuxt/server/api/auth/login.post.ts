import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import { verifyPassword } from 'shared'
import { attachSessionWithAccess } from '../../utils/access-control'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = (await readBody<LoginBody>(event)) || {} as LoginBody
  const { email, password } = body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ status: 401, statusText: 'Invalid credentials' })
  }

  const ok = verifyPassword(password, user.password)
  if (!ok) {
    throw createError({ status: 401, statusText: 'Invalid credentials' })
  }

  const profile = await attachSessionWithAccess(event as unknown as H3Event, {
    id: user.id,
    email: user.email,
    name: user.name || null,
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: profile.roles,
      privileges: profile.privileges,
    },
  }
})
