import type { PrismaClient } from '@prisma/client'
import {
  PRIVILEGE_DEFINITIONS,
  ROLE_DEFINITIONS,
  SUPER_ADMIN_ROLE_NAME,
  type PrivilegeKey,
} from 'shared'

/**
 * Utility helpers that keep the RBAC tables (roles, privileges, user-role links)
 * in sync with the shared definitions. These run during migrations/seed as well
 * as at Nitro bootstrap to guarantee system roles are present.
 */

export async function syncPrivilegesAndRoles(prisma: PrismaClient) {
  await prisma.$transaction(
    PRIVILEGE_DEFINITIONS.map(def =>
      prisma.privilege.upsert({
        where: { key: def.key },
        update: {
          label: def.label,
          description: def.description,
        },
        create: {
          key: def.key,
          label: def.label,
          description: def.description,
        },
      }),
    ),
  )

  const privilegeRecords = await prisma.privilege.findMany({
    select: { id: true, key: true },
  })
  const privilegeMap = new Map<PrivilegeKey, string>(
    privilegeRecords.map(record => [record.key as PrivilegeKey, record.id]),
  )

  for (const roleDefinition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: {
        description: roleDefinition.description,
        system: roleDefinition.system,
      },
      create: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        system: roleDefinition.system,
      },
    })

    const existingPrivileges = await prisma.rolePrivilege.findMany({
      where: { roleId: role.id },
      include: { privilege: { select: { key: true } } },
    })

    const existingKeys = new Set<PrivilegeKey>(
      existingPrivileges.map(item => item.privilege.key as PrivilegeKey),
    )
    const desiredKeys = new Set<PrivilegeKey>(roleDefinition.privileges)

    const toCreate = [...desiredKeys].filter(key => !existingKeys.has(key))
    const toRemove = roleDefinition.system
      ? [...existingKeys].filter(key => !desiredKeys.has(key))
      : []

    if (toCreate.length > 0) {
      await prisma.rolePrivilege.createMany({
        data: toCreate
          .map(key => {
            const privilegeId = privilegeMap.get(key)
            if (!privilegeId) {
              console.warn(`[access-control] Missing privilege id for key ${key}`)
              return undefined
            }
            return {
              roleId: role.id,
              privilegeId,
            }
          })
          .filter((item): item is { roleId: string; privilegeId: string } => Boolean(item)),
        skipDuplicates: true,
      })
    }

    if (toRemove.length > 0) {
      await prisma.rolePrivilege.deleteMany({
        where: {
          roleId: role.id,
          privilege: {
            key: {
              in: toRemove,
            },
          },
        },
      })
    }
  }
}

export async function ensureSuperAdmin(prisma: PrismaClient) {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: SUPER_ADMIN_ROLE_NAME },
    select: {
      id: true,
      users: {
        select: { userId: true },
        take: 1,
      },
    },
  })

  if (!superAdminRole) {
    console.error('[access-control] SuperAdmin role is missing.')
    return
  }

  if (superAdminRole.users.length > 0) {
    return
  }

  const candidate = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!candidate) {
    return
  }

  await prisma.userRole.create({
    data: {
      userId: candidate.id,
      roleId: superAdminRole.id,
    },
  })

  console.warn(
    `[access-control] No SuperAdmin found. Promoted earliest user (${candidate.email}) to SuperAdmin.`,
  )

  await prisma.adminAuditLog.create({
    data: {
      actorId: null,
      action: 'system.assign_super_admin',
      targetType: 'UserRole',
      targetId: `${candidate.id}:${superAdminRole.id}`,
      metadata: {
        reason: 'bootstrap',
        promotedUserId: candidate.id,
      },
    },
  })
}
