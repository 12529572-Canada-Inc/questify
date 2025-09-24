<template>
  <v-container class="fill-height d-flex flex-column justify-center align-center">
    <v-card
      elevation="3"
      class="pa-6"
      max-width="600"
    >
      <v-card-title class="text-h4 font-weight-bold">
        Welcome to Questify 🎯
      </v-card-title>

      <v-card-text>
        <p>
          Create and track your quests powered by AI.
        </p>
      </v-card-text>

      <v-card-actions class="justify-center mt-4">
        <v-btn
          color="primary"
          to="/quests"
        >
          View Quests
        </v-btn>
        <v-btn
          color="success"
          to="/quests/new"
        >
          Create Quest
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
