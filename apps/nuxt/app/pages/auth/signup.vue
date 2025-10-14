<script setup lang="ts">
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const rules = {
  name: [(v: string) => !!v || 'Name is required'],
  email: [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
  ],
  password: [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
  ],
}

async function submit() {
  loading.value = true
  error.value = null

  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email: email.value, password: password.value, name: name.value },
    })
    await router.push('/quests')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Signup failed'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthFormCard
    v-model:valid="valid"
    title="Sign Up"
    submit-label="Create Account"
    submit-color="success"
    :loading="loading"
    :error="error"
    switch-label="Already have an account? Log in"
    switch-to="/auth/login"
    @submit="submit"
  >
    <v-text-field
      v-model="name"
      label="Name"
      required
      class="mb-2"
      :rules="rules.name"
    />
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
