import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuditLogInput {
  actorId?: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Lightweight helper for recording administrative actions. Errors are swallowed
 * so that audit logging never prevents the main action from completing.
 */
export async function recordAuditLog(entry: AuditLogInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      },
    })
  }
  catch (error) {
    console.error('[audit] Failed to record audit log entry', error)
  }
}
