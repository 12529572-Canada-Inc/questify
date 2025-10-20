<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

const { data: privilegesData, pending } = await useFetch('/api/admin/privileges')

const hasPrivileges = computed(() => (privilegesData.value?.length ?? 0) > 0)
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex flex-column gap-4">
      <AdminNavigation />

      <v-card>
        <v-card-title class="text-h6">
          Privileges
        </v-card-title>
        <v-card-text>
          <div v-if="pending" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else>
            <div v-if="!hasPrivileges" class="py-8 text-medium-emphasis text-center">
              No privileges found.
            </div>
            <v-table v-else class="admin-privileges-table">
              <thead>
                <tr>
                  <th class="text-left">Key</th>
                  <th class="text-left">Label</th>
                  <th class="text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="privilege in privilegesData"
                  :key="privilege.id"
                >
                  <td class="font-mono text-body-2">
                    {{ privilege.key }}
                  </td>
                  <td class="font-weight-medium">
                    {{ privilege.label }}
                  </td>
                  <td class="text-medium-emphasis">
                    {{ privilege.description || '—' }}
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
.admin-privileges-table td {
  padding-block: 12px;
}
</style>
