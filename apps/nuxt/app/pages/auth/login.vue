<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'

const { fetch: refreshSession } = useUserSession()
const router = useRouter()
const { showSnackbar } = useSnackbar()

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
    showSnackbar('Welcome back! You are logged in.', { variant: 'success' })
    router.push('/quests')
  }
  catch (e) {
    const message = e instanceof Error ? e.message : 'Login failed'
    error.value = message
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthFormCard
    v-model:valid="valid"
    title="Login"
    submit-label="Login"
    submit-color="primary"
    :loading="loading"
    :error="error"
    switch-label="Don't have an account? Sign up"
    switch-to="/auth/signup"
    @submit="submit"
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
  </AuthFormCard>
</template>
