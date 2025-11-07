import { requirePrivilege } from '../../../utils/access-control'
import { fetchRoles } from './utils'
import { prisma } from 'shared/server'

// Returns the complete list of roles with privilege counts for the admin UI.
export default defineEventHandler(async (event) => {
  await requirePrivilege(event, 'role:read')

  return fetchRoles(prisma)
})
