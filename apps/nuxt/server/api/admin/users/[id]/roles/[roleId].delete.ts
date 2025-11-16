import { SUPER_ADMIN_ROLE_NAME } from 'shared'
import {
  attachSessionWithAccess,
  requirePrivilege,
  sessionHasPrivilege,
} from '../../../../../utils/access-control'
import { recordAuditLog } from '../../../../../utils/audit'
import { fetchAdminUser } from '../../../users/utils'
import { prisma } from 'shared/server'

// Removes a role assignment, guarding against locking the platform out of SuperAdmin access.
export default defineEventHandler(async (event) => {
  const actor = await requirePrivilege(event, 'user:role:assign')

  const userId = getRouterParam(event, 'id')
  const roleId = getRouterParam(event, 'roleId')

  if (!userId || !roleId) {
    throw createError({ status: 400, statusText: 'User id and role id are required' })
  }

  const assignment = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  })

  if (!assignment) {
    return { success: true }
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } })

  if (!role) {
    throw createError({ status: 404, statusText: 'Role not found' })
  }

  if (role.system && role.name === SUPER_ADMIN_ROLE_NAME) {
    const canManageSystem = sessionHasPrivilege(actor, 'system:settings:update')
    if (!canManageSystem) {
      throw createError({
        status: 403,
        statusText: 'Only system administrators can modify the SuperAdmin role.',
      })
    }

    const remainingSuperAdmins = await prisma.userRole.count({
      where: {
        role: { name: SUPER_ADMIN_ROLE_NAME },
        userId: { not: userId },
      },
    })

    if (remainingSuperAdmins === 0) {
      throw createError({
        status: 400,
        statusText: 'At least one SuperAdmin must remain assigned.',
      })
    }
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  })

  await recordAuditLog({
    actorId: actor.id,
    action: 'user.role.remove',
    targetType: 'User',
    targetId: userId,
    metadata: {
      roleId,
      roleName: role.name,
    },
  })

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (targetUser && actor.id === userId) {
    await attachSessionWithAccess(event, {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl,
      themePreference: targetUser.themePreference,
    })
  }

  const updated = await fetchAdminUser(prisma, userId)
  return updated
})
