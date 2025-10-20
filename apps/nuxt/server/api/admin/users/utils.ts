import type { Prisma, PrismaClient } from '@prisma/client'

type PrismaOrTransaction = PrismaClient | Prisma.TransactionClient

export const adminUserInclude = {
  roles: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          system: true,
        },
      },
    },
  },
} as const

export function serializeAdminUser(
  user: {
    id: string
    email: string
    name: string | null
    createdAt: Date
    updatedAt: Date
    roles: Array<{
      assignedAt: Date
      assignedById: string | null
      role: {
        id: string
        name: string
        description: string | null
        system: boolean
      }
    }>
  },
) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map(assignment => ({
      id: assignment.role.id,
      name: assignment.role.name,
      description: assignment.role.description,
      system: assignment.role.system,
      assignedAt: assignment.assignedAt,
      assignedById: assignment.assignedById,
    })),
  }
}

export async function fetchAdminUser(prisma: PrismaOrTransaction, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: adminUserInclude,
  })

  return user ? serializeAdminUser(user) : null
}
