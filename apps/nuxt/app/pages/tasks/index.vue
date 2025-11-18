<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <v-container class="py-6">
    <h1 class="text-h5 font-weight-bold mb-4">
      All Tasks
    </h1>
    <p class="text-body-1 mb-2">
      Task inventory across all your quests.
    </p>
    <p class="text-body-2 text-medium-emphasis">
      TODO: Implement task list with filters (status, quest, priority).
    </p>
  </v-container>
</template>
