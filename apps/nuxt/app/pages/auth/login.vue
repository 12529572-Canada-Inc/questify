<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SUPPORTED_OAUTH_PROVIDERS, type OAuthProvider } from 'shared'
import { useSnackbar } from '~/composables/useSnackbar'
import { useOAuthFlash } from '~/composables/useOAuthFlash'
import { extractStatusCode, resolveApiError } from '~/utils/error'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const session = useUserSession()
const { showSnackbar } = useSnackbar()
const { consumeOAuthFlash } = useOAuthFlash()

const { loggedIn } = storeToRefs(userStore)

const email = ref('')
const password = ref('')
const activeProvider = ref<OAuthProvider | null>(null)

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const hasNavigatedAfterAuth = ref(false)

const rules = {
  email: [(v: string) => !!v || 'Email is required'],
  password: [(v: string) => !!v || 'Password is required'],
}

const redirectPath = computed(() => {
  const raw = route.query.redirectTo
  if (typeof raw === 'string' && raw.startsWith('/')) {
    return raw
  }
  return '/dashboard'
})

if (import.meta.client) {
  watch(() => route.query.oauthError, (value) => {
    if (typeof value !== 'string') {
      return
    }

    const providerLabel = providerLabels[value as OAuthProvider] ?? value
    showSnackbar(`Could not authenticate with ${providerLabel}. Please try again.`, { variant: 'error' })
  }, { immediate: true })

  watch(loggedIn, (value) => {
    if (value && !hasNavigatedAfterAuth.value) {
      hasNavigatedAfterAuth.value = true
      const flash = consumeOAuthFlash()
      if (flash) {
        const providerLabel = providerLabels[flash.provider] ?? flash.provider
        if (flash.action === 'linked') {
          showSnackbar(`${providerLabel} account linked successfully.`, { variant: 'success' })
        }
        else if (flash.action === 'created') {
          showSnackbar(`Welcome! Signed up with ${providerLabel}.`, { variant: 'success' })
        }
        else {
          showSnackbar(`Welcome back! Signed in with ${providerLabel}.`, { variant: 'success' })
        }
      }
      router.push(redirectPath.value)
    }
  }, { immediate: true })
}

async function submit() {
  loading.value = true
  error.value = null

  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await userStore.fetchSession()
    showSnackbar('Welcome back! You are logged in.', { variant: 'success' })
    hasNavigatedAfterAuth.value = true
    router.push(redirectPath.value)
  }
  catch (e) {
    const statusCode = extractStatusCode(e)
    const resolved = resolveApiError(e, 'Login failed')
    const message = statusCode === 401
      ? 'Invalid email or password.'
      : resolved

    error.value = message
    showSnackbar(message, { variant: 'error' })
  }
  finally {
    loading.value = false
  }
}

function startOAuth(provider: OAuthProvider) {
  activeProvider.value = provider
  try {
    session.openInPopup(`/api/auth/${provider}`)
  }
  finally {
    setTimeout(() => {
      if (activeProvider.value === provider) {
        activeProvider.value = null
      }
    }, 600)
  }
}

const providerLabels: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
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

    <template #secondary>
      <div class="auth-divider">
        <span>or</span>
      </div>
      <v-btn
        v-for="provider in SUPPORTED_OAUTH_PROVIDERS"
        :key="provider"
        class="auth-social-btn mb-2"
        variant="outlined"
        :loading="activeProvider === provider"
        block
        @click="startOAuth(provider)"
      >
        <v-icon
          :icon="provider === 'google' ? 'mdi-google' : 'mdi-facebook'"
          class="mr-2"
        />
        Continue with {{ providerLabels[provider] }}
      </v-btn>
    </template>
  </AuthFormCard>
</template>

<style scoped>
.auth-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  display: block;
  flex: 1 1;
  height: 1px;
  background-color: rgba(var(--v-theme-on-surface), 0.12);
}

.auth-social-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
