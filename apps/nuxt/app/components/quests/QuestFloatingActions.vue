<script setup lang="ts">
import { computed } from 'vue'
import { QUEST_STATUS, type QuestStatus } from '~/types/quest'
import QuestActionButtons from './QuestActionButtons.vue'

const props = defineProps<{
  isOwner: boolean
  questStatus: QuestStatus | string | null | undefined
}>()

const emit = defineEmits<{
  (e: 'complete' | 'reopen' | 'delete'): void
}>()

const hasVisibleActions = computed(() => props.isOwner || props.questStatus === QUEST_STATUS.completed)

function handleComplete() {
  emit('complete')
}

function handleReopen() {
  emit('reopen')
}

function handleDelete() {
  emit('delete')
}
</script>

<template>
  <v-slide-y-transition>
    <v-sheet
      v-if="hasVisibleActions"
      class="quest-floating-actions"
      elevation="2"
      rounded="lg"
    >
      <QuestActionButtons
        :is-owner="isOwner"
        :quest-status="questStatus"
        @complete-quest="handleComplete"
        @reopen-quest="handleReopen"
        @request-delete="handleDelete"
      />
    </v-sheet>
  </v-slide-y-transition>
</template>

<style scoped>
.quest-floating-actions {
  position: sticky;
  top: 88px;
  z-index: 8;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(var(--v-theme-surface), 0.95);
  border: 1px solid rgba(var(--v-theme-outline-variant, var(--v-theme-outline)), 0.24);
  backdrop-filter: blur(6px);
}

.quest-floating-actions :deep(.v-row) {
  margin: 0;
}

.quest-floating-actions :deep(.v-col) {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>
