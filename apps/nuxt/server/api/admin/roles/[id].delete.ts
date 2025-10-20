import { PrismaClient } from '@prisma/client'
import { SUPER_ADMIN_ROLE_NAME } from 'shared'
import { requirePrivilege } from '../../../utils/access-control'
import { recordAuditLog } from '../../../utils/audit'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const actor = await requirePrivilege(event, 'role:delete')
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Role id is required' })
  }

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })

  if (!role) {
    throw createError({ status: 404, statusText: 'Role not found' })
  }

  if (role.system || role.name === SUPER_ADMIN_ROLE_NAME) {
    throw createError({
      status: 400,
      statusText: 'System roles cannot be deleted.',
    })
  }

  if (role._count.users > 0) {
    throw createError({
      status: 400,
      statusText: 'Remove this role from all users before deleting it.',
    })
  }

  await prisma.role.delete({ where: { id } })

  await recordAuditLog({
    actorId: actor.id,
    action: 'role.delete',
    targetType: 'Role',
    targetId: id,
    metadata: {
      name: role.name,
    },
  })

  return { success: true }
})
