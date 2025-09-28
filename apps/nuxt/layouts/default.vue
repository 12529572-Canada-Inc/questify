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
      color="primary"
      dark
    >
      <v-toolbar-title>Questify 🎯</v-toolbar-title>
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
