import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useAccessControl } from '~/composables/useAccessControl'

describe('useAccessControl', () => {
  const globalWithMocks = globalThis as typeof globalThis & {
    useUserSession?: () => {
      user: ReturnType<typeof ref>
      loggedIn: ReturnType<typeof ref>
      fetch: () => Promise<unknown>
    }
  }

  const originalUseUserSession = globalWithMocks.useUserSession

  beforeEach(() => {
    globalWithMocks.useUserSession = () => ({
      user: ref({
        id: 'user-1',
        roles: ['Admin'],
        privileges: ['role:read', 'user:read', 'user:role:assign'],
      }),
      loggedIn: ref(true),
      fetch: vi.fn(),
    })
  })

  afterEach(() => {
    if (originalUseUserSession) {
      globalWithMocks.useUserSession = originalUseUserSession
    }
    else {
      delete globalWithMocks.useUserSession
    }
  })

  it('computes derived privilege checks', () => {
    const access = useAccessControl()

    expect(access.roles.value).toEqual(['Admin'])
    expect(access.hasPrivilege('role:read')).toBe(true)
    expect(access.hasAnyPrivilege(['system:settings:update', 'user:read'])).toBe(true)
    expect(access.isAdmin.value).toBe(true)
    expect(access.isSuperAdmin.value).toBe(false)
    expect(access.canManageUsers.value).toBe(true)
  })
})
