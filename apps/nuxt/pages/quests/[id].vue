<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()

// Mock data (replace with API call later)
const quests = [
  { id: 1, title: 'Slay the Dragon', status: 'Active', description: 'Defeat the dragon in the dark forest.' },
  { id: 2, title: 'Gather Herbs', status: 'Pending', description: 'Collect 10 healing herbs for the village healer.' },
]

const quest = ref<unknown>(
  quests.find(q => q.id === Number(route.params.id)) || {
    id: 0,
    title: 'Quest Not Found',
    status: 'N/A',
    description: 'This quest does not exist.',
  },
)

function completeQuest() {
  // quest.value.status = 'Completed'
}
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            {{ quest.title }}
          </v-card-title>
          <v-card-subtitle class="mb-2">
            Status: <strong>{{ quest.status }}</strong>
          </v-card-subtitle>
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
      </v-col>
    </v-row>
  </v-container>
</template>
