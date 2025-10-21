<script setup lang="ts">
import type { AdminPrivilege, AdminRole, AdminUser } from '~/types/admin'

definePageMeta({
  middleware: ['admin'],
})

const {
  data: rolesData,
  refresh: refreshRoles,
  pending: rolesPending,
  error: rolesError,
} = await useFetch<AdminRole[]>('/api/admin/roles', {
  default: () => [],
})

// Fetch supporting data sets used to render a quick admin dashboard snapshot.

const {
  data: usersData,
  refresh: refreshUsers,
  pending: usersPending,
  error: usersError,
} = await useFetch<AdminUser[]>('/api/admin/users', {
  default: () => [],
})

const {
  data: privilegesData,
  pending: privilegesPending,
  error: privilegesError,
} = await useFetch<AdminPrivilege[]>('/api/admin/privileges', {
  default: () => [],
})

const roles = computed(() => rolesData.value)
const users = computed(() => usersData.value)
const privileges = computed(() => privilegesData.value)

const pending = computed(() => rolesPending.value || usersPending.value || privilegesPending.value)

const errorMessage = computed(() => {
  return rolesError.value?.message
    || usersError.value?.message
    || privilegesError.value?.message
    || null
})

const metrics = computed(() => ({
  roles: roles.value.length,
  users: users.value.length,
  privileges: privileges.value.length,
}))

async function refreshOverview() {
  await Promise.all([refreshRoles(), refreshUsers()])
}
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex flex-column gap-4">
      <AdminNavigation />

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-2"
      >
        {{ errorMessage }}
      </v-alert>

      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">
            Administration Overview
          </span>
          <v-btn
            variant="text"
            prepend-icon="mdi-refresh"
            :loading="pending"
            @click="refreshOverview"
          >
            Refresh
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              md="4"
            >
              <div class="admin-metric">
                <v-icon
                  icon="mdi-account-cog"
                  size="26"
                  class="admin-metric__icon"
                />
                <div class="admin-metric__content">
                  <span class="admin-metric__label">Roles</span>
                  <strong class="admin-metric__value">
                    {{ metrics.roles }}
                  </strong>
                </div>
              </div>
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <div class="admin-metric">
                <v-icon
                  icon="mdi-account-group"
                  size="26"
                  class="admin-metric__icon"
                />
                <div class="admin-metric__content">
                  <span class="admin-metric__label">Users</span>
                  <strong class="admin-metric__value">
                    {{ metrics.users }}
                  </strong>
                </div>
              </div>
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <div class="admin-metric">
                <v-icon
                  icon="mdi-shield-key-outline"
                  size="26"
                  class="admin-metric__icon"
                />
                <div class="admin-metric__content">
                  <span class="admin-metric__label">Privileges</span>
                  <strong class="admin-metric__value">
                    {{ metrics.privileges }}
                  </strong>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title class="text-h6">
          Getting Started
        </v-card-title>
        <v-card-text class="d-flex flex-column gap-3">
          <p class="text-body-1 mb-0">
            Use the navigation above to manage global settings for Questify. Roles control what actions administrators can take,
            while user assignments determine who holds those responsibilities.
          </p>
          <ul class="admin-overview-list">
            <li>
              Review <strong>Roles</strong> to confirm that built-in roles meet your needs, or create custom roles for specialized scenarios.
            </li>
            <li>
              Visit <strong>Users</strong> to assign roles to team members or revoke privileges when access should be limited.
            </li>
            <li>
              Inspect <strong>Privileges</strong> to understand the capabilities bundled with each role.
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.admin-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

.admin-metric__icon {
  color: rgb(var(--v-theme-primary));
}

.admin-metric__label {
  font-size: 0.95rem;
  display: block;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.admin-metric__value {
  font-size: 1.5rem;
  line-height: 1.2;
}

.admin-overview-list {
  padding-left: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
