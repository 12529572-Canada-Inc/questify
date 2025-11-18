<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <v-container class="py-6">
    <h1 class="text-h5 font-weight-bold mb-4">
      Completed Tasks
    </h1>
    <p class="text-body-1 mb-2">
      Tasks you've finished across your quests.
    </p>
    <p class="text-body-2 text-medium-emphasis">
      TODO: Implement filtered task list showing only completed tasks.
    </p>
  </v-container>
</template>
