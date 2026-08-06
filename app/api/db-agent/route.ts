import { NextRequest }       from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { prisma }            from '@/lib/prisma'
import { withPostgres }      from '@/lib/db/postgres'
import { encrypt }           from '@/lib/crypto'
import { DbType }            from '@/lib/generated/prisma/client'

const DB_TYPE_MAP: Record<string, DbType> = {
  postgres: DbType.POSTGRES,
  mysql:    DbType.MYSQL,
  sqlite:   DbType.SQLITE,
  mssql:    DbType.MSSQL,
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { searchParams } = req.nextUrl
    const page  = Math.max(parseInt(searchParams.get('page')  ?? '1'),  1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10'), 1), 100)
    const skip  = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.dbConnection.findMany({
        where:   { userId: session.user.id },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, type: true, host: true,
          port: true, database: true, username: true,
          ssl: true, isActive: true, createdAt: true,
        },
      }),
      prisma.dbConnection.count({ where: { userId: session.user.id } }),
    ])

    return Response.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (err: any) {
    console.error('[GET /api/db-agent]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const body = await req.json()
    const { name, type, host, port, database, username, password, ssl } = body

    if (!name || !type || !database) {
      return Response.json({ error: 'name, type, and database are required' }, { status: 400 })
    }

    const cleanHost = (host || '')
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()

    const dbType = DB_TYPE_MAP[type?.toLowerCase()]
    if (!dbType) {
      return Response.json({ error: `Unknown db type: ${type}` }, { status: 400 })
    }

    // Test connection before saving
    try {
      await withPostgres(
        { host: cleanHost, port, database, username, password, ssl },
        (query) => query('SELECT 1'),
      )
    } catch (err: any) {
      return Response.json(
        { error: `Connection test failed: ${err.message}` },
        { status: 400 },
      )
    }

    const connection = await prisma.dbConnection.create({
      data: {
        name,
        type:              dbType,
        host:              cleanHost,
        port:              Number(port),
        database,
        username,
        encryptedPassword: encrypt(password),
        ssl:               ssl ?? false,
        userId:            session.user.id,
      },
    })

    const { encryptedPassword: _, ...safe } = connection
    return Response.json({ success: true, data: safe }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/db-agent]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}