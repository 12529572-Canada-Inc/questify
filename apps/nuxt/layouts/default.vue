<script setup lang="ts">
const { loggedIn } = useUserSession()
const router = useRouter()

async function logout() {
  await clearSession()
  router.push('/auth/login')
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
