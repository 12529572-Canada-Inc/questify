<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useSnackbar } from '~/composables/useSnackbar'
import { useAccessControl } from '~/composables/useAccessControl'
import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'
import { useQuestStore } from '~/stores/quest'

const userStore = useUserStore()
const uiStore = useUiStore()
const questStore = useQuestStore()

const router = useRouter()
const requestUrl = useRequestURL()
const { showSnackbar } = useSnackbar()
const { isAdmin } = useAccessControl()

const { loggedIn } = storeToRefs(userStore)
const { isDarkMode } = storeToRefs(uiStore)
const { toggleTheme } = uiStore
const MOBILE_MENU_BREAKPOINT = 768

const isMobile = useMediaQuery(`(max-width: ${MOBILE_MENU_BREAKPOINT - 1}px)`)
const mobileMenuOpen = ref(false)

if (!loggedIn.value) {
  await userStore.fetchSession().catch(() => null)
}

const shareDialogOpen = ref(false)
const loginShareUrl = computed(() => new URL('/auth/login', requestUrl.origin).toString())
const homeRoute = computed(() => (loggedIn.value ? '/dashboard' : '/'))

watch(isMobile, (value) => {
  if (!value) {
    mobileMenuOpen.value = false
  }
})

type MobileMenuItem = {
  key: string
  label: string
  icon: string
  action?: () => Promise<void> | void
  to?: string
}

const mobileMenuItems = computed<MobileMenuItem[]>(() => {
  const items: MobileMenuItem[] = [
    {
      key: 'share',
      label: 'Share App',
      icon: 'mdi-share-variant',
      action: () => {
        shareDialogOpen.value = true
      },
    },
    {
      key: 'theme',
      label: `${isDarkMode.value ? 'Switch to Light' : 'Switch to Dark'}`,
      icon: isDarkMode.value ? 'mdi-weather-sunny' : 'mdi-weather-night',
      action: () => toggleTheme(),
    },
  ]

  if (isAdmin.value) {
    items.push({
      key: 'admin',
      label: 'Administration',
      icon: 'mdi-shield-crown',
      to: '/admin',
    })
  }

  if (loggedIn.value) {
    items.push({
      key: 'settings',
      label: 'Settings',
      icon: 'mdi-account-cog',
      to: '/settings',
    })
    items.push({
      key: 'logout',
      label: 'Logout',
      icon: 'mdi-logout',
      action: () => logout(),
    })
  }
  else {
    items.push(
      {
        key: 'login',
        label: 'Login',
        icon: 'mdi-login',
        to: '/auth/login',
      },
      {
        key: 'signup',
        label: 'Signup',
        icon: 'mdi-account-plus',
        to: '/auth/signup',
      },
    )
  }

  return items
})

async function handleMenuItemClick(item: MobileMenuItem) {
  mobileMenuOpen.value = false

  if (item.action) {
    await item.action()
  }

  if (item.to) {
    await router.push(item.to)
  }
}

async function logout() {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    await userStore.clearSession()
    questStore.reset()
    await router.push('/auth/login')
    showSnackbar('You have been logged out.', { variant: 'success' })
  }
  catch (e) {
    console.error('Logout failed:', e)
    showSnackbar('Logout failed. Please try again.', { variant: 'error' })
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
          :to="homeRoute"
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
      <div
        class="app-bar-actions"
        :class="{ 'app-bar-actions--hidden': isMobile }"
      >
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
        <v-btn
          class="app-bar-theme-btn"
          variant="text"
          color="primary"
          density="comfortable"
          aria-label="Toggle theme"
          @click="toggleTheme"
        >
          <v-icon
            :icon="isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            size="20"
            class="app-bar-theme-icon"
          />
          <span class="app-bar-theme-label">
            {{ isDarkMode ? 'Light' : 'Dark' }} Mode
          </span>
        </v-btn>
        <v-btn
          v-if="isAdmin"
          class="app-bar-admin-btn"
          variant="text"
          color="primary"
          density="comfortable"
          to="/admin"
        >
          <v-icon
            icon="mdi-shield-crown"
            size="20"
            class="app-bar-admin-icon"
          />
          <span class="app-bar-admin-label">
            Administration
          </span>
        </v-btn>

        <div class="app-bar-auth">
          <template v-if="loggedIn">
            <v-btn
              class="app-bar-auth__btn"
              variant="text"
              density="comfortable"
              to="/settings"
            >
              Settings
            </v-btn>
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
      <div
        class="app-bar-mobile-actions"
        :class="{ 'app-bar-mobile-actions--visible': isMobile }"
      >
        <v-menu
          v-model="mobileMenuOpen"
          class="app-bar-mobile-menu"
          max-width="280"
          :close-on-content-click="false"
          transition="scale-transition"
        >
          <template #activator="{ props: activatorProps }">
            <v-btn
              class="app-bar-menu-btn"
              icon
              variant="text"
              color="primary"
              aria-label="Open navigation menu"
              v-bind="activatorProps"
              :aria-expanded="mobileMenuOpen"
              aria-haspopup="menu"
              data-testid="app-bar-menu-button"
            >
              <v-icon icon="mdi-menu" />
            </v-btn>
          </template>
          <v-list
            class="app-bar-menu-list"
            density="comfortable"
            nav
            role="menu"
          >
            <v-list-item
              v-for="item in mobileMenuItems"
              :key="item.key"
              :prepend-icon="item.icon"
              :title="item.label"
              :data-testid="`app-bar-menu-item-${item.key}`"
              role="menuitem"
              @click="handleMenuItemClick(item)"
            />
          </v-list>
        </v-menu>
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
  position: relative;
  top: 5px;
  left: -5px;
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

.app-bar-mobile-actions {
  display: none;
  align-items: center;
  margin-left: auto;
}

.app-bar-actions--hidden {
  display: none;
}

.app-bar-mobile-actions--visible {
  display: flex;
}

.app-bar-menu-btn {
  width: 48px;
  height: 48px;
}

.app-bar-menu-list {
  min-width: 220px;
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

.app-bar-theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding-inline: 10px 14px;
}

.app-bar-theme-icon {
  flex: 0 0 auto;
}

.app-bar-admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding-inline: 10px 14px;
}

.app-bar-admin-icon {
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

@media (max-width: 767px) {
  .app-bar-actions {
    display: none;
  }

  .app-bar-mobile-actions {
    display: flex;
  }
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
