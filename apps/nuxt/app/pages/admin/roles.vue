<script setup lang="ts">
import type { PrivilegeKey } from 'shared'
import { useSnackbar } from '~/composables/useSnackbar'
import type { AdminPrivilege, AdminRole } from '~/types/admin'

definePageMeta({
  middleware: ['admin'],
})

// Roles management surface: list, create, edit, delete role definitions & privilege assignments.
const { showSnackbar } = useSnackbar()

const {
  data: rolesData,
  pending: rolesPending,
  refresh: refreshRoles,
} = await useFetch<AdminRole[]>('/api/admin/roles', {
  default: () => [],
})

const { data: privilegeData, pending: privilegesPending } = await useFetch<AdminPrivilege[]>('/api/admin/privileges', {
  default: () => [],
})

const roles = computed(() => rolesData.value)
const privileges = computed(() => privilegeData.value)
const pending = computed(() => rolesPending.value || privilegesPending.value)

const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const formLoading = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  id: '' as string,
  name: '',
  description: '' as string | null,
  privileges: [] as PrivilegeKey[],
  system: false,
})

const privilegeOptions = computed(() =>
  privileges.value.map(privilege => ({
    value: privilege.key,
    title: privilege.label,
  })),
)

function resetForm() {
  form.id = ''
  form.name = ''
  form.description = null
  form.privileges = []
  form.system = false
  formError.value = null
}

function openCreateDialog() {
  resetForm()
  createDialogOpen.value = true
}

function openEditDialog(role: AdminRole) {
  form.id = role.id
  form.name = role.name
  form.description = role.description ?? null
  form.privileges = role.privileges.map(privilege => privilege.key as PrivilegeKey)
  form.system = role.system
  formError.value = null
  editDialogOpen.value = true
}

async function handleCreateRole() {
  formLoading.value = true
  formError.value = null

  try {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: {
        name: form.name,
        description: form.description,
        privileges: form.privileges,
      },
    })

    createDialogOpen.value = false
    showSnackbar('Role created successfully.', { variant: 'success' })
    await refreshRoles()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to create role.'
    formError.value = message
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    formLoading.value = false
  }
}

async function handleUpdateRole() {
  if (!form.id) return
  formLoading.value = true
  formError.value = null

  try {
    await $fetch(`/api/admin/roles/${form.id}`, {
      method: 'PATCH',
      body: {
        name: form.name,
        description: form.description,
        privileges: form.privileges,
      },
    })

    editDialogOpen.value = false
    showSnackbar('Role updated.', { variant: 'success' })
    await refreshRoles()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to update role.'
    formError.value = message
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    formLoading.value = false
  }
}

async function handleDeleteRole(role: AdminRole) {
  if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
    return
  }

  try {
    await $fetch(`/api/admin/roles/${role.id}`, {
      method: 'DELETE',
    })

    showSnackbar('Role deleted.', { variant: 'success' })
    await refreshRoles()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to delete role.'
    showSnackbar(message, { variant: 'error' })
  }
}

const hasRoles = computed(() => roles.value.length > 0)
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex flex-column gap-4">
      <AdminNavigation />

      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h6">Roles</span>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            New Role
          </v-btn>
        </v-card-title>
        <v-divider />
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
              v-if="!hasRoles"
              class="py-8 text-medium-emphasis text-center"
            >
              No roles are defined yet. Create your first role to begin assigning administrative privileges.
            </div>
            <v-table
              v-else
              class="admin-roles-table"
            >
              <thead>
                <tr>
                  <th class="text-left">
                    Name
                  </th>
                  <th class="text-left">
                    Description
                  </th>
                  <th class="text-left">
                    Privileges
                  </th>
                  <th class="text-left">
                    Assigned
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="role in roles"
                  :key="role.id"
                >
                  <td>
                    <div class="d-flex align-center gap-2">
                      <span>{{ role.name }}</span>
                      <v-chip
                        v-if="role.system"
                        size="small"
                        color="primary"
                        variant="tonal"
                      >
                        System
                      </v-chip>
                    </div>
                  </td>
                  <td class="text-medium-emphasis">
                    {{ role.description || '—' }}
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="privilege in role.privileges"
                        :key="privilege.key"
                        size="small"
                        variant="tonal"
                        color="secondary"
                      >
                        {{ privilege.label }}
                      </v-chip>
                    </div>
                  </td>
                  <td>
                    {{ role.userCount }}
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <v-btn
                        size="small"
                        variant="text"
                        icon="mdi-pencil"
                        @click="openEditDialog(role)"
                      />
                      <v-btn
                        v-if="!role.system"
                        size="small"
                        variant="text"
                        icon="mdi-delete"
                        color="error"
                        @click="handleDeleteRole(role)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-dialog
      v-model="createDialogOpen"
      max-width="540"
    >
      <v-card>
        <v-card-title class="text-h6">
          Create Role
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Name"
            :disabled="formLoading"
            required
          />
          <v-textarea
            v-model="form.description"
            label="Description"
            :disabled="formLoading"
            rows="3"
            auto-grow
          />
          <v-select
            v-model="form.privileges"
            :items="privilegeOptions"
            label="Privileges"
            multiple
            chips
            :disabled="formLoading"
          />
          <p
            v-if="formError"
            class="text-error text-body-2 mt-2"
          >
            {{ formError }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="formLoading"
            @click="createDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="formLoading"
            :disabled="!form.name.trim()"
            @click="handleCreateRole"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="editDialogOpen"
      max-width="540"
    >
      <v-card>
        <v-card-title class="text-h6">
          Edit Role
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Name"
            :disabled="formLoading"
            required
          />
          <v-textarea
            v-model="form.description"
            label="Description"
            :disabled="formLoading"
            rows="3"
            auto-grow
          />
          <v-select
            v-model="form.privileges"
            :items="privilegeOptions"
            label="Privileges"
            multiple
            chips
            :disabled="formLoading"
          />
          <p
            v-if="formError"
            class="text-error text-body-2 mt-2"
          >
            {{ formError }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="formLoading"
            @click="editDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="formLoading"
            :disabled="!form.id || !form.name.trim()"
            @click="handleUpdateRole"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.admin-roles-table {
  border-radius: 12px;
  overflow: hidden;
}

.admin-roles-table tbody tr:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.admin-roles-table td {
  vertical-align: top;
  padding-block: 12px;
}
</style>
