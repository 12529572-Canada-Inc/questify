import { Prisma, PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import type { PrivilegeKey } from 'shared'
import { requirePrivilege } from '../../../utils/access-control'
import { recordAuditLog } from '../../../utils/audit'
import { fetchRole, resolvePrivilegeIds } from './utils'

const prisma = new PrismaClient()

interface CreateRoleBody {
  name?: string
  description?: string | null
  privileges?: PrivilegeKey[]
}

function sanitizeName(name: string | undefined) {
  const value = (name ?? '').trim()
  if (!value) {
    throw createError({ status: 400, statusMessage: 'Role name is required' })
  }
  return value
}

export default defineEventHandler(async (event: H3Event) => {
  const actor = await requirePrivilege(event, 'role:create')
  const body = (await readBody<CreateRoleBody>(event)) || {}

  const name = sanitizeName(body.name)
  const description = body.description?.trim() || null

  const privileges = await resolvePrivilegeIds(prisma, body.privileges ?? [])

  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        system: false,
        privileges: {
          create: privileges.map(privilege => ({
            privilegeId: privilege.id,
          })),
        },
      },
    })

    await recordAuditLog({
      actorId: actor.id,
      action: 'role.create',
      targetType: 'Role',
      targetId: role.id,
      metadata: {
        name,
        description,
        privileges: privileges.map(privilege => privilege.key),
      },
    })

    const serialized = await fetchRole(prisma, role.id)
    return serialized
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
})
