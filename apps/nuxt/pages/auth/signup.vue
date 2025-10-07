<script setup lang="ts">
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
    // Redirect to quest list after successful signup
    await useRouter().push('/quests')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Signup failed'
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
      <v-form
        v-model="valid"
        @submit.prevent="submit"
      >
        <v-text-field
          v-model="name"
          label="Name"
          required
          :rules="rules.name"
        />
        <v-text-field
          v-model="email"
          label="Email"
          required
          :rules="rules.email"
        />
        <v-text-field
          v-model="password"
          type="password"
          label="Password"
        />
        <v-btn
          type="submit"
          color="success"
          block
          class="mt-4"
          :loading="loading"
          :disabled="!valid || loading"
        >
          Create Account
        </v-btn>
        <v-btn
          variant="text"
          to="/auth/login"
        >
          Already have an account? Log in
        </v-btn>
        <v-alert
          v-if="error"
          type="error"
          class="mt-2"
        >
          {{ error }}
        </v-alert>
      </v-form>
    </v-card>
  </v-container>
</template>
