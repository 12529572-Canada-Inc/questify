<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuest } from '~/composables/useQuest'

const route = useRoute()
const id = route.params.id as string

const { data: quest, refresh } = await useQuest(id)

async function completeQuest() {
  await $fetch(`/api/quests/${id}`, {
    method: 'PATCH',
    body: { status: 'Completed' },
  })
  await refresh()
}
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <v-card v-if="quest">
          <v-card-title class="text-h5">
            {{ quest.title }}
          </v-card-title>
          <v-card-subtitle>Status: <strong>{{ quest.status }}</strong></v-card-subtitle>
          <v-card-text>
            <p>{{ quest.description }}</p>
          </v-card-text>

          <v-divider />

          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/quests`"
            >
              Back to Quests
            </v-btn>
            <v-btn
              v-if="quest.status !== 'Completed'"
              color="success"
              @click="completeQuest"
            >
              Mark as Completed
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-alert
          v-else
          type="error"
          title="Quest Not Found"
        >
          This quest does not exist.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>
