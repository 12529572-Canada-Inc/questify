import { $fetch } from '@nuxt/test-utils/e2e'

/**
 * Logs in (creating the user if necessary) and returns the session cookie string.
 * Works in Nuxt E2E test context.
 *
 * @param baseURL - The base URL of the test server (from useTestContext().url)
 * @param email - User email
 * @param password - User password
 * @param name - Optional display name
 */
export async function loginAndGetCookie(
  baseURL: string,
  email: string,
  password: string,
  name = 'E2E Tester',
): Promise<string> {
  const api = (path: string) => new URL(path, baseURL).toString()

  // 1️⃣ Try to sign up the user
  try {
    await $fetch(api('/api/auth/signup'), {
      method: 'POST',
      body: { email, password, name },
    })
  }
  catch (err: unknown) {
    // Ignore 409 (user already exists)
    if (!String((err as { data?: unknown })?.data ?? '').includes('already')) {
      console.warn('⚠️ Signup may have failed:', err)
    }
  }

  // 2️⃣ Log in
  const res = await fetch(api('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  // 3️⃣ Extract the cookie
  const cookie = res.headers.get('set-cookie')
  if (!cookie) {
    const text = await res.text()
    throw new Error(`No cookie returned from login. Response: ${text}`)
  }

  return cookie
}
