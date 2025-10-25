import { PrismaClient } from '@prisma/client'
import { requirePrivilege } from '../../../utils/access-control'
import { fetchRole } from './utils'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  await requirePrivilege(event, 'role:read')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ status: 400, statusText: 'Role id is required' })
  }

  const role = await fetchRole(prisma, id)
  if (!role) {
    throw createError({ status: 404, statusText: 'Role not found' })
  }

  return role
})
