<script setup lang="ts">
import { computed, ref } from 'vue'
import { useVModel } from '@vueuse/core'
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTab): void
  (e: 'edit-task' | 'investigate-task', task: TaskWithInvestigations): void
}>()

const taskTab = useVModel(props, 'modelValue', emit)
const investigatingIds = computed(() => new Set(props.investigatingTaskIds ?? []))
const expandedInvestigationId = ref<string | null>(null)

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
                          <div
                            v-if="task.investigations.length"
                            class="task-investigations"
                          >
                            <span class="text-caption text-medium-emphasis d-block">Investigations</span>
                            <div class="d-flex flex-column task-investigation-list">
                              <v-sheet
                                v-for="investigation in task.investigations"
                                :key="investigation.id"
                                class="task-investigation-sheet"
                                variant="tonal"
                              >
                                <div class="d-flex justify-space-between align-start gap-4">
                                  <div class="d-flex flex-column task-investigation-meta">
                                    <div class="d-flex align-center gap-2">
                                      <v-icon
                                        :icon="investigationStatusMeta[investigation.status as keyof typeof investigationStatusMeta]?.icon ?? 'mdi-help-circle-outline'"
                                        size="18"
                                      />
                                      <span class="text-body-2 font-weight-medium">
                                        {{ investigationStatusMeta[investigation.status as keyof typeof investigationStatusMeta]?.label ?? investigation.status }}
                                      </span>
                                    </div>
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

                                <div
                                  class="task-investigation-content"
                                  :class="{
                                    'task-investigation-content--collapsed': expandedInvestigationId !== investigation.id,
                                  }"
                                >
                                  <div
                                    v-if="investigation.prompt"
                                    class="task-investigation-section"
                                  >
                                    <span class="task-investigation-section__title">Context</span>
                                    <MarkdownBlock
                                      class="task-investigation-section__body"
                                      :content="investigation.prompt"
                                    />
                                  </div>
                                  <div
                                    v-if="investigation.summary"
                                    class="task-investigation-section"
                                  >
                                    <span class="task-investigation-section__title">Summary</span>
                                    <MarkdownBlock
                                      class="task-investigation-section__body"
                                      :content="investigation.summary"
                                    />
                                  </div>
                                  <div
                                    v-if="investigation.details"
                                    class="task-investigation-section"
                                  >
                                    <span class="task-investigation-section__title">Details</span>
                                    <MarkdownBlock
                                      class="task-investigation-section__body"
                                      :content="investigation.details"
                                    />
                                  </div>
                                </div>

                                <p
                                  v-if="investigation.status === 'failed' && investigation.error"
                                  class="text-body-2 text-error mt-3 mb-0"
                                >
                                  {{ investigation.error }}
                                </p>

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
                              </v-sheet>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template #append>
                        <div
                          v-if="isOwner"
                          class="d-flex align-center"
                          style="gap: 6px;"
                        >
                          <v-btn
                            variant="text"
                            density="comfortable"
                            size="small"
                            :disabled="hasPendingInvestigation(task) || pending"
                            :aria-label="`Investigate ${task.title}`"
                            @click="emit('investigate-task', task)"
                          >
                            <v-icon
                              icon="mdi-flask-outline"
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
                            icon="mdi-pencil"
                            variant="text"
                            density="comfortable"
                            size="small"
                            @click="emit('edit-task', task)"
                          />
                          <v-btn
                            v-if="section.action"
                            size="small"
                            :color="section.action.color"
                            variant="text"
                            @click="section.action.handler(task.id)"
                          >
                            {{ section.action.label }}
                          </v-btn>
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

.task-investigations {
  margin-top: 12px;
}

.task-investigation-sheet {
  padding: 12px;
  border-radius: 12px;
}

.task-investigation-list {
  gap: 8px;
  max-height: 320px;
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
</style>
