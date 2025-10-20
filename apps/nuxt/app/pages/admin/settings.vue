<script setup lang="ts">
import { SUPER_ADMIN_ROLE_NAME } from 'shared'
import { useSnackbar } from '~/composables/useSnackbar'
import { useAccessControl } from '~/composables/useAccessControl'

definePageMeta({
  middleware: ['admin'],
})

const { showSnackbar } = useSnackbar()
const { canViewSystemSettings } = useAccessControl()

const {
  data: rolesData,
  pending,
  refresh,
} = await useFetch('/api/admin/roles')

const superAdminRole = computed(() => (rolesData.value ?? []).find(role => role.name === SUPER_ADMIN_ROLE_NAME))
const superAdminCount = computed(() => superAdminRole.value?.userCount ?? 0)

async function runRecovery() {
  try {
    await $fetch('/api/admin/recovery/ensure-super-admin', {
      method: 'POST',
    })

    showSnackbar('SuperAdmin role restored to your account.', { variant: 'success' })
    await refresh()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to run recovery.'
    showSnackbar(message, { variant: 'error' })
  }
}
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex flex-column gap-4">
      <AdminNavigation />

      <v-card>
        <v-card-title class="text-h6">
          System Settings
        </v-card-title>
        <v-card-text>
          <div v-if="!canViewSystemSettings" class="py-6 text-medium-emphasis">
            You can view this overview, but additional privileges are required to update system settings.
          </div>

          <v-alert
            v-if="pending"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            Loading system status...
          </v-alert>

          <v-card
            variant="tonal"
            class="mb-4"
          >
            <v-card-title class="text-subtitle-1 font-weight-medium">
              SuperAdmin Recovery
            </v-card-title>
            <v-card-text class="d-flex flex-column gap-2">
              <p class="text-body-2 mb-0">
                If all SuperAdmin accounts are removed, you can restore access by promoting your current account.
              </p>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Current SuperAdmin assignments: <strong>{{ superAdminCount }}</strong>
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                :disabled="superAdminCount > 0"
                @click="runRecovery"
              >
                Restore SuperAdmin Access
              </v-btn>
            </v-card-actions>
          </v-card>

          <v-card
            variant="outlined"
          >
            <v-card-title class="text-subtitle-1 font-weight-medium">
              Coming Soon
            </v-card-title>
            <v-card-text class="text-body-2 text-medium-emphasis">
              Additional global configuration options will surface here as system-level features are introduced.
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>
