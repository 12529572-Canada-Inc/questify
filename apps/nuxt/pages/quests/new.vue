<script setup lang="ts">
import type { CreateQuestResponse } from '~/server/api/quests/index.post'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const description = ref('')
const userId = ref('')

const valid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

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
  <v-card
    elevation="3"
    class="pa-6"
  >
    <v-card-title class="text-h4 font-weight-bold mb-6">
      Create a New Quest
    </v-card-title>

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
  </v-card>
</template>
