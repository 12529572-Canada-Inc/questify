<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuest } from '~/composables/useQuest'

const route = useRoute()
const id = route.params.id as string

const { data: quest, refresh, pending } = await useQuest(id)

const tasksLoading = computed(() => {
  const currentQuest = quest.value
  if (!currentQuest) {
    return false
  }

  const tasks = currentQuest.tasks ?? []

  return currentQuest.status === 'draft' && tasks.length === 0
})

if (import.meta.client) {
  let pollTimer: ReturnType<typeof setInterval> | null = null

  watch(
    tasksLoading,
    (loading) => {
      if (loading) {
        if (!pollTimer) {
          pollTimer = window.setInterval(() => {
            refresh()
          }, 2000)
        }
      }
      else if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })
}

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
          <v-card-text class="d-flex flex-column gap-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Quest Description
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="quest.description"
                fallback="No description provided."
              />
            </div>

            <div v-if="quest.goal">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Desired Outcome
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="quest.goal"
              />
            </div>

            <div v-if="quest.context">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Context
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="quest.context"
              />
            </div>

            <div v-if="quest.constraints">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Constraints & Preferences
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="quest.constraints"
              />
            </div>
          </v-card-text>

          <v-divider class="my-4" />

          <!-- Owner Information -->
          <v-card-text>
            <h3 class="text-h6 mb-2">
              Owner Information
            </h3>
            <p><strong>Name:</strong> {{ quest.owner.name || 'Unknown' }}</p>
          </v-card-text>

          <v-divider class="my-4" />

          <!-- Tasks -->
          <v-card-text>
            <h3 class="text-h6 mb-2">
              Tasks
            </h3>
            <div
              v-if="pending || tasksLoading"
              class="d-flex align-center gap-3 py-4"
            >
              <v-progress-circular
                color="primary"
                indeterminate
              />
              <span class="text-body-2">Generating tasks for this quest...</span>
            </div>
            <template v-else>
              <v-list v-if="quest.tasks.length">
                <v-list-item
                  v-for="task in quest.tasks"
                  :key="task.id"
                >
                  <v-list-item-title>{{ task.title }}</v-list-item-title>
                  <TextWithLinks
                    v-if="task.details"
                    class="text-body-2"
                    tag="div"
                    :text="task.details"
                  />
                  <v-list-item-subtitle>Status: {{ task.status }}</v-list-item-subtitle>
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
              <p
                v-else
                class="text-body-2 text-medium-emphasis"
              >
                No tasks have been generated for this quest yet.
              </p>
            </template>
          </v-card-text>

          <v-card-actions>
            <v-row
              class="w-100"
              dense
            >
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  block
                  color="primary"
                  :to="`/quests`"
                >
                  Back to Quests
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  v-if="quest.status !== 'completed'"
                  block
                  color="success"
                  @click="completeQuest"
                >
                  Mark as Completed
                </v-btn>
              </v-col>
            </v-row>
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
