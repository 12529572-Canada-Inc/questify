<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isOwner: boolean
  questStatus: string | null | undefined
}>()

const emit = defineEmits<{
  (e: 'complete-quest' | 'reopen-quest'): void
}>()

const showComplete = computed(() => props.isOwner && props.questStatus !== 'completed')
const showReopen = computed(() => props.isOwner && props.questStatus === 'completed')

function handleComplete() {
  emit('complete-quest')
}

function handleReopen() {
  emit('reopen-quest')
}
</script>

<template>
  <v-row
    class="w-100"
    dense
  >
    <v-col
      cols="12"
      sm="6"
    >
      <v-btn
        block
        color="primary"
        :to="'/quests'"
      >
        Back to Quests
      </v-btn>
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
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
  </v-row>
</template>
