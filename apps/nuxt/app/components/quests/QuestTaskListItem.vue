<script setup lang="ts">
import { computed } from 'vue'
import type { QuestTaskSectionAction, TaskWithInvestigations } from '~/types/quest-tasks'

const props = defineProps<{
  task: TaskWithInvestigations
  sectionCompleted: boolean
  sectionAction?: QuestTaskSectionAction | null
  isOwner: boolean
  pending: boolean
  compactActions: boolean
  hideOwnerActions: boolean
  highlightedTaskId?: string | null
  hasPendingInvestigation: boolean
  expandedInvestigationId: string | null
}>()

const emit = defineEmits<{
  (e: 'share-task', task: TaskWithInvestigations): void
  (e: 'investigate-task', task: TaskWithInvestigations): void
  (e: 'edit-task', task: TaskWithInvestigations): void
  (e: 'execute-section-action', taskId: string): void
  (e: 'toggle-investigation', investigationId: string): void
}>()

const isHighlighted = computed(() => props.highlightedTaskId === props.task.id)

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

function toggleInvestigation(investigationId: string) {
  emit('toggle-investigation', investigationId)
}
</script>

<template>
  <v-list-item
    :data-task-id="task.id"
    :class="[
      'py-3',
      'task-list-item',
      { 'task-list-item--highlighted': isHighlighted },
    ]"
  >
    <template #title>
      <span
        class="text-body-1 font-weight-medium"
        :class="sectionCompleted ? ['text-medium-emphasis', 'task--completed'] : []"
      >
        {{ task.title }}
      </span>
    </template>
    <template #subtitle>
      <div class="task-subtitle">
        <div class="task-subtitle__content">
          <TextWithLinks
            v-if="task.details"
            :class="sectionCompleted ? 'text-body-2 text-medium-emphasis task--completed' : 'text-body-2'"
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
                sectionCompleted ? 'text-medium-emphasis task--completed' : '',
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
              :disabled="hasPendingInvestigation || pending"
              @click="emit('investigate-task', task)"
            />
            <v-btn
              v-if="isOwner && task.status !== 'completed'"
              icon="mdi-pencil-outline"
              :aria-label="`Edit ${task.title}`"
              @click="emit('edit-task', task)"
            />
            <v-btn
              v-if="sectionAction"
              :icon="sectionAction.color === 'success' ? 'mdi-check' : 'mdi-undo'"
              :color="sectionAction.color"
              :aria-label="sectionAction.label"
              @click="emit('execute-section-action', task.id)"
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
                        color="warning"
                        density="comfortable"
                        label
                        variant="tonal"
                        class="task-investigation-pending"
                      >
                        <v-progress-linear
                          color="warning"
                          indeterminate
                          rounded
                          stream
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
                      @click="toggleInvestigation(investigation.id)"
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
                  :disabled="hasPendingInvestigation || pending"
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
              v-if="sectionAction && !hideOwnerActions"
              class="task-action-btn task-action-btn--primary"
              size="small"
              :color="sectionAction.color"
              variant="text"
              @click="emit('execute-section-action', task.id)"
            >
              {{ sectionAction.label }}
            </v-btn>
          </div>
        </template>
      </div>
    </template>
  </v-list-item>
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

.task-investigation-meta {
  gap: 6px;
}

.task-investigation-pending {
  font-weight: 500;
}

.task-investigation-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.task-investigation-content--collapsed {
  max-height: 160px;
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

.task-investigation-section__title {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.task-investigation-section__body {
  padding: 0.5rem 0;
  display: block;
  white-space: pre-line;
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

.task-list-item--highlighted {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-left: 3px solid rgba(var(--v-theme-primary), 0.65);
  border-radius: 12px;
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

.task-actions-mobile {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.task-actions-mobile__group {
  width: auto;
}

.task-investigations {
  margin-top: 12px;
}

.task-investigation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-investigation-sheet {
  padding: 8px;
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

@media (max-width: 600px) {
  .task-investigations {
    width: calc(100% - 8px);
    margin: 4px auto 0;
    border-radius: 6px;
    padding: 4px;
  }

  .task-investigation-sheet {
    padding: 4px;
    border-radius: 8px;
    width: 100%;
  }

  .task-investigations :deep(.v-card-title) {
    padding: 4px 6px;
  }

  .task-investigations :deep(.v-card-text) {
    padding: 6px;
  }

  .task-investigation-content {
    gap: 6px;
  }

  .task-investigation-section__body {
    padding: 0.25rem 0;
    border-radius: 4px;
  }

  .task-investigation-toggle {
    margin-top: 4px;
  }

  .task-investigation-sheet :deep(.v-card-item) {
    padding: 6px;
  }

  .task-investigation-list {
    padding: 0;
  }
}
</style>
