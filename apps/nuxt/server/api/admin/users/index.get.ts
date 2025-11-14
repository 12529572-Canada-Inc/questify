import { requirePrivilege } from '../../../utils/access-control'
import { adminUserInclude, serializeAdminUser } from './utils'
import { prisma } from 'shared/server'

// Returns admin-focused user profiles with their assigned roles.
export default defineEventHandler(async (event) => {
  await requirePrivilege(event, 'user:read')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: adminUserInclude,
  })

  return users.map(serializeAdminUser)
})
