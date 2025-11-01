<script setup lang="ts">
import { computed } from 'vue'
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

const activeTab = computed<string | null>(() => {
  const match = links.value.find((link) => {
    if (route.path === link.to) {
      return true
    }
    if (link.to !== '/admin' && route.path.startsWith(link.to)) {
      return true
    }
    return false
  })

  return match?.to ?? links.value[0]?.to ?? null
})
</script>

<template>
  <div class="admin-nav">
    <v-tabs
      class="admin-nav__tabs"
      :model-value="activeTab"
      density="comfortable"
      bg-color="transparent"
      align-tabs="start"
      slider-color="primary"
      show-arrows
    >
      <v-tab
        v-for="link in links"
        :key="link.to"
        :value="link.to"
        :to="link.to"
        :prepend-icon="link.icon"
        :ripple="false"
      >
        {{ link.label }}
      </v-tab>
    </v-tabs>

    <v-tabs-window
      class="admin-nav__window"
      :model-value="activeTab"
    >
      <slot />
    </v-tabs-window>
  </div>
</template>

<style scoped>
.admin-nav__tabs {
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color, var(--v-theme-outline)), 0.3);
}

.admin-nav__tabs :deep(.v-tabs__wrapper) {
  box-shadow: none;
}

.admin-nav__tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  min-height: 48px;
}

.admin-nav__tabs :deep(.v-tab .v-tab__prepend) {
  margin-right: 6px;
}

.admin-nav__window {
  margin-top: 12px;
}
</style>
