import { prisma }  from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

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