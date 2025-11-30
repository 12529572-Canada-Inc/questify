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
  min-height: 100vh;
  background: radial-gradient(
    circle at 16% 20%,
    rgba(var(--v-theme-primary), 0.12),
    rgba(var(--v-theme-surface), 0.94) 50%
  );
  background-color: rgb(var(--v-theme-background));
  background-size: 220% 220%;
  animation: gradientShift 18s ease infinite;
  transition: background-color 0.3s ease, background 0.3s ease;
}

:deep(body) {
  background-color: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  min-height: 100vh;
}

.v-card {
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-surface), 0.9);
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-outline, var(--v-theme-outline-variant)), 0.28);
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
