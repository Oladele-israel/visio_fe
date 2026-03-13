// lib/session.ts
// This file is Node.js only — never import in middleware.ts
import { auth }        from './auth'
import { headers }     from 'next/headers'
import { NextRequest } from 'next/server'

// For Server Components and Server Actions
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

// For API Route handlers
export async function getRequestSession(req: NextRequest) {
  return auth.api.getSession({
    headers: req.headers,
  })
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}