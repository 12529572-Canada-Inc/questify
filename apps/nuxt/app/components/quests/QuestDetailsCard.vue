<script setup lang="ts">
import { computed } from 'vue'
import QuestDetailsSections from './QuestDetailsSections.vue'
import QuestTasksTabs from './QuestTasksTabs.vue'
import QuestVisibilityToggle from './QuestVisibilityToggle.vue'
import QuestImageGallery from './QuestImageGallery.vue'
import type { QuestTaskSection, QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'
import type { Quest } from '@prisma/client'
import { useAiModels } from '~/composables/useAiModels'

const props = defineProps<{
  quest: Quest & { owner?: { name?: string | null } | null }
  isOwner: boolean
  questStatusMeta: {
    label: string
    icon: string
    color: string
  }
  taskSections: QuestTaskSection[]
  taskTab: QuestTaskTab
  tasksLoading: boolean
  pending: boolean
  hasTasks: boolean
  investigatingTaskIds: string[]
  highlightedTaskId: string | null
  investigationError: string | null
}>()

const emit = defineEmits<{
  (e: 'update:taskTab', value: QuestTaskTab): void
  (e: 'share-quest' | 'clear-investigation-error' | 'update-visibility'): void
  (e: 'open-task-edit' | 'open-investigation' | 'share-task', task: TaskWithInvestigations): void
}>()

const taskTabModel = computed({
  get: () => props.taskTab,
  set: value => emit('update:taskTab', value),
})

function handleVisibilityUpdate() {
  emit('update-visibility')
}

const { findModelById } = useAiModels()
const questModel = computed(() => findModelById(props.quest.modelType))
</script>

<template>
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
                {{ quest.title }}
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
              <QuestVisibilityToggle
                v-if="isOwner"
                :is-public="quest.isPublic"
                :quest-id="quest.id"
                :disabled="pending"
                @update:is-public="handleVisibilityUpdate"
              />
              <v-tooltip
                v-if="questModel"
                :text="questModel.description"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-chip
                    v-bind="tooltipProps"
                    class="quest-model-chip text-capitalize"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-robot-outline"
                  >
                    {{ questModel.label }}
                  </v-chip>
                </template>
              </v-tooltip>
            </div>
            <template v-if="!isOwner">
              <div class="d-flex align-center gap-2 text-medium-emphasis text-body-2 flex-wrap">
                <v-icon
                  icon="mdi-account"
                  size="18"
                />
                <span>{{ quest.owner?.name ?? 'Unknown owner' }}</span>
              </div>
            </template>
          </div>
        </div>
        <div class="quest-header__actions d-flex align-center gap-2">
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-share-variant"
            @click="emit('share-quest')"
          >
            Share quest
          </v-btn>
        </div>
      </div>
    </v-card-title>
    <v-card-text class="d-flex flex-column gap-4">
      <QuestImageGallery
        v-if="quest.images && quest.images.length > 0"
        :images="quest.images"
      />
      <QuestDetailsSections :quest="quest" />
    </v-card-text>
    <v-divider class="my-4" />

    <v-card-text>
      <div
        v-if="investigationError"
        class="quest-investigation-error mb-4"
        role="alert"
      >
        <span>{{ investigationError }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="error"
          @click="emit('clear-investigation-error')"
        />
      </div>
      <QuestTasksTabs
        v-model="taskTabModel"
        :sections="taskSections"
        :pending="pending"
        :tasks-loading="tasksLoading"
        :is-owner="isOwner"
        :has-tasks="hasTasks"
        :investigating-task-ids="investigatingTaskIds"
        :highlighted-task-id="highlightedTaskId"
        @edit-task="emit('open-task-edit', $event)"
        @investigate-task="emit('open-investigation', $event)"
        @share-task="emit('share-task', $event)"
      />
      <slot name="after-tasks" />
    </v-card-text>
  </v-card>
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

.quest-investigation-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 4px solid rgba(var(--v-theme-error), 0.85);
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  font-size: 0.95rem;
}

.quest-status-chip {
  letter-spacing: 0.05em;
}

.quest-model-chip {
  font-weight: 500;
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
