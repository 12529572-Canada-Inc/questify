<template>
  <div class="p-6 text-center">
    <h1 class="text-3xl font-bold">Welcome to Questify 🎯</h1>
    <p class="mt-2 text-gray-600">
      Create and track your quests powered by AI.
    </p>

    <div class="mt-6 space-x-4">
      <NuxtLink to="/quests" class="px-4 py-2 bg-blue-600 text-white rounded">
        View Quests
      </NuxtLink>
      <NuxtLink
        to="/quests/new"
        class="px-4 py-2 bg-green-600 text-white rounded"
      >
        Create Quest
      </NuxtLink>
    </div>
  </div>
</template>
