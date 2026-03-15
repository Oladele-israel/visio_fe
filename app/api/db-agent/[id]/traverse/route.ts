import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { getConnectionConfig }             from '@/lib/connection'
import { withPostgres }                    from '@/lib/db/postgres'
import { traverseRelation }                from '@/lib/db/query'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id } = await params
    const body    = await req.json()
    const config  = await getConnectionConfig(id, session.user.id)

    const {
      sourceTable,
      sourceColumn,
      sourceValue,
      relationType,
      targetTable,
      targetColumn,
      limit,
      offset,
    } = body

    if (!sourceTable || !sourceColumn || sourceValue == null || !relationType || !targetTable || !targetColumn) {
      return Response.json(
        { error: 'sourceTable, sourceColumn, sourceValue, relationType, targetTable, targetColumn are required' },
        { status: 400 },
      )
    }

    if (relationType !== 'belongsTo' && relationType !== 'hasMany') {
      return Response.json(
        { error: 'relationType must be "belongsTo" or "hasMany"' },
        { status: 400 },
      )
    }

    const result = await withPostgres(config, query =>
      traverseRelation(query, {
        sourceTable,
        sourceColumn,
        sourceValue,
        relationType,
        targetTable,
        targetColumn,
        limit,
        offset,
      }),
    )

    return Response.json({ success: true, data: result })
  } catch (err: any) {
    console.error('[POST /api/db-agent/[id]/traverse]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}