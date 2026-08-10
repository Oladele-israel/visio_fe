import { prisma }  from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { withPostgres, QueryFn, DeadConnectionError } from '@/lib/db/postgres'

export interface DbConfig {
  host:     string
  port:     number
  database: string
  username: string
  password: string
  ssl:      boolean
}

/**
 * Fetches a connection record from the DB and returns a decrypted DbConfig.
 * Throws if the connection doesn't exist or doesn't belong to the user.
 */
export async function getConnectionConfig(
  connectionId: string,
  userId: string,
): Promise<DbConfig> {
  const conn = await prisma.dbConnection.findFirst({
    where: { id: connectionId, userId },
  })

  if (!conn) throw new Error('Connection not found')

  return {
    host:     conn.host,
    port:     conn.port,
    database: conn.database,
    username: conn.username,
    password: decrypt(conn.encryptedPassword),
    ssl:      conn.ssl,
  }
}

export function isLocalTunnelHost(host: string): boolean {
  const cleanHost = (host || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase()

  return (
    cleanHost.endsWith('.trycloudflare.com') ||
    cleanHost.endsWith('.loca.lt') ||
    cleanHost.endsWith('.ngrok.io') ||
    cleanHost.endsWith('.usevisio.com') ||
    cleanHost.includes('agent.') ||
    cleanHost.includes('tunnel.')
  )
}

/**
 * Executes a query with a DbConnection.
 * If the connection is a temporary local agent/tunnel connection and the process/tunnel is dead,
 * automatically deletes the connection from the DB and prompts the user to reconnect.
 * For cloud databases (direct host connections), the connection is ALWAYS PRESERVED in the DB.
 */
export async function runWithConnection<T>(
  connectionId: string,
  userId: string,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const config = await getConnectionConfig(connectionId, userId)
  const isTunnel = isLocalTunnelHost(config.host)

  try {
    return await withPostgres(config, fn)
  } catch (err: any) {
    if (err instanceof DeadConnectionError || isDeadProcessError(err)) {
      if (isTunnel) {
        console.warn(`[runWithConnection] Local agent process for connection ${connectionId} is dead. Removing temporary tunnel connection from DB.`)
        await prisma.dbConnection.deleteMany({
          where: { id: connectionId, userId },
        }).catch(() => {})

        throw new DeadConnectionError(
          'The local database agent process was killed or disconnected. The temporary tunnel connection has been removed. Please run "npx visio-agent@latest" in your terminal to restart the bridge and reconnect.',
        )
      } else {
        console.warn(`[runWithConnection] Cloud connection ${connectionId} (${config.host}) unreachable: ${err.message}. Connection PRESERVED in DB.`)
        throw new Error(
          `Unable to connect to cloud database (${config.host}:${config.port}). Your connection is preserved as credentials do not change. Please check database status or network connection.`,
        )
      }
    }
    throw err
  }
}

function isDeadProcessError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase()
  return (
    msg.includes('timeout expired') ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('agent request failed') ||
    msg.includes('tunnel not found') ||
    msg.includes('killed') ||
    msg.includes('offline') ||
    msg.includes('disconnected')
  )
}