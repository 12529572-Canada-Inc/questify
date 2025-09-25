<script setup lang="ts">
import type { QuestsResponse } from '~/server/api/quests/index.get'

const { data: quests, pending, error } = await useFetch<QuestsResponse>('/api/quests')
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">
          Quests
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-if="pending"
        cols="12"
        class="text-center"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </v-col>
      <v-col
        v-else-if="error"
        cols="12"
        class="text-center"
      >
        <v-alert type="error">
          Failed to load quests
        </v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="quest in quests"
        :key="quest.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card>
          <v-card-title>{{ quest.title }}</v-card-title>
          <v-card-subtitle>{{ quest.status }}</v-card-subtitle>
          <v-card-text>{{ quest.description }}</v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/quests/${quest.id}`"
            >
              View
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        class="text-center mt-4"
      >
        <v-btn
          color="success"
          :to="`/quests/new`"
        >
          Create New Quest
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
