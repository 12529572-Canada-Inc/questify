import { PrismaClient } from '@prisma/client'
import { requirePrivilege } from '../../../utils/access-control'

const prisma = new PrismaClient()

// Lists all privilege definitions so admins can inspect available capability keys.
export default defineEventHandler(async (event) => {
  await requirePrivilege(event, 'role:read')

  const privileges = await prisma.privilege.findMany({
    orderBy: { key: 'asc' },
    select: {
      id: true,
      key: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return privileges
})
