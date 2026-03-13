'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRouter }                                               from 'next/navigation'
import { useSession, signIn, signUp, signOut }                    from './auth-client'
import type { AuthUser }                                           from './auth'

interface AuthContextValue {
  user:      AuthUser | null
  loading:   boolean
  isLoading: boolean
  login:     (email: string, password: string) => Promise<void>
  signup:    (email: string, password: string, name: string) => Promise<void>
  logout:    () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PUBLIC_PATHS = ['/login', '/signup', '/forgotPassword']

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const router                       = useRouter()

  useEffect(() => {
    // Only redirect once better-auth has finished loading the session
    // isPending = true means still hydrating — don't act yet
    if (isPending) return

    const isPublic = PUBLIC_PATHS.some(p =>
      window.location.pathname.startsWith(p)
    )

    // Session is null and we're on a protected page → go to login
    if (!session && !isPublic) {
      router.replace('/login')
    }
  }, [session, isPending, router])

  const login = async (email: string, password: string): Promise<void> => {
    const res = await signIn.email({ email, password })
    if (res.error) throw new Error(res.error.message ?? 'Login failed')
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<void> => {
    const res = await signUp.email({ email, password, name })
    if (res.error) throw new Error(res.error.message ?? 'Signup failed')
  }

  const logout = async (): Promise<void> => {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.replace('/login'),
      },
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user:      session?.user ?? null,
        loading:   isPending,
        isLoading: isPending,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
