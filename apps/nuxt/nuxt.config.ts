export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  // rest of your config...
  runtimeConfig: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      password: process.env.REDIS_PASSWORD || '',
    },
  },
  nitro: {
    compatibilityDate: '2025-09-17', // update this every 3 months
  },
  eslint: {
    // optional: settings
    config: {
      //   stylistic: true, // if you want stylistic rules
      // you can also override rules here or via further config
    },
    // checker: true, // optional: run ESLint alongside your dev server
  },
});
