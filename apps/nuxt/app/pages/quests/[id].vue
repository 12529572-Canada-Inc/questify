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
import QuestInvestigationDialog from '~/components/quests/QuestInvestigationDialog.vue'
import type { QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'

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

function updateTaskTab(value: QuestTaskTab) {
  taskTab.value = value
}

function clearInvestigationError() {
  investigationError.value = null
}

const investigationErrorMessage = computed(() => investigationError.value ?? null)

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

const questErrorAlert = computed(() => {
  switch (errorType.value) {
    case 'not-found':
      return {
        type: 'error' as const,
        title: 'Quest Not Found',
        message: 'This quest does not exist.',
      }
    case 'unauthorized':
      return {
        type: 'error' as const,
        title: 'Unauthorized',
        message: 'You are not authorized to view this quest.',
      }
    case 'unknown':
      return {
        type: 'error' as const,
        title: 'Error',
        message: 'An unexpected error occurred. Please try again later.',
      }
    default:
      return null
  }
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
            :investigation-error="investigationErrorMessage"
            @update:task-tab="updateTaskTab"
            @share-quest="handleQuestShare"
            @open-task-edit="openTaskEditDialog"
            @open-investigation="openInvestigationDialog"
            @share-task="handleTaskShare"
            @clear-investigation-error="clearInvestigationError"
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
              <QuestInvestigationDialog
                v-model="investigationDialogOpen"
                v-model:prompt="investigationPrompt"
                :submitting="investigationDialogSubmitting"
                :error="investigationDialogError"
                @cancel="closeInvestigationDialog"
                @submit="submitInvestigation"
              />
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

        <template v-else>
          <v-alert
            v-if="questErrorAlert"
            :type="questErrorAlert.type"
            :title="questErrorAlert.title"
          >
            {{ questErrorAlert.message }}
          </v-alert>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>
