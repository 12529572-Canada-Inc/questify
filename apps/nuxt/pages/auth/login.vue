<script setup lang="ts">
const { signIn, error } = useAuth()
const email = ref('')
const password = ref('')

async function submit() {
  const res = await signIn('credentials', { email: email.value, password: password.value })
  if (res?.ok) {
    navigateTo('/quests')
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
