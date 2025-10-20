import type { Prisma, PrismaClient } from '@prisma/client'
import type { PrivilegeKey } from 'shared'

export const roleInclude = {
  privileges: {
    include: {
      privilege: {
        select: {
          id: true,
          key: true,
          label: true,
          description: true,
        },
      },
    },
  },
  users: {
    select: { userId: true },
  },
} as const

export type RoleRecord = Awaited<ReturnType<typeof loadRoleRecord>>

type PrismaOrTransaction = PrismaClient | Prisma.TransactionClient

async function loadRoleRecord(prisma: PrismaOrTransaction, roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: roleInclude,
  })
}

export type SerializedRole = ReturnType<typeof serializeRole>

export function serializeRole(role: NonNullable<Awaited<ReturnType<typeof loadRoleRecord>>>) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    system: role.system,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    privileges: role.privileges.map(item => ({
      key: item.privilege.key,
      label: item.privilege.label,
      description: item.privilege.description,
      assignedAt: item.assignedAt,
    })),
    userCount: role.users.length,
  }
}

export async function fetchRole(prisma: PrismaOrTransaction, roleId: string) {
  const role = await loadRoleRecord(prisma, roleId)
  return role ? serializeRole(role) : null
}

export async function fetchRoles(prisma: PrismaOrTransaction) {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    include: roleInclude,
  })

  return roles.map(serializeRole)
}

export async function resolvePrivilegeIds(
  prisma: PrismaOrTransaction,
  privilegeKeys: PrivilegeKey[],
) {
  if (!Array.isArray(privilegeKeys)) {
    return []
  }

  const uniqueKeys = Array.from(new Set(privilegeKeys))

  if (uniqueKeys.length === 0) {
    return []
  }

  const privileges = await prisma.privilege.findMany({
    where: { key: { in: uniqueKeys } },
    select: { id: true, key: true },
  })

  if (privileges.length !== uniqueKeys.length) {
    const found = new Set(privileges.map(privilege => privilege.key))
    const missing = uniqueKeys.filter(key => !found.has(key))
    throw createError({
      status: 400,
      statusMessage: `Unknown privileges: ${missing.join(', ')}`,
    })
  }

  return privileges
}
