import { PrismaClient } from '@prisma/client'
import { requirePrivilege } from '../../../utils/access-control'
import { fetchRoles } from './utils'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  await requirePrivilege(event, 'role:read')

  return fetchRoles(prisma)
})
