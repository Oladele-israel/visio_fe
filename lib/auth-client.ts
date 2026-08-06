// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
})

// Named exports — cleaner imports throughout the app
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient