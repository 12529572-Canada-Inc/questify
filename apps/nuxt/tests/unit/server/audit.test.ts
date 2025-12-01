import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()

vi.mock('shared/server', async () => {
  const actual = await vi.importActual<typeof import('shared/server')>('shared/server')
  return {
    ...actual,
    prisma: {
      adminAuditLog: {
        create: createMock,
      },
    },
  }
})

describe('server/utils/audit', () => {
  beforeEach(() => {
    vi.resetModules()
    createMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('records audit logs with normalized payload', async () => {
    const { recordAuditLog } = await import('../../../server/utils/audit')
    await recordAuditLog({
      actorId: 'admin-1',
      action: 'role:assign',
      targetType: 'user',
      targetId: 'user-1',
      metadata: { role: 'Admin' },
    })

    expect(createMock).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-1',
        action: 'role:assign',
        targetType: 'user',
        targetId: 'user-1',
        metadata: { role: 'Admin' },
      },
    })
  })

  it('swallows errors when audit logging fails', async () => {
    const error = new Error('db down')
    createMock.mockRejectedValueOnce(error)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { recordAuditLog } = await import('../../../server/utils/audit')

    await expect(recordAuditLog({
      action: 'noop',
      targetType: 'system',
    })).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledWith('[audit] Failed to record audit log entry', error)
    errorSpy.mockRestore()
  })
})
