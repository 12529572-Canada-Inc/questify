<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const description = ref('')
const userId = ref('') // For now, manually enter or use a fixed test user

const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  loading.value = true
  error.value = null

  try {
    const res = await $fetch('/api/quests', {
      method: 'POST',
      body: { title: title.value, description: description.value, userId: userId.value }
    })

    if (res.success) {
      router.push('/quests')
    } else {
      error.value = 'Failed to create quest'
    }
  } catch (e: any) {
    error.value = e.message || 'Error creating quest'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Create a New Quest</h1>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block mb-1 font-medium">Title</label>
        <input
          v-model="title"
          type="text"
          class="w-full p-2 border rounded"
          placeholder="Climb Mt. Everest"
          required
        />
      </div>

      <div>
        <label class="block mb-1 font-medium">Description</label>
        <textarea
          v-model="description"
          class="w-full p-2 border rounded"
          placeholder="Prepare, train, and conquer the summit!"
        />
      </div>

      <div>
        <label class="block mb-1 font-medium">User ID</label>
        <input
          v-model="userId"
          type="text"
          class="w-full p-2 border rounded"
          placeholder="Paste your userId here (e.g., from seed)"
          required
        />
        <p class="text-sm text-gray-500 mt-1">
          Tip: Use the <code>id</code> from <code>test@example.com</code> in the seed data.
        </p>
      </div>

      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        :disabled="loading"
      >
        <span v-if="loading">Creating...</span>
        <span v-else>Create Quest</span>
      </button>

      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </form>
  </div>
</template>
