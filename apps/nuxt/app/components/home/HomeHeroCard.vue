<template>
  <div class="d-flex justify-center align-center main-container">
    <v-card
      elevation="3"
      class="pa-6 text-center"
      max-width="600"
    >
      <v-card-title class="text-h5 text-md-h4 font-weight-bold justify-center">
        Welcome to Questify
      </v-card-title>

      <v-card-text>
        <p class="text-body-1">
          Create and track your quests powered by AI.
        </p>
      </v-card-text>

      <v-card-actions class="flex-column">
        <v-btn
          block
          color="primary"
          to="/quests"
        >
          View Quests
        </v-btn>
        <v-btn
          block
          color="success"
          to="/quests/new"
        >
          Create Quest
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style scoped>
.main-container {
  min-height: 100vh;
}
</style>
