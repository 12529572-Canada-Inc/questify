<script setup lang="ts">
import { computed } from 'vue'
import type { Quest } from '@prisma/client'

const props = defineProps<{
  quests: Quest[]
  currentUserId?: string | null
}>()

const emit = defineEmits<{
  (e: 'delete-quest', quest: Quest): void
}>()

function handleDelete(quest: Quest) {
  emit('delete-quest', quest)
}

const currentUserId = computed(() => props.currentUserId ?? null)
</script>

<template>
  <v-row>
    <v-col
      v-for="quest in quests"
      :key="quest.id"
      cols="12"
      sm="6"
      md="4"
    >
      <QuestCard
        :quest="quest"
        :current-user-id="currentUserId"
        @delete-quest="handleDelete"
      />
    </v-col>
  </v-row>
</template>
