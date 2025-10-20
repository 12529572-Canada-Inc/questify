import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useAccessControl } from '~/composables/useAccessControl'

describe('useAccessControl', () => {
  const originalUseUserSession = globalThis.useUserSession

  beforeEach(() => {
    vi.stubGlobal('useUserSession', () => ({
      user: ref({
        id: 'user-1',
        roles: ['Admin'],
        privileges: ['role:read', 'user:read', 'user:role:assign'],
      }),
      loggedIn: ref(true),
      fetch: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalUseUserSession) {
      vi.stubGlobal('useUserSession', originalUseUserSession)
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
