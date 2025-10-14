<script setup lang="ts">
import { useQuests } from '~/composables/useQuest'

const { data: quests } = await useQuests()

// ✅ Make sure it's always an array in templates
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
        <v-btn
          :to="`/quests/new`"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="quest in questsList"
        :key="quest.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-card-title>{{ quest.title }}</v-card-title>
          <v-card-text class="d-flex flex-column gap-2">
            <TextWithLinks
              v-if="!quest.goal && !quest.context && !quest.constraints"
              class="mb-0"
              tag="p"
              text="No additional details provided."
            />
            <p
              v-if="quest.goal"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              <strong>Goal:</strong>
              <TextWithLinks
                tag="span"
                :text="quest.goal"
              />
            </p>
            <p
              v-if="quest.context"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              <strong>Context:</strong>
              <TextWithLinks
                tag="span"
                :text="quest.context"
              />
            </p>
            <p
              v-if="quest.constraints"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              <strong>Constraints:</strong>
              <TextWithLinks
                tag="span"
                :text="quest.constraints"
              />
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn :to="`/quests/${quest.id}`">
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Floating Action Button (FAB) for mobile -->
    <v-btn
      color="primary"
      class="fab"
      icon="mdi-plus"
      :to="`/quests/new`"
    />
  </v-container>
</template>

<style scoped>
/* Floating Action Button positioning */
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
