<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function submit() {
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    router.push('/quests')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  }
}
</script>

<template>
  <v-container class="d-flex justify-center">
    <v-card
      class="pa-6"
      max-width="400"
    >
      <v-card-title>Login</v-card-title>
      <v-text-field
        v-model="email"
        label="Email"
      />
      <v-text-field
        v-model="password"
        type="password"
        label="Password"
      />
      <v-btn
        block
        color="primary"
        class="mt-4"
        @click="submit"
      >
        Login
      </v-btn>
      <v-btn
        variant="text"
        to="/auth/signup"
      >
        Don't have an account? Sign up
      </v-btn>
      <v-alert
        v-if="error"
        type="error"
      >
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>
