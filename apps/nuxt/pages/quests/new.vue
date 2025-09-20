<script setup lang="ts">
  import type { UsersResponse } from '~/server/api/users/index.get';
  import type { CreateQuestResponse } from '~/server/api/quests/index.post';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const title = ref('');
  const description = ref('');
  const userId = ref('');
  const users = ref<UsersResponse>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);

  onMounted(async () => {
    users.value = await $fetch<UsersResponse>('/api/users');
    if (users.value.length > 0) {
      userId.value = users.value[0].id; // default to first user
    }
  });

  async function submit() {
    loading.value = true;
    error.value = null;

    try {
      const res = await $fetch<CreateQuestResponse>('/api/quests', {
        method: 'POST',
        body: {
          title: title.value,
          description: description.value,
          userId: userId.value,
        },
      });

      if (res.success) {
        router.push('/quests');
      } else {
        error.value = 'Failed to create quest';
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message;
      } else {
        error.value = 'Error creating quest';
      }
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="p-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Create a New Quest</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block mb-1 font-medium">Title</label>
        <input v-model="title" type="text" class="w-full p-2 border rounded" required />
      </div>

      <div>
        <label class="block mb-1 font-medium">Description</label>
        <textarea v-model="description" class="w-full p-2 border rounded" />
      </div>

      <div>
        <label class="block mb-1 font-medium">Select User</label>
        <select v-model="userId" class="w-full p-2 border rounded">
          <option v-for="u in users" :key="u.id" :value="u.id">
            {{ u.name || u.email }}
          </option>
        </select>
      </div>

      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Create Quest</button>

      <p v-if="error" class="text-red-500 mt-2">
        {{ error }}
      </p>
    </form>
  </div>
</template>
