import type { QueryFn } from './postgres'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueryParams {
  tableName: string
  limit?:    number
  offset?:   number
  orderBy?:  { column: string; direction: 'asc' | 'desc' }
  filters?:  Record<string, any>
}

export interface TraverseParams {
  sourceTable:  string
  sourceColumn: string
  sourceValue:  string | number
  relationType: 'belongsTo' | 'hasMany'
  targetTable:  string
  targetColumn: string
  limit?:       number
  offset?:      number
}

export interface QueryResult {
  columns: string[]
  rows:    Record<string, any>[]
  total:   number
}

// ─── Identifier safety ───────────────────────────────────────────────────────

const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function assertSafeIdentifier(value: string, label: string): void {
  if (!value || !SAFE_IDENTIFIER.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`)
  }
}

// ─── Type compatibility ───────────────────────────────────────────────────────
//
// Handles the case where a FK points to a column with an incompatible type.
// e.g. api_keys.staff_id (uuid) → users.pk (integer)
// We detect the mismatch and find the correct compatible identifier column.

type ValueKind = 'integer' | 'uuid' | 'text'

function classifyValue(value: string | number): ValueKind {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
    return 'integer'
  }
  if (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    return 'uuid'
  }
  return 'text'
}

function isTypeCompatible(pgType: string, valueKind: ValueKind): boolean {
  const t = pgType.toLowerCase()
  if (valueKind === 'integer') return /int|serial|numeric|bigint|smallint/.test(t)
  if (valueKind === 'uuid')    return t === 'uuid'
  return true // text is compatible with anything as fallback
}

// ─── Core functions ───────────────────────────────────────────────────────────

export async function queryTable(
  query: QueryFn,
  params: QueryParams,
): Promise<QueryResult> {
  const { tableName, limit = 20, offset = 0, orderBy, filters } = params

  if (!tableName)  throw new Error('Table name is required')
  if (limit > 100) throw new Error('Limit too large, max 100')

  assertSafeIdentifier(tableName, 'table name')

  const whereClauses: string[] = []
  const filterValues: any[]    = []
  let idx = 1

  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      assertSafeIdentifier(col, 'filter column')
      whereClauses.push(`"${col}" = $${idx++}`)
      filterValues.push(val)
    }
  }

  if (orderBy) {
    assertSafeIdentifier(orderBy.column, 'order by column')
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''
  const orderSql = orderBy
    ? `ORDER BY "${orderBy.column}" ${orderBy.direction === 'desc' ? 'DESC' : 'ASC'}`
    : ''

  const dataValues = [...filterValues, limit, offset]
  const dataSql    = `
    SELECT * FROM "${tableName}"
    ${whereSql}
    ${orderSql}
    LIMIT  $${idx++}
    OFFSET $${idx++}
  `
  const countSql = `SELECT COUNT(*) AS total FROM "${tableName}" ${whereSql}`

  const [countResult, rows] = await Promise.all([
    query<{ total: string }>(countSql, filterValues),
    query<Record<string, any>>(dataSql, dataValues),
  ])

  return {
    columns: rows.length > 0 ? Object.keys(rows[0]) : [],
    rows,
    total: parseInt(countResult[0]?.total ?? '0', 10),
  }
}

export async function traverseRelation(
  query: QueryFn,
  params: TraverseParams,
): Promise<QueryResult> {
  const {
    sourceTable,
    sourceColumn,
    sourceValue,
    relationType,
    targetTable,
    targetColumn,
    limit  = 50,
    offset = 0,
  } = params

  assertSafeIdentifier(sourceTable,  'source table')
  assertSafeIdentifier(sourceColumn, 'source column')
  assertSafeIdentifier(targetTable,  'target table')
  assertSafeIdentifier(targetColumn, 'target column')

  if (sourceValue == null) {
    throw new Error(`Source value for "${sourceTable}"."${sourceColumn}" is null — cannot traverse`)
  }

  if (relationType !== 'belongsTo' && relationType !== 'hasMany') {
    throw new Error(`Unknown relation type "${relationType}"`)
  }

  // ── Column resolution strategy ───────────────────────────────────────────
  //
  // belongsTo — navigating TO the parent row by its identifier.
  //   e.g. DbConnection.userId = "abc" → find User WHERE id = "abc"
  //   Call resolveCompatibleTargetColumn() which prefers `id` over `pk`
  //   and handles type mismatches between the FK value and target column type.
  //
  // hasMany — filtering CHILD rows by their FK column.
  //   e.g. User.id = "abc" → find DbConnection WHERE userId = "abc"
  //   MUST use targetColumn as-is (userId) — never substitute `id`.
  //   Substituting `id` would query WHERE id = user's_id value,
  //   returning at most 1 row instead of all matching child rows.
  const resolvedColumn = relationType === 'belongsTo'
    ? await resolveCompatibleTargetColumn(query, targetTable, targetColumn, sourceValue)
    : targetColumn

  assertSafeIdentifier(resolvedColumn, 'resolved target column')

  const [countResult, rows] = await Promise.all([
    query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "${targetTable}" WHERE "${resolvedColumn}" = $1`,
      [sourceValue],
    ),
    query<Record<string, any>>(
      `SELECT * FROM "${targetTable}" WHERE "${resolvedColumn}" = $1 LIMIT $2 OFFSET $3`,
      [sourceValue, limit, offset],
    ),
  ])

  return {
    columns: rows.length > 0 ? Object.keys(rows[0]) : [],
    rows,
    total: parseInt(countResult[0]?.total ?? '0', 10),
  }
}

// ─── Type resolution ──────────────────────────────────────────────────────────
//
// Priority order for column resolution:
//   1. Prefer `id` column if it exists and is type-compatible
//   2. Fall back to declared targetColumn if type-compatible
//   3. Scan all identifier columns (PK + unique not-null) for a compatible one
//   4. Throw a clear error if nothing is compatible

async function resolveCompatibleTargetColumn(
  query: QueryFn,
  targetTable: string,
  targetColumn: string,
  sourceValue: string | number,
): Promise<string> {
  const valueKind = classifyValue(sourceValue)

  // ── Step 1: prefer `id` if it exists and is compatible ──────────────────
  const idColRows = await query<{ data_type: string }>(
    `SELECT format_type(a.atttypid, a.atttypmod) AS data_type
     FROM pg_attribute a
     JOIN pg_class     c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = $1
       AND a.attname = 'id'
       AND a.attnum  > 0
       AND NOT a.attisdropped`,
    [targetTable],
  )

  if (idColRows.length > 0 && isTypeCompatible(idColRows[0].data_type, valueKind)) {
    return 'id'
  }

  // ── Step 2: check declared targetColumn ──────────────────────────────────
  const targetColRows = await query<{ data_type: string }>(
    `SELECT format_type(a.atttypid, a.atttypmod) AS data_type
     FROM pg_attribute a
     JOIN pg_class     c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = $1
       AND a.attname = $2
       AND a.attnum  > 0
       AND NOT a.attisdropped`,
    [targetTable, targetColumn],
  )

  const targetColType = targetColRows[0]?.data_type ?? 'unknown'

  if (isTypeCompatible(targetColType, valueKind)) {
    return targetColumn
  }

  // ── Step 3: scan all identifier columns for a compatible one ─────────────
  const identifierRows = await query<{ column_name: string; data_type: string }>(
    `SELECT
      a.attname                              AS column_name,
      format_type(a.atttypid, a.atttypmod)  AS data_type
     FROM pg_attribute a
     JOIN pg_class     c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = $1
       AND a.attnum  > 0
       AND NOT a.attisdropped
       AND (
         EXISTS (
           SELECT 1 FROM pg_index i
           WHERE i.indrelid    = a.attrelid
             AND i.indisprimary
             AND a.attnum = ANY(i.indkey)
         )
         OR (
           a.attnotnull AND EXISTS (
             SELECT 1 FROM pg_index i
             WHERE i.indrelid  = a.attrelid
               AND i.indisunique
               AND a.attnum = ANY(i.indkey)
           )
         )
       )
     ORDER BY a.attnum`,
    [targetTable],
  )

  const compatible = identifierRows.find(
    r => r.column_name !== targetColumn && isTypeCompatible(r.data_type, valueKind),
  )

  if (compatible) return compatible.column_name

  // ── Step 4: no compatible column found ───────────────────────────────────
  throw new Error(
    `Cannot traverse to "${targetTable}": ` +
    `declared column "${targetColumn}" is type ${targetColType} ` +
    `but source value "${sourceValue}" is ${valueKind}, ` +
    `and no compatible identifier column exists on "${targetTable}".`,
  )
}

// ─── Data Editing Mutations (CRUD) ─────────────────────────────────────────

export interface InsertRowParams {
  tableName: string
  data: Record<string, any>
}

export interface UpdateRowParams {
  tableName: string
  primaryKey: Record<string, any>
  data: Record<string, any>
}

export interface DeleteRowParams {
  tableName: string
  primaryKey: Record<string, any>
}

export async function insertRow(
  query: QueryFn,
  params: InsertRowParams,
): Promise<Record<string, any>> {
  const { tableName, data } = params
  assertSafeIdentifier(tableName, 'table name')

  const keys = Object.keys(data)
  if (keys.length === 0) throw new Error('No data provided for insertion')

  keys.forEach(k => assertSafeIdentifier(k, 'column name'))

  const cols = keys.map(k => `"${k}"`).join(', ')
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const values = keys.map(k => data[k])

  const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`
  const rows = await query<Record<string, any>>(sql, values)
  return rows[0] ?? data
}

export async function updateRow(
  query: QueryFn,
  params: UpdateRowParams,
): Promise<Record<string, any>> {
  const { tableName, primaryKey, data } = params
  assertSafeIdentifier(tableName, 'table name')

  const updateKeys = Object.keys(data)
  const pkKeys = Object.keys(primaryKey)

  if (updateKeys.length === 0) throw new Error('No fields provided to update')
  if (pkKeys.length === 0) throw new Error('Primary key condition is required for update')

  updateKeys.forEach(k => assertSafeIdentifier(k, 'column name'))
  pkKeys.forEach(k => assertSafeIdentifier(k, 'primary key column'))

  let idx = 1
  const setClauses: string[] = []
  const values: any[] = []

  for (const key of updateKeys) {
    setClauses.push(`"${key}" = $${idx++}`)
    values.push(data[key])
  }

  const whereClauses: string[] = []
  for (const key of pkKeys) {
    whereClauses.push(`"${key}" = $${idx++}`)
    values.push(primaryKey[key])
  }

  const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`
  const rows = await query<Record<string, any>>(sql, values)
  return rows[0] ?? { ...primaryKey, ...data }
}

export async function deleteRow(
  query: QueryFn,
  params: DeleteRowParams,
): Promise<{ success: boolean }> {
  const { tableName, primaryKey } = params
  assertSafeIdentifier(tableName, 'table name')

  const pkKeys = Object.keys(primaryKey)
  if (pkKeys.length === 0) throw new Error('Primary key condition is required for deletion')

  pkKeys.forEach(k => assertSafeIdentifier(k, 'primary key column'))

  let idx = 1
  const whereClauses: string[] = []
  const values: any[] = []

  for (const key of pkKeys) {
    whereClauses.push(`"${key}" = $${idx++}`)
    values.push(primaryKey[key])
  }

  const sql = `DELETE FROM "${tableName}" WHERE ${whereClauses.join(' AND ')}`
  await query(sql, values)
  return { success: true }
}