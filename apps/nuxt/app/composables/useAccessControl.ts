import { computed } from 'vue'
import { ADMIN_ROLE_NAME, SUPER_ADMIN_ROLE_NAME, type PrivilegeKey } from 'shared'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'

/**
 * Reads the current user session (via `useUserStore`) and exposes convenience
 * booleans/guards for feature gating admin-only UI and behaviors.
 *
 * @returns helpers describing the current user's roles/privileges plus guard utilities.
 */

const ADMIN_PRIVILEGE_KEYS: PrivilegeKey[] = [
  'role:read',
  'user:read',
  'system:settings:read',
]

export function useAccessControl() {
  const userStore = useUserStore()
  const { roles: userRoles, privileges: userPrivileges } = storeToRefs(userStore)

  const roles = computed(() => (userRoles.value ?? []) as string[])
  const privileges = computed<PrivilegeKey[]>(() => (userPrivileges.value ?? []) as PrivilegeKey[])

  function hasPrivilege(privilege: PrivilegeKey) {
    return privileges.value.includes(privilege)
  }

  function hasAnyPrivilege(required: PrivilegeKey[]) {
    return required.some(hasPrivilege)
  }

  const isSuperAdmin = computed(() => roles.value.includes(SUPER_ADMIN_ROLE_NAME))
  const isAdmin = computed(() =>
    isSuperAdmin.value
    || roles.value.includes(ADMIN_ROLE_NAME)
    || hasAnyPrivilege(ADMIN_PRIVILEGE_KEYS),
  )

  const canManageRoles = computed(() =>
    hasAnyPrivilege(['role:read', 'role:create', 'role:update', 'role:delete']),
  )

  const canManageUsers = computed(() =>
    hasAnyPrivilege(['user:read', 'user:role:assign']),
  )

  const canViewSystemSettings = computed(() => hasPrivilege('system:settings:read'))

  return {
    roles,
    privileges,
    hasPrivilege,
    hasAnyPrivilege,
    isSuperAdmin,
    isAdmin,
    canManageRoles,
    canManageUsers,
    canViewSystemSettings,
  }
}
