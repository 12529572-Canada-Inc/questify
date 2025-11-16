import { SUPER_ADMIN_ROLE_NAME } from 'shared'
import { prisma } from 'shared/server'
import { attachSessionWithAccess } from '../../../utils/access-control'
import { recordAuditLog } from '../../../utils/audit'

// Emergency endpoint promoted through the admin UI to restore SuperAdmin access if none remain.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const actor = session.user

  if (!actor) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const existingSuperAdmins = await prisma.userRole.count({
    where: {
      role: { name: SUPER_ADMIN_ROLE_NAME },
    },
  })

  if (existingSuperAdmins > 0) {
    throw createError({
      status: 400,
      statusText: 'A SuperAdmin already exists. Recovery is not required.',
    })
  }

  const role = await prisma.role.findUnique({
    where: { name: SUPER_ADMIN_ROLE_NAME },
  })

  if (!role) {
    throw createError({
      status: 500,
      statusText: 'SuperAdmin role is missing from the system.',
    })
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: actor.id,
        roleId: role.id,
      },
    },
    update: {
      assignedById: actor.id,
    },
    create: {
      userId: actor.id,
      roleId: role.id,
      assignedById: actor.id,
    },
  })

  await recordAuditLog({
    actorId: actor.id,
    action: 'system.recover_super_admin',
    targetType: 'User',
    targetId: actor.id,
    metadata: {
      roleId: role.id,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
  })

  if (user) {
    await attachSessionWithAccess(event, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      themePreference: user.themePreference,
    })
  }

  return {
    success: true,
    roleId: role.id,
  }
})
