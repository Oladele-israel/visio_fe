import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { getConnectionConfig }             from '@/lib/connection'
import { withPostgres }                    from '@/lib/db/postgres'
import { getRelations }                    from '@/lib/db/relations'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; table: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id, table } = await params
    const config         = await getConnectionConfig(id, session.user.id)
    const relations      = await withPostgres(config, query => getRelations(query, table))

    return Response.json({ success: true, data: relations })
  } catch (err: any) {
    console.error('[GET /api/db-agent/[id]/relations/[table]]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}