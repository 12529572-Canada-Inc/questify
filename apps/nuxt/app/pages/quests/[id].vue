<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useQuest } from '~/composables/useQuest'
import { useQuestActions } from '~/composables/useQuestActions'
import { useQuestTaskTabs, useQuestTasks } from '~/composables/useQuestTasks'
import { useQuestTaskEditor } from '~/composables/useQuestTaskEditor'
import { useQuestInvestigations } from '~/composables/useQuestInvestigations'
import { useQuestShareDialog } from '~/composables/useQuestShareDialog'
import QuestDetailsCard from '~/components/quests/QuestDetailsCard.vue'
import QuestTaskEditDialog from '~/components/quests/QuestTaskEditDialog.vue'
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
          <QuestDetailsCard
            :quest="questData"
            :is-owner="isOwner"
            :quest-status-meta="questStatusMeta"
            :task-sections="taskSections"
            :task-tab="taskTab"
            :tasks-loading="tasksLoading"
            :pending="pending.value || false"
            :has-tasks="hasTasks"
            :investigating-task-ids="investigatingTaskIdsList"
            :highlighted-task-id="highlightedTaskId"
            :investigation-error="investigationError"
            @update:task-tab="value => (taskTab.value = value)"
            @share-quest="handleQuestShare"
            @open-task-edit="openTaskEditDialog"
            @open-investigation="openInvestigationDialog"
            @share-task="handleTaskShare"
            @clear-investigation-error="investigationError.value = null"
          >
            <template #after-tasks>
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
            </template>

            <template #actions>
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
            </template>
          </QuestDetailsCard>

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
