<script setup lang="ts">
const { clear, loggedIn } = useUserSession()
const router = useRouter()

async function logout() {
  try {
    // Call your API logout endpoint
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    // Clear local session state (if you’re storing it via auth-utils)
    clear()

    // Redirect to login
    router.push('/auth/login')
  }
  catch (e) {
    console.error('Logout failed:', e)
  }
}
</script>

<template>
  <v-main>
    <v-app-bar app>
      <v-app-bar-title class="app-bar-title">
        <NuxtLink
          to="/"
          class="app-title-link"
          aria-label="Go to Questify home"
        >
          <v-img
            src="/logo.svg"
            alt="Questify logo"
            width="50"
            height="50"
            class="app-title-logo"
            cover
          />
          <span class="app-title-text">
            Questify
          </span>
        </NuxtLink>
      </v-app-bar-title>
      <v-spacer />

      <template v-if="loggedIn">
        <v-btn
          text
          @click="logout"
        >
          Logout
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          text
          to="/auth/login"
        >
          Login
        </v-btn>
        <v-btn
          text
          to="/auth/signup"
        >
          Signup
        </v-btn>
      </template>
    </v-app-bar>
    <slot />
  </v-main>
</template>

<style scoped>
.app-bar-title {
  overflow: visible;
  flex: 0 1 auto;
  padding: 0;
}

.app-title-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.app-title-logo {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
}

.app-title-text {
  font-weight: 700;
  font-size: clamp(1rem, 3.5vw, 1.3rem);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .app-title-logo {
    width: 2rem;
    height: 2rem;
  }

  .app-title-text {
    font-size: 1.05rem;
  }
}
</style>
