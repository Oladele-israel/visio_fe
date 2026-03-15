'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signUp, signOut }         from './auth-client'
import { useRouter }                                    from 'next/navigation'
import type { AuthUser }                                from './auth'

interface AuthContextValue {
  user:      AuthUser | null
  loading:   boolean
  isLoading: boolean
  login:     (email: string, password: string) => Promise<void>
  signup:    (email: string, password: string, name: string) => Promise<void>
  logout:    () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const router                       = useRouter()

  // ── No redirect logic here ──────────────────────────────────────────────
  // Route protection is handled entirely by middleware.ts (server-side).
  // auth-context only provides auth state to components — nothing else.

  const login = async (email: string, password: string): Promise<void> => {
    const res = await signIn.email({ email, password })
    if (res.error) throw new Error(res.error.message ?? 'Login failed')
  }

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    const res = await signUp.email({ email, password, name })
    if (res.error) throw new Error(res.error.message ?? 'Signup failed')
  }

  const logout = async (): Promise<void> => {
    await signOut({
      fetchOptions: { onSuccess: () => router.replace('/login') },
    })
  }

  return (
    <AuthContext.Provider value={{
      user:      session?.user ?? null,
      loading:   isPending,
      isLoading: isPending,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}