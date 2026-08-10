import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { runWithConnection }                 from '@/lib/connection'
import { DeadConnectionError }               from '@/lib/db/postgres'
import { queryTable }                      from '@/lib/db/query'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; table: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id, table } = await params
    const body           = await req.json()

    const result = await runWithConnection(id, session.user.id, query =>
      queryTable(query, {
        tableName: table,
        limit:     body.limit,
        offset:    body.offset,
        orderBy:   body.orderBy,
        filters:   body.filters,
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
    console.error('[POST /api/db-agent/[id]/query/[table]]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}