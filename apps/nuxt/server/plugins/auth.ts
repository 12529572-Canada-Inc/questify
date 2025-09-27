import { authorize } from '../utils/auth'

export default defineNuxtPlugin(() => {
  const auth = useAuth()
  if (auth.options.provider?.type === 'credentials') {
    auth.options.provider.authorize = authorize
  }
})
