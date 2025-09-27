declare module 'nuxt-auth-utils' {
  interface User {
    id: string
    email: string
    name: string | null
  }
  interface UserSession {
    user: User
  }
}
