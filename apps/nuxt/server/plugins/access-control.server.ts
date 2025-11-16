import { ensureSuperAdmin, syncPrivilegesAndRoles } from '#prisma-utils/accessControl'
import { prisma } from 'shared/server'

/**
 * Nitro plugin executed on server startup. It seeds/updates the RBAC lookup tables
 * (roles + privileges) and guarantees at least one SuperAdmin exists so the admin UI
 * remains accessible even after migrations or manual DB edits.
 */
export default defineNitroPlugin(async () => {
  try {
    await syncPrivilegesAndRoles(prisma)
    await ensureSuperAdmin(prisma)
  }
  catch (error) {
    console.error('[access-control] Failed to initialize roles and privileges', error)
  }
})
