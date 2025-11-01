import { storeToRefs } from 'pinia'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'
import { useSnackbar } from '~/composables/useSnackbar'

export default defineNuxtRouteMiddleware(async () => {
  if (typeof window === 'undefined') {
    return
  }

  const questStore = useQuestStore()
  const userStore = useUserStore()
  const { showSnackbar } = useSnackbar()

  const { hasQuests, loaded } = storeToRefs(questStore)
  const { loggedIn } = storeToRefs(userStore)

  if (!loggedIn.value) {
    await userStore.fetchSession().catch(() => null)
  }

  if (!loaded.value || !hasQuests.value) {
    try {
      await questStore.fetchQuests({ force: true })
    }
    catch (error) {
      console.error('Failed to load quests before redirect:', error)
      return
    }
  }

  if (!hasQuests.value) {
    showSnackbar('You need to create your first quest!', { variant: 'info' })
    return navigateTo('/quests/new', { replace: true })
  }
})
