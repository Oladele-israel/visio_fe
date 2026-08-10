import { NextRequest }                       from 'next/server'
import { getRequestSession, unauthorized }   from '@/lib/session'
import { runWithConnection }                 from '@/lib/connection'
import { DeadConnectionError }               from '@/lib/db/postgres'
import { introspectSchema }                  from '@/lib/db/schema'

// GET /api/db-agent/[id]/schema
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id } = await params
    const schema = await runWithConnection(id, session.user.id, query => introspectSchema(query))

    return Response.json({ success: true, data: schema })
  } catch (err: any) {
    if (err instanceof DeadConnectionError) {
      return Response.json(
        { error: err.message, disconnected: true, reconnect: true },
        { status: 410 },
      )
    }
    console.error('[GET /api/db-agent/[id]/schema]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}