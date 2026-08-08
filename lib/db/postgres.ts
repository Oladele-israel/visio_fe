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

  // On Vercel serverless functions, raw TCP outbound to trycloudflare/loopback is not supported.
  // Bypass raw TCP handshake to prevent 15-second timeouts.
  if (isVercel && (isLoopback || isTryCloudflare)) {
    const mockQuery: QueryFn = async () => []
    return await fn(mockQuery)
  }

  const targetHost = (!isVercel && (isLoopback || isTryCloudflare)) ? '127.0.0.1' : cleanHost
  const targetPort = Number(config.port) || 5432

  const client = new Client({
    host:     targetHost,
    port:     targetPort,
    database: config.database,
    user:     config.username,   // pg uses `user` not `username`
    password: config.password,
    ssl: config.ssl && !isLoopback && !isTryCloudflare
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 5_000,
  })

  await client.connect()

  try {
    const query: QueryFn = (sql, params) =>
      client.query(sql, params).then(r => r.rows)

    return await fn(query)
  } finally {
    await client.end().catch(() => {})
  }
}