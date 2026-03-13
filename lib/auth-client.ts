// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // baseURL is optional when client and server are on same domain
  // Include it explicitly so it works in all environments
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

// Named exports — cleaner imports throughout the app
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient