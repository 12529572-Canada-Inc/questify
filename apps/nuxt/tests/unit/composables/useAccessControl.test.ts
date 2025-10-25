import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useAccessControl } from '~/composables/useAccessControl'

describe('useAccessControl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    const sessionUser = ref({
      id: 'user-1',
      roles: ['Admin'],
      privileges: ['role:read', 'user:read', 'user:role:assign'],
    })

    vi.stubGlobal('useUserSession', () => ({
      user: sessionUser,
      loggedIn: ref(true),
      fetch: vi.fn(),
      clear: vi.fn(),
    }))

    const userStore = useUserStore()
    userStore.setUser(sessionUser.value)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
