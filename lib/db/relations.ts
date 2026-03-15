import type { QueryFn } from './postgres'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Relation {
  type:         'belongsTo' | 'hasMany'
  fromTable:    string
  fromColumn:   string
  toTable:      string
  toColumn:     string
  toColumnType: string   // actual postgres type of toColumn — for type-safe traversal
  constraint:   string
}

interface PgRelationRow {
  constraint_name: string
  from_table:      string
  from_column:     string
  to_table:        string
  to_column:       string
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getRelations(
  query: QueryFn,
  tableName: string,
): Promise<{ table: string; relations: Relation[] }> {
  const [outgoing, incoming] = await Promise.all([
    getOutgoingRelations(query, tableName),
    getIncomingRelations(query, tableName),
  ])

  return {
    table:     tableName,
    relations: [...outgoing, ...incoming],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getColumnType(
  query: QueryFn,
  tableName: string,
  columnName: string,
): Promise<string> {
  const rows = await query<{ data_type: string }>(
    `SELECT format_type(a.atttypid, a.atttypmod) AS data_type
     FROM pg_attribute a
     JOIN pg_class     c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = $1
       AND a.attname = $2
       AND a.attnum  > 0
       AND NOT a.attisdropped`,
    [tableName, columnName],
  )
  return rows[0]?.data_type ?? 'unknown'
}

// Outgoing: this table HAS a FK pointing to another table → belongsTo
// e.g. api_keys.staff_id → users.id
async function getOutgoingRelations(
  query: QueryFn,
  table: string,
): Promise<Relation[]> {
  const rows = await query<PgRelationRow>(
    `SELECT
      con.conname     AS constraint_name,
      src.relname     AS from_table,
      src_col.attname AS from_column,
      tgt.relname     AS to_table,
      tgt_col.attname AS to_column
     FROM pg_constraint con
     JOIN pg_class src     ON con.conrelid  = src.oid
     JOIN pg_class tgt     ON con.confrelid = tgt.oid
     JOIN pg_attribute src_col
       ON src_col.attrelid = src.oid
      AND src_col.attnum   = ANY(con.conkey)
     JOIN pg_attribute tgt_col
       ON tgt_col.attrelid = tgt.oid
      AND tgt_col.attnum   = ANY(con.confkey)
     WHERE con.contype = 'f'
       AND src.relname = $1
     ORDER BY con.conname`,
    [table],
  )

  return Promise.all(
    rows.map(async r => ({
      type:         'belongsTo' as const,
      fromTable:    r.from_table,
      fromColumn:   r.from_column,
      toTable:      r.to_table,
      toColumn:     r.to_column,
      toColumnType: await getColumnType(query, r.to_table, r.to_column),
      constraint:   r.constraint_name,
    })),
  )
}

// Incoming: another table has a FK pointing TO this table → hasMany
// e.g. api_keys.staff_id → users.id  (seen from users perspective)
async function getIncomingRelations(
  query: QueryFn,
  table: string,
): Promise<Relation[]> {
  const rows = await query<PgRelationRow>(
    `SELECT
      con.conname     AS constraint_name,
      src.relname     AS from_table,
      src_col.attname AS from_column,
      tgt.relname     AS to_table,
      tgt_col.attname AS to_column
     FROM pg_constraint con
     JOIN pg_class src     ON con.conrelid  = src.oid
     JOIN pg_class tgt     ON con.confrelid = tgt.oid
     JOIN pg_attribute src_col
       ON src_col.attrelid = src.oid
      AND src_col.attnum   = ANY(con.conkey)
     JOIN pg_attribute tgt_col
       ON tgt_col.attrelid = tgt.oid
      AND tgt_col.attnum   = ANY(con.confkey)
     WHERE con.contype = 'f'
       AND tgt.relname = $1
     ORDER BY con.conname`,
    [table],
  )

  return Promise.all(
    rows.map(async r => ({
      type:         'hasMany' as const,
      fromTable:    r.to_table,     // parent (our table)
      fromColumn:   r.to_column,    // our referenced column e.g. users.id
      toTable:      r.from_table,   // child table e.g. api_keys
      toColumn:     r.from_column,  // child's FK column e.g. staff_id
      toColumnType: await getColumnType(query, r.from_table, r.from_column),
      constraint:   r.constraint_name,
    })),
  )
}