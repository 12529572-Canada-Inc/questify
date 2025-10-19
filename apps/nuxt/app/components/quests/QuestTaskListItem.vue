<script setup lang="ts">
import { computed } from 'vue'
import QuestTaskActions from './QuestTaskActions.vue'
import QuestTaskInvestigations from './QuestTaskInvestigations.vue'
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
  (
    e: 'share-task' | 'investigate-task' | 'edit-task',
    task: TaskWithInvestigations
  ): void
  (
    e: 'execute-section-action' | 'toggle-investigation',
    taskOrInvestigationId: string
  ): void
}>()

const isHighlighted = computed(() => props.highlightedTaskId === props.task.id)

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

        <QuestTaskActions
          v-if="compactActions"
          :task="task"
          :is-owner="isOwner"
          :pending="pending"
          :compact="true"
          :hide-owner-actions="hideOwnerActions"
          :has-pending-investigation="hasPendingInvestigation"
          :section-action="sectionAction ?? null"
          @share-task="emit('share-task', $event)"
          @investigate-task="emit('investigate-task', $event)"
          @edit-task="emit('edit-task', $event)"
          @execute-section-action="emit('execute-section-action', $event)"
        />

        <QuestTaskInvestigations
          :task="task"
          :expanded-investigation-id="expandedInvestigationId"
          @toggle="toggleInvestigation"
        />
      </div>
    </template>
    <template #append>
      <QuestTaskActions
        v-if="!compactActions"
        :task="task"
        :is-owner="isOwner"
        :pending="pending"
        :compact="false"
        :hide-owner-actions="hideOwnerActions"
        :has-pending-investigation="hasPendingInvestigation"
        :section-action="sectionAction ?? null"
        @share-task="emit('share-task', $event)"
        @investigate-task="emit('investigate-task', $event)"
        @edit-task="emit('edit-task', $event)"
        @execute-section-action="emit('execute-section-action', $event)"
      />
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
</style>
