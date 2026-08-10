import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { runWithConnection }                 from '@/lib/connection'
import { DeadConnectionError }               from '@/lib/db/postgres'
import { getRelations }                    from '@/lib/db/relations'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; table: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id, table } = await params
    const relations      = await runWithConnection(id, session.user.id, query => getRelations(query, table))

    return Response.json({ success: true, data: relations })
  } catch (err: any) {
    if (err instanceof DeadConnectionError) {
      return Response.json(
        { error: err.message, disconnected: true, reconnect: true },
        { status: 410 },
      )
    }
    console.error('[GET /api/db-agent/[id]/relations/[table]]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}