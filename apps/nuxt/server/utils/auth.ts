export async function authorize(credentials: { email: string, password: string }) {
  const user = await $fetch('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
  return user || null
}
