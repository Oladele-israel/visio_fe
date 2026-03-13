// lib/auth.ts
import { betterAuth }    from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma }        from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: process.env.BETTER_AUTH_URL!,
  secret:  process.env.BETTER_AUTH_SECRET!,

  emailAndPassword: {
    enabled:           true,
    minPasswordLength: 6,
    autoSignIn:        true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,       // refresh if older than 1 day
    // ── cookieCache disabled ─────────────────────────────────────────────
    // With cookieCache enabled, better-auth skips the DB lookup for up to
    // maxAge seconds. This means deleted/banned users retain access until
    // the cache expires. Disable it so every request validates against DB.
    cookieCache: {
      enabled: false,
    },
  },

  advanced: {
    cookiePrefix: 'visio',
    defaultCookieAttributes: {
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      path:     '/',
    },
  },
})

export type AuthUser    = typeof auth.$Infer.Session.user
export type AuthSession = typeof auth.$Infer.Session
