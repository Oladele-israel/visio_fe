import { NextRequest }       from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { prisma }            from '@/lib/prisma'
import { encrypt }           from '@/lib/crypto'
import { DbType }            from '@/lib/generated/prisma/client'

const DB_TYPE_MAP: Record<string, DbType> = {
  postgres: DbType.POSTGRES,
  mysql:    DbType.MYSQL,
  sqlite:   DbType.SQLITE,
  mssql:    DbType.MSSQL,
}

// GET /api/db-agent/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(req)
  if (!session) return unauthorized()

  const { id } = await params

  const connection = await prisma.dbConnection.findFirst({
    where:  { id, userId: session.user.id },
    select: {
      id: true, name: true, type: true, host: true,
      port: true, database: true, username: true,
      ssl: true, isActive: true, createdAt: true, updatedAt: true,
    },
  })

  if (!connection) {
    return Response.json({ error: 'Connection not found' }, { status: 404 })
  }

  return Response.json({ success: true, data: connection })
}

// PATCH /api/db-agent/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const body   = await req.json()

  // Verify ownership
  const existing = await prisma.dbConnection.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: 'Connection not found' }, { status: 404 })
  }

  const updateData: any = {}

  if (body.name     !== undefined) updateData.name     = body.name
  if (body.host     !== undefined) updateData.host     = body.host
  if (body.port     !== undefined) updateData.port     = Number(body.port)
  if (body.database !== undefined) updateData.database = body.database
  if (body.username !== undefined) updateData.username = body.username
  if (body.ssl      !== undefined) updateData.ssl      = body.ssl
  if (body.type     !== undefined) {
    const dbType = DB_TYPE_MAP[body.type?.toLowerCase()]
    if (!dbType) {
      return Response.json({ error: `Unknown db type: ${body.type}` }, { status: 400 })
    }
    updateData.type = dbType
  }
  if (body.password) {
    updateData.encryptedPassword = encrypt(body.password)
  }

  const updated = await prisma.dbConnection.update({
    where: { id },
    data:  updateData,
    select: {
      id: true, name: true, type: true, host: true,
      port: true, database: true, username: true,
      ssl: true, isActive: true, createdAt: true, updatedAt: true,
    },
  })

  return Response.json({ success: true, data: updated })
}

// DELETE /api/db-agent/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(req)
  if (!session) return unauthorized()

  const { id } = await params

  const existing = await prisma.dbConnection.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: 'Connection not found' }, { status: 404 })
  }

  await prisma.dbConnection.delete({ where: { id } })
  return Response.json({ success: true, deleted: id })
}