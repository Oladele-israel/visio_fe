import { Client } from 'pg'

export interface DbConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
}

export type QueryFn = <T = any>(sql: string, params?: any[]) => Promise<T[]>

export class DeadConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeadConnectionError'
  }
}

export async function withPostgres<T>(
  config: DbConfig,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const cleanHost = (config.host || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim()

  const isTryCloudflare =
    cleanHost.endsWith('.trycloudflare.com') ||
    cleanHost.includes('agent.')            ||
    cleanHost.includes('tunnel.')           ||
    cleanHost.endsWith('.usevisio.com')

  const isLoopback =
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost?.startsWith('::1')

  const isVercel = process.env.VERCEL === '1' || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)

  // 1. Cloudflare Tunnel / Agent Bridge handling
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
          if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404) {
            throw new DeadConnectionError(`Local database agent at ${cleanHost} is offline or process was killed.`)
          }
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
          throw new DeadConnectionError(`Timeout expired waiting for local Visio Agent bridge at ${cleanHost}. The process may be killed or offline.`)
        }
        if (err.message && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED'))) {
          throw new DeadConnectionError(`Unable to reach local Visio Agent bridge at ${cleanHost}. The agent process has been killed.`)
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
    host: targetHost,
    port: targetPort,
    database: config.database,
    user: config.username,
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
    await client.end().catch(() => { })
  }
}