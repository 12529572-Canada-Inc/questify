<script setup lang="ts">
import type { QuestTaskSection, TaskWithInvestigations } from '~/types/quest-tasks'

const props = defineProps<{
  section: QuestTaskSection
  isOwner: boolean
  pending: boolean
  compactActions: boolean
  hideOwnerActions: boolean
  highlightedTaskId?: string | null
  expandedInvestigationId: string | null
  hasPendingInvestigation: (task: TaskWithInvestigations) => boolean
}>()

const emit = defineEmits<{
  (e: 'share-task', task: TaskWithInvestigations): void
  (e: 'investigate-task', task: TaskWithInvestigations): void
  (e: 'edit-task', task: TaskWithInvestigations): void
  (e: 'toggle-investigation', investigationId: string): void
}>()

function executeSectionAction(taskId: string) {
  props.section.action?.handler(taskId)
}
</script>

<template>
  <v-card
    variant="tonal"
    :color="section.color"
    class="elevation-0"
  >
    <v-card-title class="text-subtitle-1 font-weight-medium">
      {{ section.title }}
    </v-card-title>
    <v-divider />
    <div class="task-tab-content">
      <template v-if="section.tasks.length">
        <v-list
          lines="three"
          density="comfortable"
          class="py-0"
        >
          <QuestTaskListItem
            v-for="task in section.tasks"
            :key="task.id"
            :task="task"
            :section-completed="section.completed"
            :section-action="section.action ?? null"
            :is-owner="isOwner"
            :pending="pending"
            :compact-actions="compactActions"
            :hide-owner-actions="hideOwnerActions"
            :highlighted-task-id="highlightedTaskId"
            :has-pending-investigation="hasPendingInvestigation(task)"
            :expanded-investigation-id="expandedInvestigationId"
            @share-task="emit('share-task', $event)"
            @investigate-task="emit('investigate-task', $event)"
            @edit-task="emit('edit-task', $event)"
            @execute-section-action="executeSectionAction"
            @toggle-investigation="emit('toggle-investigation', $event)"
          />
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
</template>

<style scoped>
.task-tab-content {
  padding: 0;
}
</style>
