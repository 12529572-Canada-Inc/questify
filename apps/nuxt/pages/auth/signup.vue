<script setup lang="ts">
import { useAuth } from 'auth-utils'

const { signUp } = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function submit() {
  try {
    await signUp({ name: name.value, email: email.value, password: password.value })
    navigateTo('/quests')
  }
  catch {
    error.value = 'Sign up failed'
  }
}
</script>

<template>
  <v-container class="d-flex justify-center">
    <v-card
      class="pa-6"
      max-width="400"
    >
      <v-card-title>Sign Up</v-card-title>
      <v-text-field
        v-model="name"
        label="Name"
      />
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
        color="success"
        class="mt-4"
        @click="submit"
      >
        Create Account
      </v-btn>
      <v-alert
        v-if="error"
        type="error"
        class="mt-2"
      >
        {{ error }}
      </v-alert>
    </v-card>
    <v-btn
      variant="text"
      to="/auth/login"
    >
      Already have an account? Log in
    </v-btn>
  </v-container>
</template>
