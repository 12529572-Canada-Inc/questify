<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <v-container class="py-6">
    <h1 class="text-h5 font-weight-bold mb-4">
      Completed Quests
    </h1>
    <p class="text-body-1 mb-2">
      Your finished achievements and archived adventures.
    </p>
    <p class="text-body-2 text-medium-emphasis">
      TODO: Implement filtered quest list showing quests marked completed.
    </p>
  </v-container>
</template>
