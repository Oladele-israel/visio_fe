// lib/auth.ts
import { betterAuth }    from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma }        from './prisma'

const isProd = process.env.NODE_ENV === 'production'
const appUrl = process.env.BETTER_AUTH_URL!

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: appUrl,
  secret:  process.env.BETTER_AUTH_SECRET!,

  emailAndPassword: {
    enabled:           true,
    minPasswordLength: 6,
    autoSignIn:        true,
  },

  session: {
    expiresIn:   60 * 60 * 24 * 7,  
    updateAge:   60 * 60 * 24,      
    cookieCache: { enabled: false },  
  },

  advanced: {
    cookiePrefix: 'visio',
    defaultCookieAttributes: {
      httpOnly: true,
      path:     '/',

      // Local:  sameSite=lax, secure=false  → cookies work over plain HTTP
      // Prod:   sameSite=lax, secure=true   → cookies only sent over HTTPS
      sameSite: 'lax',
      secure:   isProd,
    },
    useSecureCookies: isProd
  },
})

export type AuthUser    = typeof auth.$Infer.Session.user
export type AuthSession = typeof auth.$Infer.Session