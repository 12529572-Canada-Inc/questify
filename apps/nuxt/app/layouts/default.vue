<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSnackbar } from '~/composables/useSnackbar'
import { useAccessControl } from '~/composables/useAccessControl'
import { useUserStore } from '~/stores/user'
import { useQuestStore } from '~/stores/quest'
import type { AppBarMenuItem } from '~/types/app-bar'

const userStore = useUserStore()
const questStore = useQuestStore()

const router = useRouter()
const requestUrl = useRequestURL()
const { showSnackbar } = useSnackbar()
const { isAdmin } = useAccessControl()

const { loggedIn, avatarUrl, user } = storeToRefs(userStore)

if (!loggedIn.value) {
  await userStore.fetchSession().catch(() => null)
}

const shareDialogOpen = ref(false)
const loginShareUrl = computed(() => new URL('/auth/login', requestUrl.origin).toString())
const homeRoute = computed(() => (loggedIn.value ? '/dashboard' : '/'))

const profileInitials = computed(() => {
  const name = user.value?.name?.trim()
  if (name) {
    return name.split(/\s+/).map(part => part[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'U'
  }
  const email = user.value?.email ?? ''
  return email ? email.charAt(0).toUpperCase() : 'U'
})

function openShareDialog() {
  shareDialogOpen.value = true
}

const menuItems = computed<AppBarMenuItem[]>(() => {
  const items: AppBarMenuItem[] = [
    {
      key: 'share',
      label: 'Share App',
      icon: 'mdi-share-variant',
      action: openShareDialog,
      dataTestId: 'app-bar-profile-menu-share',
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
      key: 'profile',
      label: 'Profile',
      icon: 'mdi-account-circle',
      to: '/profile',
      dataTestId: 'app-bar-profile-menu-profile',
    })
    items.push({
      key: 'logout',
      label: 'Logout',
      icon: 'mdi-logout',
      action: () => logout(),
      dataTestId: 'app-bar-profile-menu-logout',
      dividerBefore: true,
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

const userMenuItems = computed<AppBarMenuItem[]>(() =>
  menuItems.value.filter(item => !['login', 'signup'].includes(item.key)),
)

const guestMenuItems = computed<AppBarMenuItem[]>(() =>
  menuItems.value.filter(item => ['login', 'signup'].includes(item.key)),
)

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
      <AppBarMenu
        :logged-in="loggedIn"
        :avatar-url="avatarUrl"
        :profile-initials="profileInitials"
        :user-menu-items="userMenuItems"
        :guest-menu-items="guestMenuItems"
      />
    </v-app-bar>
    <slot />
    <ShareDialog
      v-model="shareDialogOpen"
      title="Share Questify"
      :share-url="loginShareUrl"
      description="Invite someone to Questify. The link opens the login page where they can sign in or create an account."
    />
    <SupportAssistant />
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
}
</style>
