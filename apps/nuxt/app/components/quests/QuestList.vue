<script setup lang="ts">
import type { Quest } from '@prisma/client'
import QuestCard from '~/components/quests/QuestCard.vue'

defineProps<{
  quests: Quest[]
}>()
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
      <QuestCard :quest="quest" />
    </v-col>
  </v-row>
</template>
