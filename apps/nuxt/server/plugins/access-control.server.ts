import { PrismaClient } from '@prisma/client'
import { ensureSuperAdmin, syncPrivilegesAndRoles } from '#prisma-utils/accessControl'

const prisma = new PrismaClient()

export default defineNitroPlugin(async () => {
  try {
    await syncPrivilegesAndRoles(prisma)
    await ensureSuperAdmin(prisma)
  }
  catch (error) {
    console.error('[access-control] Failed to initialize roles and privileges', error)
  }
})
