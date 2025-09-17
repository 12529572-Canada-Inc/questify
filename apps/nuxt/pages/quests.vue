<script setup lang="ts">
const { data: quests, pending, error } = await useFetch('/api/quests')
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4">Quests</h1>

    <div v-if="pending" class="text-gray-500">Loading quests...</div>
    <div v-else-if="error" class="text-red-500">Failed to load quests</div>

    <div v-else>
      <div
        v-for="quest in quests"
        :key="quest.id"
        class="mb-6 p-4 border rounded-lg shadow-sm bg-white"
      >
        <h2 class="text-xl font-semibold">{{ quest.title }}</h2>
        <p class="text-gray-600 mb-2">{{ quest.description }}</p>
        <p class="text-sm text-gray-400">
          Owner: {{ quest.owner?.name || quest.owner?.email }}
        </p>

        <ul class="mt-3 list-disc pl-5 space-y-1">
          <li
            v-for="task in quest.tasks"
            :key="task.id"
            class="text-gray-700"
          >
            {{ task.order + 1 }}. {{ task.title }} —
            <span class="italic">{{ task.status }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
