import { Prisma, PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import { SUPER_ADMIN_ROLE_NAME } from 'shared'
import {
  attachSessionWithAccess,
  requirePrivilege,
  sessionHasPrivilege,
} from '../../../../utils/access-control'
import { recordAuditLog } from '../../../../utils/audit'
import { fetchAdminUser } from '../../users/utils'

const prisma = new PrismaClient()

interface AssignRoleBody {
  roleId?: string
}

export default defineEventHandler(async (event: H3Event) => {
  const actor = await requirePrivilege(event, 'user:role:assign')
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ status: 400, statusMessage: 'User id is required' })
  }

  const body = (await readBody<AssignRoleBody>(event)) || {}
  const roleId = body.roleId?.trim()

  if (!roleId) {
    throw createError({ status: 400, statusMessage: 'roleId is required' })
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } })

  if (!role) {
    throw createError({ status: 404, statusMessage: 'Role not found' })
  }

  if (role.system && role.name === SUPER_ADMIN_ROLE_NAME) {
    const canManageSystem = sessionHasPrivilege(actor, 'system:settings:update')
    if (!canManageSystem) {
      throw createError({
        status: 403,
        statusMessage: 'Only system administrators can assign the SuperAdmin role.',
      })
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw createError({ status: 404, statusMessage: 'User not found' })
  }

  try {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedById: actor.id,
      },
    })
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // role already assigned
    }
    else {
      throw error
    }
  }

  await recordAuditLog({
    actorId: actor.id,
    action: 'user.role.assign',
    targetType: 'User',
    targetId: userId,
    metadata: {
      roleId,
      roleName: role.name,
    },
  })

  if (actor.id === userId) {
    await attachSessionWithAccess(event, {
      id: user.id,
      email: user.email,
      name: user.name,
    })
  }

  const updatedUser = await fetchAdminUser(prisma, userId)
  return updatedUser
})
