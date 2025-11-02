import { PrismaClient } from '@prisma/client'
import type { PrivilegeKey } from 'shared'

const prisma = new PrismaClient()

export interface UserAccessProfile {
  roles: string[]
  privileges: PrivilegeKey[]
}

export interface AttachSessionOptions {
  includeProviders?: boolean
}

/**
 * Access-control helpers shared across Nitro API handlers. They hydrate the
 * current session with role + privilege information and provide guard helpers
 * (`requirePrivilege`, `requireAnyPrivilege`) that short-circuit unauthorized
 * requests before hitting business logic.
 */

export async function getUserAccessProfile(userId: string): Promise<UserAccessProfile> {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        select: {
          name: true,
          privileges: {
            include: {
              privilege: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  })

  const roleNames = new Set<string>()
  const privilegeKeys = new Set<PrivilegeKey>()

  for (const assignment of assignments) {
    roleNames.add(assignment.role.name)
    for (const privilege of assignment.role.privileges) {
      privilegeKeys.add(privilege.privilege.key as PrivilegeKey)
    }
  }

  return {
    roles: [...roleNames],
    privileges: [...privilegeKeys],
  }
}

export function sessionHasPrivilege(
  user: { privileges?: string[] },
  privilege: PrivilegeKey,
) {
  return Array.isArray(user.privileges) && user.privileges.includes(privilege)
}

export function sessionHasAnyPrivilege(
  user: { privileges?: string[] },
  privileges: PrivilegeKey[],
) {
  if (!Array.isArray(user.privileges) || user.privileges.length === 0) {
    return false
  }

  return privileges.some(privilege => user.privileges!.includes(privilege))
}

type SessionEvent = Parameters<typeof requireUserSession>[0]

export async function requirePrivilege(event: SessionEvent, privilege: PrivilegeKey) {
  const session = await requireUserSession(event)
  const sessionUser = session.user

  if (!sessionUser) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  if (sessionHasPrivilege(sessionUser, privilege)) {
    return sessionUser
  }

  const profile = await getUserAccessProfile(sessionUser.id)

  if (!profile.privileges.includes(privilege)) {
    throw createError({ status: 403, statusText: 'Forbidden' })
  }

  sessionUser.privileges = profile.privileges
  sessionUser.roles = profile.roles
  await setUserSession(event, { user: sessionUser })

  return sessionUser
}

export async function requireAnyPrivilege(
  event: SessionEvent,
  privileges: PrivilegeKey[],
) {
  if (privileges.length === 0) {
    throw createError({ status: 400, statusText: 'No privileges specified' })
  }

  const session = await requireUserSession(event)
  const sessionUser = session.user

  if (!sessionUser) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  if (sessionHasAnyPrivilege(sessionUser, privileges)) {
    return sessionUser
  }

  const profile = await getUserAccessProfile(sessionUser.id)

  if (!sessionHasAnyPrivilege({ privileges: profile.privileges }, privileges)) {
    throw createError({ status: 403, statusText: 'Forbidden' })
  }

  sessionUser.privileges = profile.privileges
  sessionUser.roles = profile.roles
  await setUserSession(event, { user: sessionUser })

  return sessionUser
}

export async function attachSessionWithAccess(
  event: SessionEvent,
  user: { id: string, email?: string | null, name?: string | null },
  options: AttachSessionOptions = {},
) {
  const profile = await getUserAccessProfile(user.id)
  const providers = options.includeProviders
    ? await prisma.oAuthAccount.findMany({
        where: { userId: user.id },
        select: { provider: true },
      }).then(accounts => accounts.map(account => account.provider))
    : undefined

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      roles: profile.roles,
      privileges: profile.privileges,
      providers,
    },
  })

  return {
    ...profile,
    providers,
  }
}
