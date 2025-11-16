<script setup lang="ts">
import { computed } from 'vue'
import QuestTaskActions from './QuestTaskActions.vue'
import QuestTaskInvestigations from './QuestTaskInvestigations.vue'
import type { QuestTaskSectionAction, TaskWithInvestigations } from '~/types/quest-tasks'

type CompactAction = {
  label: string
  icon: string
  handler: () => void
  disabled?: boolean
  color?: string
}

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
const compactActionItems = computed<CompactAction[]>(() => {
  const actions: CompactAction[] = [
    {
      label: 'Share task',
      icon: 'mdi-share-variant',
      handler: () => emit('share-task', props.task),
    },
  ]

  const canEdit = !props.hideOwnerActions && props.isOwner && props.task.status !== 'completed'
  if (canEdit) {
    actions.push({
      label: 'Investigate',
      icon: 'mdi-magnify',
      disabled: props.hasPendingInvestigation || props.pending,
      handler: () => emit('investigate-task', props.task),
    })
    actions.push({
      label: 'Edit task',
      icon: 'mdi-pencil-outline',
      handler: () => emit('edit-task', props.task),
    })
  }

  if (props.sectionAction && !props.hideOwnerActions) {
    actions.push({
      label: props.sectionAction.label,
      icon: props.sectionAction.color === 'success' ? 'mdi-check' : 'mdi-undo',
      color: props.sectionAction.color,
      handler: () => emit('execute-section-action', props.task.id),
    })
  }

  return actions
})

function toggleInvestigation(investigationId: string) {
  emit('toggle-investigation', investigationId)
}
</script>

<template>
  <QuestTaskListItemCompact
    v-if="compactActions"
    :highlighted="isHighlighted"
    :actions="compactActionItems"
    :task-id="task.id"
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
      <div class="task-subtitle task-subtitle--compact">
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
        <QuestTaskInvestigations
          :task="task"
          :expanded-investigation-id="expandedInvestigationId"
          @toggle="toggleInvestigation"
        />
      </div>
    </template>
  </QuestTaskListItemCompact>
  <v-list-item
    v-else
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

        <QuestTaskInvestigations
          :task="task"
          :expanded-investigation-id="expandedInvestigationId"
          @toggle="toggleInvestigation"
        />
      </div>
    </template>
    <template #append>
      <QuestTaskActions
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
  overflow-wrap: anywhere;
}

.task-subtitle__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-wrap: anywhere;
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

.task-subtitle--compact {
  gap: 12px;
}

.task-subtitle__content :deep(.twl-root) {
  display: block;
}

.task-extra-content__text {
  overflow-wrap: anywhere;
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
