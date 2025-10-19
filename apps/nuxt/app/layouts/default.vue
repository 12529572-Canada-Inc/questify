<script setup lang="ts">
const { clear, loggedIn } = useUserSession()
const router = useRouter()
const requestUrl = useRequestURL()

const shareDialogOpen = ref(false)
const loginShareUrl = computed(() => new URL('/auth/login', requestUrl.origin).toString())

async function logout() {
  try {
    // Call your API logout endpoint
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    // Clear local session state (if you’re storing it via auth-utils)
    clear()

    // Redirect to login
    router.push('/auth/login')
  }
  catch (e) {
    console.error('Logout failed:', e)
  }
}
</script>

<template>
  <v-main>
    <v-app-bar
      app
      class="app-bar"
      density="comfortable"
      flat
    >
      <v-app-bar-title class="app-bar-title">
        <NuxtLink
          to="/"
          class="app-title-link"
          aria-label="Go to Questify home"
        >
          <v-img
            src="/logo.svg"
            alt="Questify logo"
            width="50"
            height="50"
            class="app-title-logo"
            cover
          />
          <span class="app-title-text">
            Questify
          </span>
        </NuxtLink>
      </v-app-bar-title>
      <div class="app-bar-actions">
        <v-btn
          class="app-bar-share-btn"
          variant="text"
          color="primary"
          aria-label="Share Questify"
          density="comfortable"
          @click="shareDialogOpen = true"
        >
          <v-icon
            icon="mdi-share-variant"
            size="20"
            class="app-bar-share-icon"
          />
          <span class="app-bar-share-label">
            Share App
          </span>
        </v-btn>

        <div class="app-bar-auth">
          <template v-if="loggedIn">
            <v-btn
              class="app-bar-auth__btn"
              variant="text"
              density="comfortable"
              @click="logout"
            >
              Logout
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              class="app-bar-auth__btn"
              variant="text"
              density="comfortable"
              to="/auth/login"
            >
              Login
            </v-btn>
            <v-btn
              class="app-bar-auth__btn"
              variant="text"
              density="comfortable"
              to="/auth/signup"
            >
              Signup
            </v-btn>
          </template>
        </div>
      </div>
    </v-app-bar>
    <slot />
    <ShareDialog
      v-model="shareDialogOpen"
      title="Share Questify"
      :share-url="loginShareUrl"
      description="Invite someone to Questify. The link opens the login page where they can sign in or create an account."
    />
  </v-main>
</template>

<style scoped>
.app-bar-title {
  overflow: visible;
  flex: 0 1 auto;
  padding: 0;
}

.app-title-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.app-title-logo {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
}

.app-title-text {
  font-weight: 700;
  font-size: clamp(1rem, 3.5vw, 1.3rem);
  white-space: nowrap;
}

.app-bar {
  padding-inline: clamp(12px, 3vw, 32px);
}

.app-bar :deep(.v-toolbar__content) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0;
}

.app-bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  min-width: 0;
}

.app-bar-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding-inline: 10px 14px;
}

.app-bar-share-icon {
  flex: 0 0 auto;
}

.app-bar-auth {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.app-bar-auth__btn {
  min-width: 0;
}

@media (max-width: 600px) {
  .app-title-logo {
    width: 2rem;
    height: 2rem;
  }

  .app-title-text {
    font-size: 1.05rem;
  }

  .app-bar :deep(.v-toolbar__content) {
    align-items: stretch;
  }

  .app-bar-actions {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }

  .app-bar-auth {
    flex: 1 1 auto;
    justify-content: flex-end;
    gap: 6px;
  }

  .app-bar-auth__btn {
    flex: 1 1 0;
  }
}

@media (max-width: 420px) {
  .app-bar-share-label {
    display: none;
  }

  .app-bar-share-btn {
    padding-inline: 10px;
  }

  .app-bar-actions {
    gap: 6px;
  }
}
</style>
