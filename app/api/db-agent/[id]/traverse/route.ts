import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { runWithConnection }                 from '@/lib/connection'
import { DeadConnectionError }               from '@/lib/db/postgres'
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

    const result = await runWithConnection(id, session.user.id, query =>
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
    if (err instanceof DeadConnectionError) {
      return Response.json(
        { error: err.message, disconnected: true, reconnect: true },
        { status: 410 },
      )
    }
    console.error('[POST /api/db-agent/[id]/traverse]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}