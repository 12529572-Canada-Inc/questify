<template>
  <div class="p-6 text-center">
    <h1 class="text-3xl font-bold sm:text-4xl">
      Welcome to Questify 🎯
    </h1>
    <p class="mt-2 text-gray-600 text-base sm:text-lg">
      Create and track your quests powered by AI.
    </p>

    <div class="mt-6 flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-3 sm:space-y-0">
      <NuxtLink
        to="/quests"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        View Quests
      </NuxtLink>
      <NuxtLink
        to="/quests/new"
        class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        Create Quest
      </NuxtLink>
    </div>
  </div>
</template>
