<script setup lang="ts">
import { useQuests } from '~/composables/useQuest'

const { data: quests } = await useQuests()
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col
        v-for="quest in quests"
        :key="quest.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-card-title>{{ quest.title }}</v-card-title>
          <v-card-text>
            <p>{{ quest.description }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn :to="`/quests/${quest.id}`">
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
