<script setup lang="ts">
import { computed } from 'vue'

function normalizePublicFlag(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(entry => normalizePublicFlag(entry))
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.trim().toLowerCase()

  return normalized === 'true' || normalized === '1' || normalized === 'public'
}

const route = useRoute()

const makePublic = computed(() => {
  const visibilityQuery = route.query.public ?? route.query.visibility
  return normalizePublicFlag(visibilityQuery)
})
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-row
      class="w-100"
      justify="center"
    >
      <v-col
        cols="12"
        sm="10"
        md="8"
        lg="6"
      >
        <v-card
          elevation="3"
          class="pa-6"
        >
          <v-card-title class="text-h5 text-md-h4 font-weight-bold mb-6 text-center">
            Create a New Quest
          </v-card-title>

          <v-alert
            v-if="makePublic"
            type="success"
            variant="tonal"
            border="start"
            class="mb-6"
          >
            This quest will be created as public and visible to everyone. You can change visibility from the quest page later.
          </v-alert>

          <QuestForm :make-public="makePublic" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
