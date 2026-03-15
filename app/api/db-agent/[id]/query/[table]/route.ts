import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { getConnectionConfig }             from '@/lib/connection'
import { withPostgres }                    from '@/lib/db/postgres'
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
    const config         = await getConnectionConfig(id, session.user.id)

    const result = await withPostgres(config, query =>
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
    console.error('[POST /api/db-agent/[id]/query/[table]]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}