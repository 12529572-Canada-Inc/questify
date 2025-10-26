<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuest } from '~/composables/useQuest'
import { useQuestActions } from '~/composables/useQuestActions'
import { useQuestTaskTabs, useQuestTasks } from '~/composables/useQuestTasks'
import { useQuestTaskEditor } from '~/composables/useQuestTaskEditor'
import { useQuestInvestigations } from '~/composables/useQuestInvestigations'
import { useQuestShareDialog } from '~/composables/useQuestShareDialog'
import { useQuestTaskHighlight } from '~/composables/useQuestTaskHighlight'
import { useQuestPolling } from '~/composables/useQuestPolling'
import { useQuestDisplay, useQuestErrorAlert } from '~/composables/useQuestDisplay'
import QuestDetailsCard from '~/components/quests/QuestDetailsCard.vue'
import QuestTaskEditDialog from '~/components/quests/QuestTaskEditDialog.vue'
import QuestInvestigationDialog from '~/components/quests/QuestInvestigationDialog.vue'
import QuestActionButtons from '~/components/quests/QuestActionButtons.vue'
import type { QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const id = route.params.id as string
const requestUrl = useRequestURL()

const { data: quest, refresh, pending, error } = await useQuest(id)
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

if (!user.value) {
  await userStore.fetchSession().catch(() => null)
}

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

useQuestTaskHighlight({
  taskTab,
  highlightedTaskId,
  tasksLoading,
  todoTaskIds,
  completedTaskIds,
})

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
  investigationModelType,
  investigationModelOptions,
  hasPendingInvestigations,
  openInvestigationDialog,
  closeInvestigationDialog,
  submitInvestigation,
} = useQuestInvestigations({
  investigateTask,
  todoTasks,
  completedTasks,
  questModelType: computed(() => questData.value?.modelType ?? null),
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

function handleVisibilityUpdate() {
  // Refresh quest data to reflect the updated visibility
  refresh()
}

const investigationErrorMessage = computed(() => investigationError.value ?? null)
const { questStatusMeta, taskSections } = useQuestDisplay({
  quest: questData,
  todoTasks,
  completedTasks,
  isOwner,
  markTaskCompleted,
  markTaskIncomplete,
})

const { questErrorAlert } = useQuestErrorAlert(computed(() => error.value ?? null))

useQuestPolling(refresh, {
  tasksLoading,
  hasPendingInvestigations,
  investigatingTaskIds: investigatingTaskIdsList,
})
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
            @update-visibility="handleVisibilityUpdate"
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
                v-model:model-type="investigationModelType"
                :models="investigationModelOptions"
                :submitting="investigationDialogSubmitting"
                :error="investigationDialogError"
                @cancel="closeInvestigationDialog"
                @submit="submitInvestigation"
              />
            </template>

            <template #actions>
              <QuestActionButtons
                :is-owner="isOwner"
                :quest-status="questData.status"
                @complete-quest="completeQuest"
                @reopen-quest="reopenQuest"
              />
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
          <div
            v-if="questErrorAlert"
            class="quest-error-banner"
            role="alert"
          >
            <strong>{{ questErrorAlert.title }}:</strong>
            {{ questErrorAlert.message }}
          </div>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.quest-error-banner {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 4px solid rgba(var(--v-theme-error), 0.85);
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
}

.quest-error-banner strong {
  font-weight: 600;
  margin-right: 4px;
}
</style>
