<script setup lang="ts">
const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function submit() {
  try {
    await signIn({ email: email.value, password: password.value })
    navigateTo('/quests')
  }
  catch {
    error.value = 'Login failed'
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
        label="Password"
        type="password"
      />
      <v-btn
        block
        color="primary"
        @click="submit"
      >
        Login
      </v-btn>
      <v-alert
        v-if="error"
        type="error"
      >
        {{ error }}
      </v-alert>
    </v-card>
    <v-btn
      variant="text"
      to="/auth/signup"
    >
      Don't have an account? Sign up
    </v-btn>
  </v-container>
</template>
