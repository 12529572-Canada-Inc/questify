<script setup lang="ts">
import QuestForm from '~/components/quests/QuestForm.vue'
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-row
      class="w-100"
      justify="center"
    >
      <v-col
        cols="12"
        sm="10"
        md="8"
        lg="6"
      >
        <v-card
          elevation="3"
          class="pa-6"
        >
          <v-card-title class="text-h5 text-md-h4 font-weight-bold mb-6 text-center">
            Create a New Quest
          </v-card-title>

          <QuestForm />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
