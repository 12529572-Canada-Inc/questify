<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useQuest } from '~/composables/useQuest'
import { useQuestActions } from '~/composables/useQuestActions'
import { useQuestTaskTabs, useQuestTasks } from '~/composables/useQuestTasks'
import { useQuestTaskEditor } from '~/composables/useQuestTaskEditor'
import { useQuestInvestigations } from '~/composables/useQuestInvestigations'
import { useQuestShareDialog } from '~/composables/useQuestShareDialog'
import type { TaskWithInvestigations } from '~/types/quest-tasks'

const route = useRoute()
const id = route.params.id as string
const requestUrl = useRequestURL()

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

const todoTaskIds = computed(() => todoTasks.value.map(task => task.id))
const completedTaskIds = computed(() => completedTasks.value.map(task => task.id))

const { markTaskCompleted, markTaskIncomplete, updateTask, investigateTask, completeQuest, reopenQuest } = useQuestActions({
  questId: id,
  refresh,
  isOwner,
})

const questShareUrl = computed(() => new URL(`/quests/${id}`, requestUrl.origin).toString())

function buildTaskShareUrl(taskId: string) {
  return new URL(`/quests/${id}?task=${taskId}`, requestUrl.origin).toString()
}

const {
  shareDialogState,
  shareDialogVisible,
  openQuestShare: showQuestShareDialog,
  openTaskShare: showTaskShareDialog,
} = useQuestShareDialog(
  () => questShareUrl.value,
  (taskId: string) => buildTaskShareUrl(taskId),
)

const highlightedTaskId = computed(() => {
  const value = route.query.task
  return typeof value === 'string' && value.trim().length > 0 ? value : null
})

watch(
  [highlightedTaskId, () => tasksLoading.value, todoTaskIds, completedTaskIds],
  ([taskId, loading, todoIds, completedIds]) => {
    if (!taskId || loading) {
      return
    }

    if (todoIds.includes(taskId)) {
      taskTab.value = 'todo'
    }
    else if (completedIds.includes(taskId)) {
      taskTab.value = 'completed'
    }
  },
  { immediate: true },
)

const {
  taskEditDialogOpen,
  taskEditSaving,
  taskEditError,
  taskEditForm,
  isTaskEditDirty,
  openTaskEditDialog,
  closeTaskEditDialog,
  saveTaskEdits,
} = useQuestTaskEditor(updateTask)

const {
  investigationError,
  investigatingTaskIdsList,
  investigationDialogOpen,
  investigationDialogSubmitting,
  investigationDialogError,
  investigationPrompt,
  hasPendingInvestigations,
  openInvestigationDialog,
  closeInvestigationDialog,
  submitInvestigation,
} = useQuestInvestigations({
  investigateTask,
  todoTasks,
  completedTasks,
})

function handleQuestShare() {
  if (!questData.value) {
    return
  }

  showQuestShareDialog(questData.value.title)
}

function handleTaskShare(task: TaskWithInvestigations) {
  showTaskShareDialog(task.title, questData.value?.title, task.id)
}

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

const { pause: pauseRefresh, resume: resumeRefresh } = useIntervalFn(() => {
  refresh()
}, 2000, { immediate: false })

watch(
  () => [tasksLoading.value, hasPendingInvestigations.value, investigatingTaskIdsList.value.length] as const,
  ([loading, pendingInvestigations, activeInvestigations]) => {
    const shouldPoll = loading || pendingInvestigations || activeInvestigations > 0
    if (shouldPoll) resumeRefresh()
    else pauseRefresh()
  },
  { immediate: true },
)
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <template v-if="questData">
          <v-card>
            <v-card-title class="py-4">
              <div class="quest-header d-flex align-center flex-wrap justify-space-between">
                <div class="quest-header__info d-flex align-center flex-wrap">
                  <v-avatar
                    size="56"
                    class="quest-status-avatar elevation-2"
                    :image="'/quest.png'"
                  />
                  <div class="d-flex flex-column gap-2">
                    <div class="quest-title-row d-flex align-center flex-wrap">
                      <span class="quest-title text-h5 font-weight-medium text-truncate">
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
                    <template v-if="!isOwner">
                      <div class="d-flex align-center gap-2 text-medium-emphasis text-body-2 flex-wrap">
                        <v-icon
                          icon="mdi-account"
                          size="18"
                        />
                        <span>{{ questData.owner?.name ?? 'Unknown owner' }}</span>
                      </div>
                    </template>
                  </div>
                </div>
                <div class="quest-header__actions d-flex align-center gap-2">
                  <v-btn
                    variant="text"
                    color="primary"
                    prepend-icon="mdi-share-variant"
                    @click="handleQuestShare"
                  >
                    Share quest
                  </v-btn>
                </div>
              </div>
            </v-card-title>
            <v-card-text class="d-flex flex-column gap-4">
              <QuestDetailsSections :quest="questData" />
            </v-card-text>
            <v-divider class="my-4" />

            <v-card-text>
              <v-alert
                v-if="investigationError"
                type="error"
                variant="tonal"
                closable
                class="mb-4"
                @click:close="investigationError = null"
              >
                {{ investigationError }}
              </v-alert>
              <QuestTasksTabs
                v-model="taskTab"
                :sections="taskSections"
                :pending="pending.value || false"
                :tasks-loading="tasksLoading"
                :is-owner="isOwner"
                :has-tasks="hasTasks"
                :investigating-task-ids="investigatingTaskIdsList"
                :highlighted-task-id="highlightedTaskId"
                @edit-task="openTaskEditDialog"
                @investigate-task="openInvestigationDialog"
                @share-task="handleTaskShare"
              />
              <QuestTaskEditDialog
                v-model="taskEditDialogOpen"
                v-model:title="taskEditForm.title"
                v-model:details="taskEditForm.details"
                v-model:extra-content="taskEditForm.extraContent"
                :saving="taskEditSaving"
                :error="taskEditError"
                :is-dirty="isTaskEditDirty"
                @close="closeTaskEditDialog"
                @save="saveTaskEdits"
              />
              <v-dialog
                v-model="investigationDialogOpen"
                max-width="560"
              >
                <v-card>
                  <v-card-title class="text-h6">
                    Investigate Task
                  </v-card-title>
                  <v-card-text class="d-flex flex-column gap-4">
                    <div>
                      <p class="text-body-2 mb-2">
                        Provide additional context or questions for the Quest Agent to research.
                      </p>
                      <v-textarea
                        v-model="investigationPrompt"
                        label="Investigation context"
                        :disabled="investigationDialogSubmitting"
                        :error="investigationDialogError !== null"
                        auto-grow
                        rows="4"
                        maxlength="1000"
                        counter
                        hint="This will help generate insights or suggestions related to the task."
                        persistent-hint
                      />
                    </div>
                    <v-alert
                      v-if="investigationDialogError"
                      type="error"
                      variant="tonal"
                      :text="investigationDialogError"
                    />
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn
                      variant="text"
                      :disabled="investigationDialogSubmitting"
                      @click="closeInvestigationDialog"
                    >
                      Cancel
                    </v-btn>
                    <v-btn
                      color="primary"
                      :loading="investigationDialogSubmitting"
                      :disabled="investigationDialogError !== null || investigationPrompt.trim().length === 0"
                      @click="submitInvestigation"
                    >
                      Investigate
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
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

          <ShareDialog
            v-if="shareDialogState"
            v-model="shareDialogVisible"
            :title="shareDialogState.title"
            :description="shareDialogState.description"
            :share-url="shareDialogState.url"
          />
        </template>

        <v-alert
          v-else
          :type="errorType === 'unknown' ? 'error' : 'error'"
          :title="errorType === 'not-found' ? 'Quest Not Found' : errorType === 'unauthorized' ? 'Unauthorized' : errorType === 'unknown' ? 'Error' : 'Error'"
        >
          {{
            errorType === 'not-found'
              ? 'This quest does not exist.'
              : errorType === 'unauthorized'
                ? 'You are not authorized to view this quest.'
                : errorType === 'unknown'
                  ? 'An unexpected error occurred. Please try again later.'
                  : 'An unexpected error occurred. Please try again later.'
          }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.quest-header {
  min-width: 0;
  width: 100%;
  gap: 16px;
}

.quest-header__info {
  gap: 16px;
}

.quest-header__actions {
  flex: 0 0 auto;
}

.quest-status-avatar {
  border-radius: 16px;
}

.quest-status-chip {
  letter-spacing: 0.05em;
}

.quest-title-row {
  gap: 12px;
}

.quest-title {
  min-width: 0;
}

@media (max-width: 768px) {
  .quest-header {
    gap: 12px;
  }

  .quest-header__info {
    gap: 12px;
  }

  .quest-header__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .quest-header__actions :deep(.v-btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>
