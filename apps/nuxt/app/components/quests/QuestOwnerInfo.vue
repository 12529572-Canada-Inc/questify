<script setup lang="ts">
import type { User } from '@prisma/client'

defineProps<{
  owner: Pick<User, 'name'>
}>()
</script>

<template>
  <v-card-text>
    <h3 class="text-h6 mb-2">
      Owner Information
    </h3>
    <p><strong>Name:</strong> {{ owner.name }}</p>
  </v-card-text>
  <v-divider class="my-4" />
</template>
