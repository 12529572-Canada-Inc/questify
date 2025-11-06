<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AppBarMenuItem } from '~/types/app-bar'

const props = defineProps<{
  loggedIn: boolean
  avatarUrl?: string | null
  profileInitials: string
  userMenuItems: AppBarMenuItem[]
  guestMenuItems: AppBarMenuItem[]
}>()

const profileMenuOpen = ref(false)
const menuOpen = ref(false)
const router = useRouter()

watch(
  () => props.loggedIn,
  () => {
    profileMenuOpen.value = false
    menuOpen.value = false
  },
)

async function onMenuItemSelect(item: AppBarMenuItem) {
  profileMenuOpen.value = false
  menuOpen.value = false

  if (item.action) {
    await item.action()
  }

  if (item.to) {
    await router.push(item.to)
  }
}
</script>

<template>
  <div class="app-bar-controls">
    <div class="app-bar-auth">
      <template v-if="loggedIn">
        <v-menu
          v-model="profileMenuOpen"
          location="bottom end"
          :close-on-content-click="true"
          transition="scale-transition"
        >
          <template #activator="{ props: activatorProps }">
            <v-btn
              class="app-bar-profile-btn"
              variant="flat"
              color="primary"
              size="36"
              v-bind="activatorProps"
            >
              <template v-if="avatarUrl">
                <v-avatar>
                  <v-img
                    :src="avatarUrl"
                    alt="Profile avatar"
                    cover
                  />
                </v-avatar>
              </template>
              <template v-else>
                <span
                  class="app-bar-profile-initials"
                >
                  {{ profileInitials }}
                </span>
              </template>
            </v-btn>
          </template>
          <v-list
            density="comfortable"
            nav
            class="app-bar-profile-menu"
          >
            <template
              v-for="item in userMenuItems"
              :key="item.key"
            >
              <v-divider
                v-if="item.dividerBefore"
                :key="`${item.key}-divider`"
              />
              <v-list-item
                :prepend-icon="item.icon"
                :title="item.label"
                :data-testid="item.dataTestId"
                @click="onMenuItemSelect(item)"
              />
            </template>
          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn
          v-for="item in guestMenuItems"
          :key="item.key"
          class="app-bar-auth__btn"
          variant="text"
          density="comfortable"
          @click="onMenuItemSelect(item)"
        >
          {{ item.label }}
        </v-btn>
      </template>
    </div>
  </div>
</template>

<style scoped>
.app-bar-controls {
  display: flex;
  align-items: center;
  margin-left: auto;
  min-width: 0;
}

.app-bar-menu-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.app-bar-menu-list {
  min-width: 220px;
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

.app-bar-profile-btn {
  border-radius: 50%;
  min-width: 36px;
  height: 36px;
  margin-right: 15px;
}

.app-bar-profile-initials {
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.app-bar-profile-menu {
  min-width: 200px;
}
</style>
