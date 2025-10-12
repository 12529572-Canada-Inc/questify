<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useQuest } from '~/composables/useQuest'

const route = useRoute()
const id = route.params.id as string

const { data: quest, refresh, pending, error } = await useQuest(id)

const { user } = useUserSession()

// ✅ unwrap safely with null fallback
const questData = computed(() => quest.value ?? null)
const userData = computed(() => user.value ?? null)

const isOwner = computed(() => {
  if (!questData.value || !userData.value) {
    return false
  }

  return questData.value.ownerId === userData.value.id
})

const tasksLoading = computed(() => {
  if (!questData.value) {
    return false
  }

  const tasks = questData.value.tasks ?? []

  return questData.value.status === 'draft' && tasks.length === 0
})

// Error handling
const errorType = computed(() => {
  if (!error.value) return null
  if (error.value.statusCode === 404) {
    return 'not-found'
  }
  else if (error.value.statusCode === 403 || error.value.statusCode === 401) {
    return 'unauthorized'
  }
  return 'unknown'
})

async function markTaskCompleted(taskId: string) {
  if (!isOwner.value) {
    return
  }

  await $fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: { status: 'completed' },
  })
  await refresh()
}

async function markTaskIncomplete(taskId: string) {
  if (!isOwner.value) {
    return
  }

  await $fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: { status: 'todo' },
  })
  await refresh()
}

async function completeQuest() {
  if (!isOwner.value) {
    return
  }

  await $fetch(`/api/quests/${id}`, {
    method: 'PATCH',
    body: { status: 'completed' },
  })
  await refresh()
}

async function reopenQuest() {
  if (!isOwner.value) {
    return
  }

  await $fetch(`/api/quests/${id}`, {
    method: 'PATCH',
    body: { status: 'active' },
  })
  await refresh()
}

onMounted(() => {
  const { pause, resume } = useIntervalFn(() => {
    refresh()
  }, 2000, { immediate: false })

  watch(tasksLoading, (loading: boolean) => {
    if (loading && !pending.value) resume()
    else pause()
  }, { immediate: true })
})
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

            <p
              v-if="!quest.goal && !quest.context && !quest.constraints"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              No additional details provided for this quest yet.
            </p>
          </v-card-text>
          <v-divider class="my-4" />

          <!-- Owner Information -->
          <div v-if="!isOwner">
            <v-card-text>
              <h3 class="text-h6 mb-2">
                Owner Information
              </h3>
              <p><strong>Name:</strong> {{ quest.owner.name }}</p>
            </v-card-text>
            <v-divider class="my-4" />
          </div>

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
                class="mr-2"
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
                    <template v-if="isOwner">
                      <v-btn
                        v-if="task.status !== 'completed'"
                        size="small"
                        color="success"
                        @click="markTaskCompleted(task.id)"
                      >
                        Complete
                      </v-btn>
                      <v-btn
                        v-else
                        size="small"
                        color="warning"
                        @click="markTaskIncomplete(task.id)"
                      >
                        Mark Incomplete
                      </v-btn>
                    </template>
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
                <template v-if="isOwner">
                  <v-btn
                    v-if="quest.status !== 'completed'"
                    block
                    color="success"
                    @click="completeQuest"
                  >
                    Mark as Completed
                  </v-btn>
                  <v-btn
                    v-else
                    block
                    color="warning"
                    @click="reopenQuest"
                  >
                    Reopen Quest
                  </v-btn>
                </template>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>

        <v-alert
          v-else-if="errorType === 'not-found'"
          type="error"
          title="Quest Not Found"
        >
          This quest does not exist.
        </v-alert>
        <v-alert
          v-else-if="errorType === 'unauthorized'"
          type="error"
          title="Unauthorized"
        >
          You are not authorized to view this quest.
        </v-alert>
        <v-alert
          v-else
          type="error"
          title="Error"
        >
          An unexpected error occurred. Please try again later.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>
