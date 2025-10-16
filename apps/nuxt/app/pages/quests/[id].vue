<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useQuest } from '~/composables/useQuest'
import { useQuestActions } from '~/composables/useQuestActions'
import { useQuestTaskTabs, useQuestTasks } from '~/composables/useQuestTasks'

const route = useRoute()
const id = route.params.id as string

const { data: quest, refresh, pending, error } = await useQuest(id)
const { user } = useUserSession()

const questData = computed(() => quest.value ?? null)
const userData = computed(() => user.value ?? null)

const isOwner = computed(() => {
  if (!questData.value || !userData.value) {
    return false
  }

  return questData.value.ownerId === userData.value.id
})

const { tasksLoading, todoTasks, completedTasks, hasTasks } = useQuestTasks(questData)
const { taskTab } = useQuestTaskTabs(todoTasks, completedTasks)

const { markTaskCompleted, markTaskIncomplete, completeQuest, reopenQuest } = useQuestActions({
  questId: id,
  refresh,
  isOwner,
})

const questStatusMeta = computed(() => {
  const status = questData.value?.status ?? 'draft'
  const base = {
    label: 'Draft',
    icon: 'mdi-pencil-circle',
    color: 'secondary',
  }

  const map: Record<string, typeof base> = {
    draft: base,
    active: {
      label: 'Active',
      icon: 'mdi-timer-sand',
      color: 'primary',
    },
    completed: {
      label: 'Completed',
      icon: 'mdi-check-circle',
      color: 'success',
    },
    failed: {
      label: 'Failed',
      icon: 'mdi-alert-octagon',
      color: 'error',
    },
  }

  return map[status] ?? base
})

const taskSections = computed(() => [
  {
    value: 'todo' as const,
    title: 'To Do',
    color: 'primary',
    emptyMessage: 'All tasks are completed!',
    tasks: todoTasks.value,
    completed: false,
    action: isOwner.value
      ? {
          label: 'Complete',
          color: 'success',
          handler: markTaskCompleted,
        }
      : null,
  },
  {
    value: 'completed' as const,
    title: 'Completed',
    color: 'success',
    emptyMessage: 'No tasks have been completed yet.',
    tasks: completedTasks.value,
    completed: true,
    action: isOwner.value
      ? {
          label: 'Mark Incomplete',
          color: 'warning',
          handler: markTaskIncomplete,
        }
      : null,
  },
])

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
          <v-card-title class="py-4">
            <div class="quest-header d-flex align-center gap-3 flex-wrap">
              <v-tooltip
                location="bottom"
                :text="questStatusMeta.label"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-avatar
                    v-bind="tooltipProps"
                    size="48"
                    variant="flat"
                    :color="questStatusMeta.color"
                    class="quest-status-avatar elevation-2"
                  >
                    <v-icon
                      :icon="questStatusMeta.icon"
                      color="white"
                      size="28"
                    />
                  </v-avatar>
                </template>
              </v-tooltip>

              <div class="d-flex flex-column gap-2">
                <div class="d-flex align-center gap-3 flex-wrap">
                  <span class="text-h5 font-weight-medium text-truncate">
                    {{ questData.title }}
                  </span>
                  <v-chip
                    size="small"
                    :color="questStatusMeta.color"
                    variant="tonal"
                    :prepend-icon="questStatusMeta.icon"
                    class="quest-status-chip text-uppercase font-weight-medium"
                  >
                    {{ questStatusMeta.label }}
                  </v-chip>
                </div>
                <div class="d-flex align-center gap-2 text-medium-emphasis text-body-2 flex-wrap">
                  <v-icon
                    icon="mdi-account"
                    size="18"
                  />
                  <span>{{ questData.owner?.name ?? 'Unknown owner' }}</span>
                </div>
              </div>
            </div>
          </v-card-title>
          <v-card-text class="d-flex flex-column gap-4">
            <QuestDetailsSections :quest="questData" />
          </v-card-text>
          <v-divider class="my-4" />

          <v-card-text>
            <QuestTasksTabs
              v-model="taskTab"
              :sections="taskSections"
              :pending="pending.value || false"
              :tasks-loading="tasksLoading"
              :is-owner="isOwner"
              :has-tasks="hasTasks"
            />
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
.quest-header {
  min-width: 0;
}

.quest-status-avatar {
  border-radius: 12px;
}

.quest-status-chip {
  letter-spacing: 0.05em;
}
</style>
