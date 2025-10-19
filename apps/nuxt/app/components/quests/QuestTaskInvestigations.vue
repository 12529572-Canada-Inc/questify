<script setup lang="ts">
import { computed } from 'vue'
import type { TaskWithInvestigations } from '~/types/quest-tasks'

const props = defineProps<{
  task: TaskWithInvestigations
  expandedInvestigationId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle', investigationId: string): void
}>()

const hasInvestigations = computed(() => props.task.investigations.length > 0)

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
  emit('toggle', investigationId)
}
</script>

<template>
  <v-card
    v-if="hasInvestigations"
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
</template>

<style scoped>
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
