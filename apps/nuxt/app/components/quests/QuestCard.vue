<script setup lang="ts">
import type { Quest } from '@prisma/client'

defineProps<{
  quest: Quest
}>()
</script>

<template>
  <v-card>
    <v-card-title>{{ quest.title }}</v-card-title>
    <v-card-text class="d-flex flex-column gap-2">
      <QuestDetailsSummary :quest="quest" />
    </v-card-text>
    <v-card-actions>
      <v-btn :to="`/quests/${quest.id}`">
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
