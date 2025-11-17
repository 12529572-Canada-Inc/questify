<script setup lang="ts">
import { computed } from 'vue'
import type { Quest } from '@prisma/client'

const props = defineProps<{
  quest: Quest
  currentUserId?: string | null
}>()

const emit = defineEmits<{
  (e: 'delete-quest', quest: Quest): void
}>()

const isOwner = computed(() => Boolean(props.currentUserId) && props.currentUserId === props.quest.ownerId)

const statusColor = computed(() => {
  switch (props.quest.status) {
    case 'completed':
      return 'success'
    case 'active':
      return 'primary'
    case 'failed':
      return 'error'
    case 'archived':
      return 'grey-darken-1'
    default:
      return 'secondary'
  }
})

const statusLabel = computed(() => props.quest.status.replace(/^\w/, match => match.toUpperCase()))

function requestDelete() {
  emit('delete-quest', props.quest)
}
</script>

<template>
  <v-card>
    <v-card-title class="card-header d-flex align-start justify-space-between flex-wrap gap-2">
      <div class="title-meta d-flex flex-column gap-1">
        <span class="quest-title text-subtitle-1 font-weight-medium">
          {{ quest.title }}
        </span>
        <v-chip
          size="small"
          class="text-uppercase font-weight-medium"
          :color="statusColor"
          variant="tonal"
        >
          {{ statusLabel }}
        </v-chip>
      </div>
      <v-btn
        v-if="isOwner"
        class="delete-btn"
        variant="text"
        color="error"
        prepend-icon="mdi-trash-can-outline"
        @click="requestDelete"
      >
        Delete
      </v-btn>
    </v-card-title>
    <v-card-text class="d-flex flex-column gap-2">
      <QuestDetailsSummary :quest="quest" />
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn :to="`/quests/${quest.id}`">
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.card-header {
  gap: 10px;
}

.title-meta {
  min-width: 0;
  flex: 1 1 auto;
}

.quest-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.delete-btn {
  flex-shrink: 0;
}
</style>
