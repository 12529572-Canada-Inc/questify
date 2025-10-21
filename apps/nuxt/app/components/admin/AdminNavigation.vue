<script setup lang="ts">
import { useAccessControl } from '~/composables/useAccessControl'

const route = useRoute()
const { canManageRoles, canManageUsers, canViewSystemSettings } = useAccessControl()

// Centralized admin nav links, automatically hidden when the current user lacks the privilege.

interface NavLink {
  to: string
  label: string
  icon: string
}

const links = computed<NavLink[]>(() => {
  const items: Array<NavLink & { visible?: boolean }> = [
    { to: '/admin', label: 'Overview', icon: 'mdi-view-dashboard' },
    { to: '/admin/roles', label: 'Roles', icon: 'mdi-account-cog', visible: canManageRoles.value },
    { to: '/admin/users', label: 'Users', icon: 'mdi-account-group', visible: canManageUsers.value },
    { to: '/admin/privileges', label: 'Privileges', icon: 'mdi-shield-key-outline', visible: canManageRoles.value },
    { to: '/admin/settings', label: 'System Settings', icon: 'mdi-cog-outline', visible: canViewSystemSettings.value },
  ]

  return items.filter(item => item.visible !== false)
})

function isActive(path: string) {
  if (route.path === path) {
    return true
  }

  if (path !== '/admin' && route.path.startsWith(path)) {
    return true
  }

  return false
}
</script>

<template>
  <div class="admin-nav">
    <v-btn
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      variant="text"
      class="admin-nav__item"
      :class="{ 'admin-nav__item--active': isActive(link.to) }"
    >
      <v-icon
        :icon="link.icon"
        size="20"
        class="admin-nav__icon"
      />
      <span class="admin-nav__label">
        {{ link.label }}
      </span>
    </v-btn>
  </div>
</template>

<style scoped>
.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-nav__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.admin-nav__item--active {
  color: rgb(var(--v-theme-primary));
}

.admin-nav__icon {
  flex: 0 0 auto;
}

.admin-nav__label {
  white-space: nowrap;
}
</style>
