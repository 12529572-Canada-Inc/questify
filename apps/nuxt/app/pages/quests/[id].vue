<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import type { Task } from '@prisma/client'
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

const allTasks = computed<Task[]>(() => questData.value?.tasks ?? [])
const todoTasks = computed(() =>
  allTasks.value.filter(task => task.status !== 'completed'),
)
const completedTasks = computed(() =>
  allTasks.value.filter(task => task.status === 'completed'),
)
const hasTasks = computed(() => allTasks.value.length > 0)
const taskTab = ref<'todo' | 'completed'>('todo')

watch([todoTasks, completedTasks], ([todo, completed]) => {
  if (taskTab.value === 'todo' && !todo.length && completed.length) {
    taskTab.value = 'completed'
  }
  else if (taskTab.value === 'completed' && !completed.length && todo.length) {
    taskTab.value = 'todo'
  }
}, { immediate: true })

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

const taskSections = computed(() => [
  {
    value: 'todo' as const,
    title: 'To Do',
    color: 'primary',
    emptyMessage: 'All tasks are completed!',
    tasks: todoTasks.value,
    completed: false,
    action: {
      label: 'Complete',
      color: 'success',
      handler: markTaskCompleted,
    },
  },
  {
    value: 'completed' as const,
    title: 'Completed',
    color: 'success',
    emptyMessage: 'No tasks have been completed yet.',
    tasks: completedTasks.value,
    completed: true,
    action: {
      label: 'Mark Incomplete',
      color: 'warning',
      handler: markTaskIncomplete,
    },
  },
])

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
        <v-card v-if="questData">
          <v-card-title class="text-h5">
            {{ questData.title }}
          </v-card-title>
          <v-card-subtitle>Status: <strong>{{ questData.status }}</strong></v-card-subtitle>
          <v-card-text class="d-flex flex-column gap-4">
            <div v-if="questData.goal">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Desired Outcome
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="questData.goal"
              />
            </div>

            <div v-if="questData.context">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Context
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="questData.context"
              />
            </div>

            <div v-if="questData.constraints">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">
                Constraints & Preferences
              </h3>
              <TextWithLinks
                class="mb-0"
                tag="p"
                :text="questData.constraints"
              />
            </div>

            <p
              v-if="!questData.goal && !questData.context && !questData.constraints"
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
              <p><strong>Name:</strong> {{ questData.owner.name }}</p>
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
              <template v-if="hasTasks">
                <v-tabs
                  v-model="taskTab"
                  density="comfortable"
                  color="primary"
                >
                  <v-tab
                    v-for="section in taskSections"
                    :key="section.value"
                    :value="section.value"
                  >
                    {{ section.title }} ({{ section.tasks.length }})
                  </v-tab>
                </v-tabs>

                <v-tabs-window
                  v-model="taskTab"
                  class="mt-4"
                >
                  <v-tabs-window-item
                    v-for="section in taskSections"
                    :key="section.value"
                    :value="section.value"
                  >
                    <v-card
                      variant="tonal"
                      :color="section.color"
                      class="elevation-0"
                    >
                      <v-card-title class="text-subtitle-1 font-weight-medium">
                        {{ section.title }}
                      </v-card-title>
                      <v-divider />
                      <div class="pa-4 pt-0">
                        <template v-if="section.tasks.length">
                          <v-list
                            lines="three"
                            density="comfortable"
                            class="py-0"
                          >
                            <v-list-item
                              v-for="task in section.tasks"
                              :key="task.id"
                              class="py-3"
                            >
                              <template #title>
                                <span
                                  class="text-body-1 font-weight-medium"
                                  :class="section.completed ? ['text-medium-emphasis', 'task--completed'] : []"
                                >
                                  {{ task.title }}
                                </span>
                              </template>
                              <template #subtitle>
                                <div
                                  class="d-flex flex-column"
                                  style="gap: 4px;"
                                >
                                  <TextWithLinks
                                    v-if="task.details"
                                    :class="section.completed ? 'text-body-2 text-medium-emphasis task--completed' : 'text-body-2'"
                                    tag="div"
                                    :text="task.details"
                                  />
                                  <span
                                    class="text-body-2"
                                    :class="section.completed ? ['text-medium-emphasis', 'task--completed'] : 'text-medium-emphasis'"
                                  >
                                    Status: {{ task.status }}
                                  </span>
                                </div>
                              </template>
                              <template #append>
                                <v-btn
                                  v-if="isOwner"
                                  size="small"
                                  :color="section.action.color"
                                  variant="text"
                                  @click="section.action.handler(task.id)"
                                >
                                  {{ section.action.label }}
                                </v-btn>
                              </template>
                            </v-list-item>
                          </v-list>
                        </template>
                        <p
                          v-else
                          class="text-body-2 text-medium-emphasis mb-0"
                        >
                          {{ section.emptyMessage }}
                        </p>
                      </div>
                    </v-card>
                  </v-tabs-window-item>
                </v-tabs-window>
              </template>
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
                    v-if="questData.status !== 'completed'"
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

<style scoped>
.task--completed {
  text-decoration: line-through;
}
</style>
