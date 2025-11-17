<template>
  <v-app>
    <GlobalSnackbar />
    <div class="app-background d-flex flex-column fill-height">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </v-app>
</template>

<style scoped>
.app-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  min-height: 100vh;
}

.v-card {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.85);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
