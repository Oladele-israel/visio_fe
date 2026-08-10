import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { runWithConnection }                 from '@/lib/connection'
import { DeadConnectionError }               from '@/lib/db/postgres'
import { queryTable }                      from '@/lib/db/query'

// GET /api/db-agent/[id]/query?table=tableName&limit=20&offset=0
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const table = searchParams.get('table')

    if (!table) {
      return Response.json({ error: 'Table parameter is required' }, { status: 400 })
    }

    const limit = Number(searchParams.get('limit') ?? 20)
    const offset = Number(searchParams.get('offset') ?? 0)
    const orderBy = searchParams.get('orderBy') ?? undefined
    const orderDir = (searchParams.get('orderDir') as 'asc' | 'desc') ?? undefined

    const result = await runWithConnection(id, session.user.id, query =>
      queryTable(query, {
        tableName: table,
        limit,
        offset,
        orderBy,
        orderDir,
      }),
    )

    return Response.json({ success: true, data: result })
  } catch (err: any) {
    if (err instanceof DeadConnectionError) {
      return Response.json(
        { error: err.message, disconnected: true, reconnect: true },
        { status: 410 },
      )
    }
    console.error('[GET /api/db-agent/[id]/query]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

// POST /api/db-agent/[id]/query
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id } = await params
    const body   = await req.json()
    const { table, tableName, limit, offset, orderBy, orderDir, filters } = body
    const targetTable = table || tableName

    if (!targetTable) {
      return Response.json({ error: 'Table parameter is required' }, { status: 400 })
    }

    const result = await runWithConnection(id, session.user.id, query =>
      queryTable(query, {
        tableName: targetTable,
        limit,
        offset,
        orderBy,
        orderDir,
        filters,
      }),
    )

    return Response.json({ success: true, data: result })
  } catch (err: any) {
    if (err instanceof DeadConnectionError) {
      return Response.json(
        { error: err.message, disconnected: true, reconnect: true },
        { status: 410 },
      )
    }
    console.error('[POST /api/db-agent/[id]/query]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
