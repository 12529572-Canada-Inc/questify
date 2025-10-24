import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import { verifyPassword } from 'shared/server'
import { attachSessionWithAccess } from '../../utils/access-control'

/**
 * POST /api/auth/login
 *
 * Handles credential-based login, attaches the authenticated user to the session,
 * and enriches the session payload with the user's RBAC profile (roles + privileges)
 * so downstream middleware can authorize admin-only routes without re-querying.
 */

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
