<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuestStore } from '~/stores/quest'

const questStore = useQuestStore()
const { quests, loaded } = storeToRefs(questStore)

if (!loaded.value) {
  await questStore.fetchQuests().catch((error) => {
    console.error('Failed to load quests:', error)
  })
}

const questsList = computed(() => quests.value ?? [])
</script>

<template>
  <v-container class="py-6">
    <v-row class="quests-header mb-4">
      <v-col
        cols="12"
        sm="6"
        class="quests-header__title"
      >
        <h2 class="text-h5 font-weight-bold text-white mb-0">
          Quests
        </h2>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="quests-header__actions"
      >
        <v-btn
          color="primary"
          class="quests-header__create"
          :to="`/quests/new`"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <QuestList :quests="questsList" />

    <v-btn
      color="primary"
      class="fab"
      aria-label="Create quest"
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

.quests-header {
  align-items: center;
  row-gap: 12px;
}

.quests-header__actions {
  display: flex;
  justify-content: flex-end;
}

.quests-header__create {
  min-width: 0;
}

@media (max-width: 600px) {
  .quests-header__actions {
    justify-content: flex-start;
  }

  .quests-header__create {
    width: 100%;
  }
}
</style>
