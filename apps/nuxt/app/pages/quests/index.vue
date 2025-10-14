<script setup lang="ts">
import { useQuests } from '~/composables/useQuest'

const { data: quests } = await useQuests()

const questsList = computed(() => Array.isArray(quests.value) ? quests.value : [])
</script>

<template>
  <v-container class="py-6">
    <v-row
      justify="space-between"
      align="center"
      class="mb-4"
    >
      <v-col cols="auto">
        <h2 class="text-h5 font-weight-bold text-white">
          Quests
        </h2>
      </v-col>
      <v-col cols="auto">
        <v-btn :to="`/quests/new`">
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <QuestList :quests="questsList" />

    <v-btn
      color="primary"
      class="fab"
      icon="mdi-plus"
      :to="`/quests/new`"
    />
  </v-container>
</template>

<style scoped>
.fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  z-index: 1000;
}
</style>
