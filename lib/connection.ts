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

/**
 * Executes a query with a DbConnection.
 * If the local tunnel/agent process is dead or killed, automatically deletes
 * the connection from the DB and throws a clear prompt to reconnect.
 */
export async function runWithConnection<T>(
  connectionId: string,
  userId: string,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const config = await getConnectionConfig(connectionId, userId)

  try {
    return await withPostgres(config, fn)
  } catch (err: any) {
    if (err instanceof DeadConnectionError || isDeadProcessError(err)) {
      console.warn(`[runWithConnection] Local agent process for connection ${connectionId} is dead. Removing connection from DB.`)
      await prisma.dbConnection.deleteMany({
        where: { id: connectionId, userId },
      }).catch(() => {})

      throw new DeadConnectionError(
        'The local database process was killed or disconnected. The connection has been removed. Please run "npx visio-agent" and reconnect.',
      )
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