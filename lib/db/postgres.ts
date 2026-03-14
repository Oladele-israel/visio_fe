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
  const isLoopback =
    config.host === 'localhost'  ||
    config.host === '127.0.0.1'  ||
    config.host?.startsWith('::1')

  const client = new Client({
    host:     config.host,
    port:     config.port,
    database: config.database,
    user:     config.username,   // pg uses `user` not `username`
    password: config.password,
    // Strip SSL for loopback to avoid TLS handshake failure on local dev
    ssl: config.ssl && !isLoopback
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 15_000,
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