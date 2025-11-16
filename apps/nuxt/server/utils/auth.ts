/**
 * Simple wrapper used by Nuxt auth middleware to call the login API.
 */
export async function authorize(credentials: { email: string, password: string }) {
  const user = await $fetch('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
  return user || null
}
