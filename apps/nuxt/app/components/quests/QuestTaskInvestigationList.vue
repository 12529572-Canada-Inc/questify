<script setup lang="ts">
import QuestTaskInvestigationItem from './QuestTaskInvestigationItem.vue'
import type { TaskInvestigationWithUser } from '~/types/quest-tasks'

const { investigations, expandedInvestigationId } = defineProps<{
  investigations: TaskInvestigationWithUser[]
  expandedInvestigationId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle', investigationId: string): void
}>()

function handleToggle(investigationId: string) {
  emit('toggle', investigationId)
}
</script>

<template>
  <v-list
    class="task-investigation-list"
    density="compact"
  >
    <v-list-item
      v-for="investigation in investigations"
      :key="investigation.id"
      class="pa-0"
    >
      <QuestTaskInvestigationItem
        :investigation="investigation"
        :expanded="expandedInvestigationId === investigation.id"
        @toggle="handleToggle"
      />
    </v-list-item>
  </v-list>
</template>

<style scoped>
.task-investigation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 600px) {
  .task-investigation-list {
    padding: 0;
  }
}
</style>
