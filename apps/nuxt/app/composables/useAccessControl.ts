import { computed, ref } from 'vue'
import { ADMIN_ROLE_NAME, SUPER_ADMIN_ROLE_NAME, type PrivilegeKey } from 'shared'

/**
 * Client-side RBAC helper that reads the current session payload and exposes
 * convenience booleans for feature gating admin navigation and actions.
 */

const ADMIN_PRIVILEGE_KEYS: PrivilegeKey[] = [
  'role:read',
  'user:read',
  'system:settings:read',
]

export function useAccessControl() {
  const session = useUserSession()
  const user = session.user ?? ref(null)

  const roles = computed(() => (user.value?.roles ?? []) as string[])
  const privileges = computed<PrivilegeKey[]>(() => (user.value?.privileges ?? []) as PrivilegeKey[])

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
