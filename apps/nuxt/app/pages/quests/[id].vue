<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useQuest } from '~/composables/useQuest'
import { useQuestActions } from '~/composables/useQuestActions'
import { useQuestTaskTabs, useQuestTasks, type TaskWithInvestigations } from '~/composables/useQuestTasks'

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

const { markTaskCompleted, markTaskIncomplete, updateTask, investigateTask, completeQuest, reopenQuest } = useQuestActions({
  questId: id,
  refresh,
  isOwner,
})

const taskEditDialogOpen = ref(false)
const taskEditSaving = ref(false)
const taskEditError = ref<string | null>(null)
const taskBeingEdited = ref<TaskWithInvestigations | null>(null)
const taskEditForm = ref({
  title: '',
  details: '',
  extraContent: '',
})
const investigationError = ref<string | null>(null)
const investigatingTaskIds = ref<Set<string>>(new Set())
const investigatingTaskIdsList = computed(() => Array.from(investigatingTaskIds.value))

function normalizeOptionalContent(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function pickString(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key]
  return typeof value === 'string' ? value : undefined
}

function resolveTaskUpdateError(err: unknown) {
  if (err && typeof err === 'object') {
    const maybeError = err as Record<string, unknown>
    const data = maybeError['data'] as Record<string, unknown> | undefined

    return (
      pickString(data, 'statusMessage')
      ?? pickString(data, 'statusText')
      ?? pickString(data, 'message')
      ?? pickString(maybeError, 'statusMessage')
      ?? pickString(maybeError, 'message')
      ?? 'Unable to update the task. Please try again.'
    )
  }

  return 'Unable to update the task. Please try again.'
}

function openTaskEditDialog(task: TaskWithInvestigations) {
  taskBeingEdited.value = task
  taskEditForm.value = {
    title: task.title,
    details: task.details ?? '',
    extraContent: task.extraContent ?? '',
  }
  taskEditError.value = null
  taskEditDialogOpen.value = true
}

function closeTaskEditDialog() {
  taskEditDialogOpen.value = false
}

async function saveTaskEdits() {
  if (!taskBeingEdited.value) {
    return
  }

  const title = taskEditForm.value.title.trim()

  if (!title) {
    taskEditError.value = 'Task title is required.'
    return
  }

  taskEditSaving.value = true
  taskEditError.value = null

  try {
    await updateTask(taskBeingEdited.value.id, {
      title,
      details: normalizeOptionalContent(taskEditForm.value.details),
      extraContent: normalizeOptionalContent(taskEditForm.value.extraContent),
    })
    taskEditDialogOpen.value = false
  }
  catch (err) {
    taskEditError.value = resolveTaskUpdateError(err)
  }
  finally {
    taskEditSaving.value = false
  }
}

async function startInvestigation(task: TaskWithInvestigations) {
  if (investigatingTaskIds.value.has(task.id)) {
    return
  }

  investigationError.value = null
  investigatingTaskIds.value.add(task.id)

  try {
    await investigateTask(task.id)
  }
  catch (err) {
    investigationError.value = resolveTaskUpdateError(err)
  }
  finally {
    investigatingTaskIds.value.delete(task.id)
  }
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

onMounted(() => {
  const { pause, resume } = useIntervalFn(() => {
    refresh()
  }, 2000, { immediate: false })

  watch(tasksLoading, (loading: boolean) => {
    if (loading && !pending.value) resume()
    else pause()
  }, { immediate: true })
})

watch(taskEditDialogOpen, (isOpen) => {
  if (!isOpen) {
    taskBeingEdited.value = null
    taskEditForm.value = {
      title: '',
      details: '',
      extraContent: '',
    }
    taskEditError.value = null
  }
})
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <v-card v-if="questData">
          <v-card-title class="py-4">
            <div class="quest-header d-flex align-center flex-wrap">
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
              @edit-task="openTaskEditDialog"
              @investigate-task="startInvestigation"
            />
            <v-dialog
              v-model="taskEditDialogOpen"
              max-width="640"
            >
              <v-card>
                <v-card-title class="text-h6">
                  Edit Task
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Update the task details or add extra content that helps track progress or results.
                  </p>
                  <v-text-field
                    v-model="taskEditForm.title"
                    label="Title"
                    :disabled="taskEditSaving"
                    autofocus
                    required
                  />
                  <v-textarea
                    v-model="taskEditForm.details"
                    label="Details"
                    :disabled="taskEditSaving"
                    auto-grow
                    rows="3"
                    hint="Optional. Provide additional guidance or notes for this task."
                    persistent-hint
                  />
                  <v-textarea
                    v-model="taskEditForm.extraContent"
                    label="Extra Content"
                    :disabled="taskEditSaving"
                    auto-grow
                    rows="4"
                    hint="Optional. Capture lists, findings, or resources generated while completing this task."
                    persistent-hint
                  />
                  <v-alert
                    v-if="taskEditError"
                    type="error"
                    variant="tonal"
                    class="mt-4"
                    :text="taskEditError"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    variant="text"
                    :disabled="taskEditSaving"
                    @click="closeTaskEditDialog"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    :loading="taskEditSaving"
                    @click="saveTaskEdits"
                  >
                    Save Changes
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
  gap: 16px;
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
</style>
