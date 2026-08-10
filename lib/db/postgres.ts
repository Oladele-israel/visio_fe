import { Client } from 'pg'

export interface DbConfig {
  host:     string
  port:     number
  database: string
  username: string
  password: string
  ssl:      boolean
}

export type QueryFn = <T = any>(sql: string, params?: any[]) => Promise<T[]>

/**
 * Opens a direct TCP Postgres connection, runs fn(query), then closes it.
 * Uses standard `pg` driver — works for any Postgres host (Neon, Prisma,
 * Supabase, RDS, localhost, etc.)
 *
 * NOTE: This works on Vercel only if your Postgres host supports SSL on port
 * 5432 AND Vercel's outbound TCP is not blocked. For Neon specifically you'd
 * swap this for @neondatabase/serverless. For now (dev + Prisma postgres) this
 * is correct.
 */
export async function withPostgres<T>(
  config: DbConfig,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const cleanHost = (config.host || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim()

  const isTryCloudflare = cleanHost.endsWith('.trycloudflare.com')
  const isLoopback =
    cleanHost === 'localhost'  ||
    cleanHost === '127.0.0.1'  ||
    cleanHost?.startsWith('::1')

  const isVercel = process.env.VERCEL === '1' || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)

  // 1. Cloudflare Quick Tunnel / Agent Bridge handling
  if (isTryCloudflare || (isVercel && isLoopback)) {
    const agentUrl = cleanHost.startsWith('http') ? cleanHost : `https://${cleanHost}`

    const queryFn: QueryFn = async (sql, params) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      try {
        const res = await fetch(`${agentUrl}/db/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config, sql, params }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const msg = errData.message || errData.error || `Agent request failed with status ${res.status}`
          throw new Error(msg)
        }

        const data = await res.json()
        if (data.status === 'error') {
          throw new Error(data.message || 'Database query error')
        }
        return data.rows ?? data
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          throw new Error('timeout expired waiting for local Visio Agent bridge response')
        }
        throw err
      }
    }

    return await fn(queryFn)
  }

  // 2. Direct TCP connection for cloud Postgres & local development
  const targetHost = (!isVercel && isLoopback) ? '127.0.0.1' : cleanHost
  const targetPort = Number(config.port) || 5432

  const client = new Client({
    host:     targetHost,
    port:     targetPort,
    database: config.database,
    user:     config.username,
    password: config.password,
    ssl: config.ssl && !isLoopback && !isTryCloudflare
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 5_000,
  })

  await client.connect()

  try {
    const queryFn: QueryFn = (sql, params) =>
      client.query(sql, params).then(r => r.rows)

    return await fn(queryFn)
  } finally {
    await client.end().catch(() => {})
  }
}