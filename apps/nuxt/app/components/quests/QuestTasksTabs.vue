<script setup lang="ts">
import { computed, ref } from 'vue'
import { breakpointsVuetify, useBreakpoints, useVModel, useWindowSize } from '@vueuse/core'
import type { Task, TaskInvestigation, User } from '@prisma/client'

type TaskTab = 'todo' | 'completed'

type TaskInvestigationWithUser = TaskInvestigation & {
  initiatedBy: Pick<User, 'id' | 'name' | 'email'> | null
}

type TaskWithInvestigations = Task & {
  investigations: TaskInvestigationWithUser[]
}

type QuestTaskSectionAction = {
  label: string
  color: string
  handler: (taskId: string) => void
}

type QuestTaskSection = {
  value: TaskTab
  title: string
  color: string
  tasks: TaskWithInvestigations[]
  completed: boolean
  emptyMessage: string
  action?: QuestTaskSectionAction | null
}

const props = defineProps<{
  modelValue: TaskTab
  sections: QuestTaskSection[]
  pending: boolean
  tasksLoading: boolean
  isOwner: boolean
  hasTasks: boolean
  investigatingTaskIds?: string[]
  highlightedTaskId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTab): void
  (e: 'edit-task' | 'investigate-task' | 'share-task', task: TaskWithInvestigations): void
}>()

const taskTab = useVModel(props, 'modelValue', emit)
const investigatingIds = computed(() => new Set(props.investigatingTaskIds ?? []))
const expandedInvestigationId = ref<string | null>(null)
const highlightedTaskId = computed(() => props.highlightedTaskId ?? null)
const breakpoints = useBreakpoints(breakpointsVuetify)
const compactActions = breakpoints.smallerOrEqual('md')
const { width: windowWidth } = useWindowSize()
const hideOwnerActions = computed(() => windowWidth.value < 500)

const investigationStatusMeta = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: 'mdi-progress-clock',
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: 'mdi-check-circle',
  },
  failed: {
    label: 'Failed',
    color: 'error',
    icon: 'mdi-alert-circle',
  },
} as const

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatInvestigationDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return dateFormatter.format(date)
}

function hasPendingInvestigation(task: TaskWithInvestigations) {
  return task.investigations.some(inv => inv.status === 'pending')
    || investigatingIds.value.has(task.id)
}

function toggleInvestigationExpansion(investigationId: string) {
  expandedInvestigationId.value = expandedInvestigationId.value === investigationId
    ? null
    : investigationId
}
</script>

<template>
  <div>
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
            v-for="section in sections"
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
            v-for="section in sections"
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
                      :data-task-id="task.id"
                      :class="[
                        'py-3',
                        'task-list-item',
                        { 'task-list-item--highlighted': highlightedTaskId === task.id },
                      ]"
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
                        <div class="task-subtitle">
                          <div class="task-subtitle__content">
                            <TextWithLinks
                              v-if="task.details"
                              :class="section.completed ? 'text-body-2 text-medium-emphasis task--completed' : 'text-body-2'"
                              tag="div"
                              :text="task.details"
                            />
                            <div
                              v-if="task.extraContent"
                              class="task-extra-content"
                            >
                              <span class="text-caption text-medium-emphasis d-block">Extra content</span>
                              <TextWithLinks
                                :text="task.extraContent"
                                tag="div"
                                :class="[
                                  'text-body-2',
                                  'task-extra-content__text',
                                  section.completed ? 'text-medium-emphasis task--completed' : '',
                                ]"
                              />
                            </div>
                          </div>

                          <div
                            v-if="compactActions"
                            class="task-actions-mobile"
                          >
                            <v-btn-group
                              class="task-actions-mobile__group"
                              density="compact"
                              variant="tonal"
                              divided
                            >
                              <v-btn
                                icon="mdi-share-variant"
                                :aria-label="`Share ${task.title}`"
                                @click="emit('share-task', task)"
                              />
                              <v-btn
                                v-if="isOwner && task.status !== 'completed'"
                                icon="mdi-magnify"
                                :aria-label="`Investigate ${task.title}`"
                                :disabled="hasPendingInvestigation(task) || pending"
                                @click="emit('investigate-task', task)"
                              />
                              <v-btn
                                v-if="isOwner && task.status !== 'completed'"
                                icon="mdi-pencil-outline"
                                :aria-label="`Edit ${task.title}`"
                                @click="emit('edit-task', task)"
                              />
                              <v-btn
                                v-if="section.action"
                                :icon="section.action.color === 'success' ? 'mdi-check' : 'mdi-undo'"
                                :color="section.action.color"
                                :aria-label="section.action.label"
                                @click="section.action.handler(task.id)"
                              />
                            </v-btn-group>
                          </div>

                          <v-card
                            v-if="task.investigations.length"
                            class="task-investigations"
                            variant="outlined"
                          >
                            <v-card-title class="text-caption text-medium-emphasis">
                              Investigations
                            </v-card-title>
                            <v-divider />
                            <v-card-text>
                              <v-list
                                class="task-investigation-list"
                                density="compact"
                              >
                                <v-list-item
                                  v-for="investigation in task.investigations"
                                  :key="investigation.id"
                                  class="pa-0"
                                >
                                  <v-card
                                    class="task-investigation-sheet"
                                    variant="tonal"
                                  >
                                    <v-card-item>
                                      <div class="d-flex justify-space-between align-start gap-4">
                                        <div class="d-flex flex-column task-investigation-meta">
                                          <v-chip
                                            :color="investigationStatusMeta[investigation.status as keyof typeof investigationStatusMeta]?.color ?? 'default'"
                                            variant="tonal"
                                            size="small"
                                            class="font-weight-medium"
                                            :prepend-icon="investigationStatusMeta[investigation.status as keyof typeof investigationStatusMeta]?.icon ?? 'mdi-help-circle-outline'"
                                          >
                                            {{ investigationStatusMeta[investigation.status as keyof typeof investigationStatusMeta]?.label ?? investigation.status }}
                                          </v-chip>
                                          <span class="text-caption text-medium-emphasis">
                                            {{ formatInvestigationDate(investigation.createdAt) }}
                                            <template v-if="investigation.initiatedBy?.name">
                                              • {{ investigation.initiatedBy.name }}
                                            </template>
                                          </span>
                                        </div>
                                        <v-chip
                                          v-if="investigation.status === 'pending'"
                                          variant="outlined"
                                          size="small"
                                          color="warning"
                                        >
                                          <v-progress-circular
                                            indeterminate
                                            color="warning"
                                            size="14"
                                            width="2"
                                            class="mr-1"
                                          />
                                          In progress
                                        </v-chip>
                                      </div>
                                    </v-card-item>
                                    <v-card-text>
                                      <div
                                        class="task-investigation-content"
                                        :class="{
                                          'task-investigation-content--collapsed': expandedInvestigationId !== investigation.id,
                                        }"
                                      >
                                        <template v-if="expandedInvestigationId === investigation.id">
                                          <v-card
                                            v-if="investigation.prompt"
                                            class="mb-2"
                                            variant="text"
                                          >
                                            <v-card-title class="task-investigation-section__title">
                                              Context
                                            </v-card-title>
                                            <v-card-text class="task-investigation-section__body">
                                              <MarkdownBlock :content="investigation.prompt" />
                                            </v-card-text>
                                          </v-card>
                                          <v-card
                                            v-if="investigation.summary"
                                            class="mb-2"
                                            variant="text"
                                          >
                                            <v-card-title class="task-investigation-section__title">
                                              Summary
                                            </v-card-title>
                                            <v-card-text class="task-investigation-section__body">
                                              <MarkdownBlock :content="investigation.summary" />
                                            </v-card-text>
                                          </v-card>
                                          <v-card
                                            v-if="investigation.details"
                                            class="mb-2"
                                            variant="text"
                                          >
                                            <v-card-title class="task-investigation-section__title">
                                              Details
                                            </v-card-title>
                                            <v-card-text class="task-investigation-section__body">
                                              <MarkdownBlock :content="investigation.details" />
                                            </v-card-text>
                                          </v-card>
                                        </template>
                                        <template v-else>
                                          <v-card
                                            v-if="investigation.summary"
                                            class="mb-2"
                                            variant="text"
                                          >
                                            <v-card-title class="task-investigation-section__title">
                                              Summary
                                            </v-card-title>
                                            <v-card-text class="task-investigation-section__body">
                                              <MarkdownBlock :content="investigation.summary" />
                                            </v-card-text>
                                          </v-card>
                                        </template>
                                      </div>
                                      <v-alert
                                        v-if="investigation.status === 'failed' && investigation.error"
                                        type="error"
                                        class="mt-3 mb-0"
                                        density="compact"
                                        border="start"
                                      >
                                        {{ investigation.error }}
                                      </v-alert>
                                      <v-btn
                                        v-if="investigation.summary || investigation.details"
                                        variant="text"
                                        size="small"
                                        class="task-investigation-toggle mt-3"
                                        :append-icon="expandedInvestigationId === investigation.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                                        @click="toggleInvestigationExpansion(investigation.id)"
                                      >
                                        {{ expandedInvestigationId === investigation.id ? 'Show less' : 'View full investigation' }}
                                      </v-btn>
                                    </v-card-text>
                                  </v-card>
                                </v-list-item>
                              </v-list>
                            </v-card-text>
                          </v-card>
                        </div>
                      </template>
                      <template #append>
                        <div>
                          <template v-if="!compactActions">
                            <div
                              class="d-flex align-center task-actions"
                              style="gap: 6px;"
                            >
                              <v-btn
                                class="task-action-btn"
                                variant="text"
                                density="comfortable"
                                size="small"
                                :aria-label="`Share ${task.title}`"
                                @click="emit('share-task', task)"
                              >
                                <v-icon
                                  icon="mdi-share-variant"
                                  size="18"
                                />
                                <v-tooltip
                                  activator="parent"
                                  location="bottom"
                                >
                                  Share task
                                </v-tooltip>
                              </v-btn>

                              <template v-if="!hideOwnerActions && isOwner">
                                <template v-if="task.status !== 'completed'">
                                  <v-btn
                                    class="task-action-btn"
                                    variant="text"
                                    density="comfortable"
                                    size="small"
                                    :disabled="hasPendingInvestigation(task) || pending"
                                    :aria-label="`Investigate ${task.title}`"
                                    @click="emit('investigate-task', task)"
                                  >
                                    <v-icon
                                      icon="mdi-magnify"
                                      size="18"
                                    />
                                    <v-tooltip
                                      activator="parent"
                                      location="bottom"
                                    >
                                      Investigate task
                                    </v-tooltip>
                                  </v-btn>
                                  <v-btn
                                    class="task-action-btn"
                                    variant="text"
                                    density="comfortable"
                                    size="small"
                                    @click="emit('edit-task', task)"
                                  >
                                    <v-icon
                                      icon="mdi-pencil-outline"
                                      size="18"
                                    />
                                    <v-tooltip
                                      activator="parent"
                                      location="bottom"
                                    >
                                      Edit task
                                    </v-tooltip>
                                  </v-btn>
                                </template>
                              </template>

                              <v-btn
                                v-if="section.action && !hideOwnerActions"
                                class="task-action-btn task-action-btn--primary"
                                size="small"
                                :color="section.action.color"
                                variant="text"
                                @click="section.action.handler(task.id)"
                              >
                                {{ section.action.label }}
                              </v-btn>
                            </div>
                          </template>
                        </div>
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
  </div>
</template>

<style scoped>
.task--completed {
  text-decoration: line-through;
}

.task-extra-content {
  margin-top: 8px;
}

.task-extra-content__text {
  display: block;
  white-space: pre-line;
}

.task-subtitle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-subtitle__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-investigations {
  margin-top: 12px;
}

.task-investigation-sheet {
  padding: 12px;
  border-radius: 12px;
}

.task-investigation-list {
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
  scroll-behavior: smooth;
}

.task-investigation-meta {
  gap: 4px;
}

.task-investigation-list::-webkit-scrollbar {
  width: 6px;
}

.task-investigation-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 999px;
}

.task-investigation-content {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.task-investigation-section__title {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 4px;
}

.task-investigation-section__body {
  padding: 0.5rem 0;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.2);
}

.task-investigation-content--collapsed {
  max-height: 220px;
  overflow: hidden;
}

.task-investigation-content--collapsed::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-surface), 0) 0%,
    rgba(var(--v-theme-surface), 1) 100%
  );
  pointer-events: none;
}

.task-investigation-toggle {
  align-self: flex-start;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 0 0.25rem;
}

.task-list-item {
  align-items: flex-start;
  gap: 12px;
}

.task-list-item :deep(.v-list-item__content) {
  min-width: 0;
  flex: 1 1 auto;
}

.task-list-item :deep(.v-list-item__append) {
  display: flex;
  align-items: center;
}

.task-actions {
  min-width: 0;
}

.task-action-btn {
  min-width: 0;
  padding-inline: 6px;
}

.task-action-btn--primary {
  font-weight: 500;
}

.task-list-item--highlighted {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-left: 3px solid rgba(var(--v-theme-primary), 0.65);
  border-radius: 12px;
}

@media (max-width: 960px) {
  .task-list-item :deep(.v-list-item__append) {
    display: none;
  }

  .task-list-item {
    flex-direction: column;
    gap: 8px;
  }

  .task-list-item :deep(.v-list-item__content) {
    width: 100%;
  }

  .task-list-item :deep(.v-list-item__append) {
    width: 100%;
    justify-content: flex-end;
  }
}

.task-actions-mobile {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.task-actions-mobile__group {
  width: auto;
}
</style>
