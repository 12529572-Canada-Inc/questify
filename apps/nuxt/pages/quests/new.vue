<script setup lang="ts">
import type { UsersResponse } from '~/server/api/users/index.get'
import type { CreateQuestResponse } from '~/server/api/quests/index.post'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const description = ref('')
const userId = ref('')
const users = ref<UsersResponse>([])

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  users.value = await $fetch<UsersResponse>('/api/users')
  if (users.value.length > 0) {
    userId.value = users.value[0].id // default to first user
  }
})

async function submit() {
  loading.value = true
  error.value = null

  try {
    const res = await $fetch<CreateQuestResponse>('/api/quests', {
      method: 'POST',
      body: {
        title: title.value,
        description: description.value,
        userId: userId.value,
      },
    })

    if (res.success) {
      router.push('/quests')
    }
    else {
      error.value = 'Failed to create quest'
    }
  }
  catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    }
    else {
      error.value = 'Error creating quest'
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-6">
      Create a New Quest
    </h1>

    <v-form
      v-model="valid"
      @submit.prevent="submit"
    >
      <v-text-field
        v-model="title"
        label="Quest Title"
        :rules="[v => !!v || 'Title is required']"
        required
      />

      <v-textarea
        v-model="description"
        label="Quest Description"
        :rules="[v => !!v || 'Description is required']"
        required
      />

      <v-btn
        type="submit"
        color="primary"
        class="mt-4"
        :disabled="!valid"
      >
        Create
      </v-btn>
    </v-form>
  </v-container>
</template>
