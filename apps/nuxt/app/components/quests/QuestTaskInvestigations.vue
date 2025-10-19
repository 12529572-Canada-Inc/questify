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

const investigations = computed(() => props.task.investigations ?? [])
const hasInvestigations = computed(() => investigations.value.length > 0)

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
      <QuestTaskInvestigationList
        :investigations="investigations"
        :expanded-investigation-id="expandedInvestigationId"
        @toggle="toggleInvestigation"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.task-investigations {
  margin-top: 12px;
}

@media (max-width: 600px) {
  .task-investigations {
    width: calc(100% - 8px);
    margin: 4px auto 0;
    border-radius: 6px;
    padding: 4px;
  }
}
</style>
