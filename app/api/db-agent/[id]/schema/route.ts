import { NextRequest }                       from 'next/server'
import { getRequestSession, unauthorized }   from '@/lib/session'
import { getConnectionConfig }               from '@/lib/connection'
import { withPostgres }                      from '@/lib/db/postgres'
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
    const config  = await getConnectionConfig(id, session.user.id)

    const schema = await withPostgres(config, query => introspectSchema(query))

    return Response.json({ success: true, data: schema })
  } catch (err: any) {
    console.error('[GET /api/db-agent/[id]/schema]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}