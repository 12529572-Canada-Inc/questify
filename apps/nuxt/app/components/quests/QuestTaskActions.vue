<script setup lang="ts">
import type { QuestTaskSectionAction, TaskWithInvestigations } from '~/types/quest-tasks'

const props = defineProps<{
  task: TaskWithInvestigations
  isOwner: boolean
  pending: boolean
  compact: boolean
  hideOwnerActions: boolean
  hasPendingInvestigation: boolean
  sectionAction?: QuestTaskSectionAction | null
}>()

const emit = defineEmits<{
  (
    e: 'share-task' | 'investigate-task' | 'edit-task',
    task: TaskWithInvestigations
  ): void
  (e: 'execute-section-action', taskId: string): void
}>()

function handleSectionAction() {
  if (!props.sectionAction) return
  emit('execute-section-action', props.task.id)
}
</script>

<template>
  <div>
    <template v-if="compact">
      <div class="task-actions-mobile">
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
            @click="handleSectionAction"
          />
        </v-btn-group>
      </div>
    </template>
    <template v-else>
      <div
        class="d-flex align-center task-actions"
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

        <template v-if="!hideOwnerActions && isOwner && task.status !== 'completed'">
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

        <v-btn
          v-if="sectionAction && !hideOwnerActions"
          class="task-action-btn task-action-btn--primary"
          size="small"
          :color="sectionAction.color"
          variant="text"
          @click="handleSectionAction"
        >
          {{ sectionAction.label }}
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.task-actions {
  gap: 6px;
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
</style>
