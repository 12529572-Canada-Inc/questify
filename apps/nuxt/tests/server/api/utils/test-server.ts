import { setup } from '@nuxt/test-utils/e2e'

export async function setupServer() {
  // 1️⃣ Start Nuxt in test mode
  await setup({
    server: true,
    dev: false,
  })

  // 2️⃣ Get the active test context
  //   const ctx = useTestContext()

  //   // 3️⃣ Derive URL manually if missing
  //   let baseURL
  //     = ctx?.url || process.env.NUXT_URL

  //   // 4️⃣ Final fallback for safety
  //   if (!baseURL || baseURL === '/') {
  //     baseURL = `http://127.0.0.1:${process.env.NUXT_PORT ?? 3000}`
  //   }

  //   if (!baseURL.endsWith('/')) baseURL += '/'
  //   const api = (path: string) => new URL(path, baseURL).toString()

//   console.log('🧩 Nuxt test server running at:', baseURL)
//   return { baseURL, api }
}
