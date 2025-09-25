<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuest } from '~/composables/useQuest'

const route = useRoute()
const id = route.params.id as string

const { data: quest, refresh } = await useQuest(id)

async function markTaskCompleted(taskId: string) {
  await $fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: { status: 'completed' },
  })
  await refresh()
}

async function completeQuest() {
  await $fetch(`/api/quests/${id}`, {
    method: 'PATCH',
    body: { status: 'completed' },
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

          <v-divider class="my-4" />

          <v-card-text>
            <h3 class="text-h6 mb-2">
              Tasks
            </h3>
            <v-list>
              <v-list-item
                v-for="task in quest.tasks"
                :key="task.id"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ task.title }}</v-list-item-title>
                  <v-list-item-subtitle>Status: {{ task.status }}</v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn
                    v-if="task.status !== 'completed'"
                    size="small"
                    color="success"
                    @click="markTaskCompleted(task.id)"
                  >
                    Complete
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/quests`"
            >
              Back to Quests
            </v-btn>
            <v-btn
              v-if="quest.status !== 'completed'"
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
