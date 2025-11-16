import type { H3Event } from 'h3'
import { verifyPassword, prisma } from 'shared/server'
import { attachSessionWithAccess } from '../../utils/access-control'

/**
 * POST /api/auth/login
 *
 * Handles credential-based login, attaches the authenticated user to the session,
 * and enriches the session payload with the user's RBAC profile (roles + privileges)
 * so downstream middleware can authorize admin-only routes without re-querying.
 */

export default defineEventHandler(async (event) => {
  const body = (await readBody<LoginBody>(event)) || {} as LoginBody
  const { email, password } = body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
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
    avatarUrl: user.avatarUrl || null,
    themePreference: user.themePreference || null,
  }, { includeProviders: true })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: profile.avatarUrl ?? user.avatarUrl ?? null,
      themePreference: profile.themePreference ?? user.themePreference ?? null,
      roles: profile.roles,
      privileges: profile.privileges,
      providers: profile.providers,
    },
  }
})
