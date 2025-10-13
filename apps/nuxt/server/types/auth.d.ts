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

declare interface LoginBody {
  email: string
  password: string
}

declare interface SignupBody {
  email: string
  password: string
  name?: string
}
