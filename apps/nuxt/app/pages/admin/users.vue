<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'

definePageMeta({
  middleware: ['admin'],
})

const { showSnackbar } = useSnackbar()

const {
  data: usersData,
  pending: usersPending,
  refresh: refreshUsers,
} = await useFetch('/api/admin/users')

const { data: rolesData, pending: rolesPending, refresh: refreshRoles } = await useFetch('/api/admin/roles')

const pending = computed(() => usersPending.value || rolesPending.value)

const selectedRole = reactive<Record<string, string | null>>({})
const loadingUsers = reactive<Set<string>>(new Set())

function isLoading(userId: string) {
  return loadingUsers.has(userId)
}

function setLoading(userId: string, value: boolean) {
  if (value) loadingUsers.add(userId)
  else loadingUsers.delete(userId)
}

const assignableRoles = computed(() => rolesData.value ?? [])

function roleOptionsFor(userId: string) {
  const assigned = new Set(
    (usersData.value ?? [])
      .find(user => user.id === userId)?.roles.map((role: { id: string }) => role.id) ?? [],
  )

  return assignableRoles.value
    .filter(role => !assigned.has(role.id))
    .map(role => ({ value: role.id, title: role.name, system: role.system }))
}

async function assignRole(userId: string) {
  const roleId = selectedRole[userId]
  if (!roleId) return

  setLoading(userId, true)

  try {
    await $fetch(`/api/admin/users/${userId}/roles`, {
      method: 'POST',
      body: { roleId },
    })

    showSnackbar('Role assigned.', { variant: 'success' })
    selectedRole[userId] = null
    await Promise.all([refreshUsers(), refreshRoles()])
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to assign role.'
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    setLoading(userId, false)
  }
}

async function removeRole(userId: string, roleId: string) {
  setLoading(userId, true)

  try {
    await $fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    })

    showSnackbar('Role removed.', { variant: 'success' })
    await Promise.all([refreshUsers(), refreshRoles()])
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to remove role.'
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    setLoading(userId, false)
  }
}

const hasUsers = computed(() => (usersData.value?.length ?? 0) > 0)
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex flex-column gap-4">
      <AdminNavigation />

      <v-card>
        <v-card-title class="text-h6">
          Users &amp; Roles
        </v-card-title>
        <v-card-text>
          <div
            v-if="pending"
            class="py-8 d-flex justify-center"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div v-else>
            <div
              v-if="!hasUsers"
              class="py-8 text-medium-emphasis text-center"
            >
              No users found.
            </div>
            <v-table
              v-else
              class="admin-users-table"
            >
              <thead>
                <tr>
                  <th class="text-left">
                    User
                  </th>
                  <th class="text-left">
                    Roles
                  </th>
                  <th
                    class="text-left"
                    style="width: 240px;"
                  >
                    Assign Role
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in usersData"
                  :key="user.id"
                >
                  <td>
                    <div class="d-flex flex-column">
                      <span class="font-weight-medium">{{ user.name || 'Unnamed user' }}</span>
                      <span class="text-body-2 text-medium-emphasis">{{ user.email }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="role in user.roles"
                        :key="role.id"
                        size="small"
                        :color="role.system ? 'primary' : 'secondary'"
                        variant="tonal"
                        class="d-flex align-center gap-1"
                      >
                        <span>{{ role.name }}</span>
                        <v-btn
                          v-if="!role.system"
                          icon="mdi-close"
                          size="x-small"
                          variant="text"
                          :disabled="isLoading(user.id)"
                          @click.stop="removeRole(user.id, role.id)"
                        />
                      </v-chip>
                      <span
                        v-if="user.roles.length === 0"
                        class="text-medium-emphasis text-body-2"
                      >No roles</span>
                    </div>
                  </td>
                  <td>
                    <v-select
                      v-model="selectedRole[user.id]"
                      :items="roleOptionsFor(user.id)"
                      label="Select role"
                      density="comfortable"
                      variant="outlined"
                      :disabled="isLoading(user.id) || roleOptionsFor(user.id).length === 0"
                      hide-details
                      @update:model-value="assignRole(user.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.admin-users-table td {
  vertical-align: top;
  padding-block: 12px;
}
</style>
