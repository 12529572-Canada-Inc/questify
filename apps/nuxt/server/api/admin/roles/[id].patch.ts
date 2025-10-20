import { Prisma, PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import type { PrivilegeKey } from 'shared'
import { requirePrivilege, sessionHasPrivilege } from '../../../utils/access-control'
import { recordAuditLog } from '../../../utils/audit'
import { fetchRole, resolvePrivilegeIds } from './utils'

const prisma = new PrismaClient()

interface UpdateRoleBody {
  name?: string
  description?: string | null
  privileges?: PrivilegeKey[]
}

function sanitizeOptionalName(name: string | undefined) {
  if (name === undefined) {
    return undefined
  }

  const value = name.trim()
  if (!value) {
    throw createError({ status: 400, statusMessage: 'Role name cannot be empty' })
  }

  return value
}

export default defineEventHandler(async (event: H3Event) => {
  const actor = await requirePrivilege(event, 'role:update')
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusMessage: 'Role id is required' })
  }

  const payload = (await readBody<UpdateRoleBody>(event)) || {}

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      privileges: {
        include: { privilege: true },
      },
    },
  })

  if (!role) {
    throw createError({ status: 404, statusMessage: 'Role not found' })
  }

  if (role.system && payload.name && payload.name !== role.name) {
    // allow renaming system roles only if actor has elevated privilege
    if (!sessionHasPrivilege(actor, 'system:settings:update')) {
      throw createError({
        status: 403,
        statusMessage: 'You are not allowed to rename a system role.',
      })
    }
  }

  const name = sanitizeOptionalName(payload.name)
  const description = payload.description === undefined
    ? undefined
    : (payload.description?.trim() || null)

  const privilegeRecords = payload.privileges
    ? await resolvePrivilegeIds(prisma, payload.privileges)
    : null

  try {
    await prisma.$transaction(async (tx) => {
      const data: Prisma.RoleUpdateInput = {}

      if (name !== undefined) {
        data.name = name
      }

      if (description !== undefined) {
        data.description = description
      }

      if (Object.keys(data).length > 0) {
        await tx.role.update({
          where: { id },
          data,
        })
      }

      if (privilegeRecords) {
        const privilegeIds = privilegeRecords.map(privilege => privilege.id)
        await tx.rolePrivilege.deleteMany({
          where: {
            roleId: id,
            privilegeId: {
              notIn: privilegeIds,
            },
          },
        })
        await tx.rolePrivilege.createMany({
          data: privilegeIds.map(privilegeId => ({
            roleId: id,
            privilegeId,
          })),
          skipDuplicates: true,
        })
      }
    })
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({
        status: 409,
        statusMessage: 'A role with that name already exists.',
      })
    }

    throw error
  }

  const updated = await fetchRole(prisma, id)

  if (updated) {
    await recordAuditLog({
      actorId: actor.id,
      action: 'role.update',
      targetType: 'Role',
      targetId: id,
      metadata: {
        name: updated.name,
        description: updated.description,
        privileges: updated.privileges.map(privilege => privilege.key),
      },
    })
  }

  return updated
})
