<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const email = ref('')
const password = ref('')

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const rules = {
  email: [(v: string) => !!v || 'Email is required'],
  password: [(v: string) => !!v || 'Password is required'],
}

async function submit() {
  loading.value = true
  error.value = null

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
      <v-form
        v-model="valid"
        @submit.prevent="submit"
      >
        <v-text-field
          v-model="email"
          label="Email"
          required
          class="mb-2"
          :rules="rules.email"
        />
        <v-text-field
          v-model="password"
          type="password"
          label="Password"
          required
          class="mb-2"
          :rules="rules.password"
        />
        <v-btn
          type="submit"
          color="primary"
          block
          class="mt-4 mb-2"
          :loading="loading"
          :disabled="!valid || loading"
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
      </v-form>
    </v-card>
  </v-container>
</template>
