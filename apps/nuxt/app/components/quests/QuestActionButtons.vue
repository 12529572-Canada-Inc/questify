<script setup lang="ts">
import { QuestStatus } from '@prisma/client'
import { computed } from 'vue'

const props = defineProps<{
  isOwner: boolean
  questStatus: QuestStatus | string | null | undefined
}>()

const emit = defineEmits<{
  (e: 'complete-quest' | 'reopen-quest' | 'request-delete'): void
}>()

const showComplete = computed(() => props.isOwner && props.questStatus !== QuestStatus.completed && props.questStatus !== QuestStatus.archived)
const showReopen = computed(() => props.isOwner && props.questStatus === QuestStatus.completed)
const showDelete = computed(() => props.isOwner)

function handleComplete() {
  emit('complete-quest')
}

function handleReopen() {
  emit('reopen-quest')
}

function handleDelete() {
  emit('request-delete')
}
</script>

<template>
  <v-row
    class="w-100"
    dense
  >
    <v-col cols="12" sm="4">
      <v-btn
        block
        color="primary"
        :to="'/quests'"
      >
        Back to Quests
      </v-btn>
    </v-col>
    <v-col cols="12" sm="4">
      <template v-if="showComplete">
        <v-btn
          block
          color="success"
          @click="handleComplete"
        >
          Mark as Completed
        </v-btn>
      </template>
      <template v-else-if="showReopen">
        <v-btn
          block
          color="warning"
          @click="handleReopen"
        >
          Reopen Quest
        </v-btn>
      </template>
    </v-col>
    <v-col
      v-if="showDelete"
      cols="12"
      sm="4"
    >
      <v-btn
        block
        color="error"
        variant="outlined"
        prepend-icon="mdi-trash-can-outline"
        @click="handleDelete"
      >
        Delete / Archive
      </v-btn>
    </v-col>
  </v-row>
</template>
