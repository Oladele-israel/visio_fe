import { NextRequest }                     from 'next/server'
import { getRequestSession, unauthorized } from '@/lib/session'
import { getConnectionConfig }             from '@/lib/connection'
import { withPostgres }                    from '@/lib/db/postgres'
import { insertRow, updateRow, deleteRow } from '@/lib/db/query'

// POST /api/db-agent/:id/rows  — Insert a new row into a table
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id }    = await params
    const body      = await req.json()
    const { tableName, data } = body

    if (!tableName || !data) {
      return Response.json({ error: 'tableName and data are required' }, { status: 400 })
    }

    const config = await getConnectionConfig(id, session.user.id)
    const result = await withPostgres(config, query =>
      insertRow(query, { tableName, data }),
    )

    return Response.json({ success: true, data: result }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/db-agent/[id]/rows]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/db-agent/:id/rows   — Update an existing row
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id }    = await params
    const body      = await req.json()
    const { tableName, primaryKey, data } = body

    if (!tableName || !primaryKey || !data) {
      return Response.json(
        { error: 'tableName, primaryKey, and data are required' },
        { status: 400 },
      )
    }

    const config = await getConnectionConfig(id, session.user.id)
    const result = await withPostgres(config, query =>
      updateRow(query, { tableName, primaryKey, data }),
    )

    return Response.json({ success: true, data: result })
  } catch (err: any) {
    console.error('[PUT /api/db-agent/[id]/rows]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/db-agent/:id/rows — Delete a row
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(req)
    if (!session) return unauthorized()

    const { id }    = await params
    const body      = await req.json()
    const { tableName, primaryKey } = body

    if (!tableName || !primaryKey) {
      return Response.json(
        { error: 'tableName and primaryKey are required' },
        { status: 400 },
      )
    }

    const config = await getConnectionConfig(id, session.user.id)
    const result = await withPostgres(config, query =>
      deleteRow(query, { tableName, primaryKey }),
    )

    return Response.json({ success: true, data: result })
  } catch (err: any) {
    console.error('[DELETE /api/db-agent/[id]/rows]', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
