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
    <v-app-bar
      app
    >
      <v-app-bar-title>
        Questify 🎯
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
