import type { QueryFn } from './postgres'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column {
  name:         string
  dataType:     string
  isNullable:   boolean
  isPrimaryKey: boolean
  isUnique:     boolean
  isIdentifier: boolean  // PK or (unique + not nullable) — reliable row identifier
}

export interface Table {
  name:    string
  columns: Column[]
}

// ─── Schema introspection ─────────────────────────────────────────────────────

export async function introspectSchema(query: QueryFn): Promise<Table[]> {
  const tableRows = await query<{ table_name: string }>(
    `SELECT relname AS table_name
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
     ORDER BY relname`,
  )

  const tables = await Promise.all(
    tableRows.map(async r => ({
      name:    r.table_name,
      columns: await loadColumns(query, r.table_name),
    })),
  )

  return tables
}

async function loadColumns(query: QueryFn, tableName: string): Promise<Column[]> {
  const rows = await query<{
    column_name:   string
    data_type:     string
    is_nullable:   boolean
    is_primary_key: boolean
    is_unique:     boolean
  }>(
    `SELECT
      a.attname                              AS column_name,
      format_type(a.atttypid, a.atttypmod)  AS data_type,
      NOT a.attnotnull                       AS is_nullable,
      EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid   = a.attrelid
          AND i.indisprimary
          AND a.attnum = ANY(i.indkey)
      )                                      AS is_primary_key,
      EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid  = a.attrelid
          AND i.indisunique
          AND a.attnum = ANY(i.indkey)
      )                                      AS is_unique
     FROM pg_attribute a
     JOIN pg_class     c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname   = 'public'
       AND c.relname   = $1
       AND a.attnum    > 0
       AND NOT a.attisdropped
     ORDER BY a.attnum`,
    [tableName],
  )

  return rows.map(r => ({
    name:         r.column_name,
    dataType:     r.data_type,
    isNullable:   r.is_nullable,
    isPrimaryKey: r.is_primary_key,
    isUnique:     r.is_unique,
    isIdentifier: r.is_primary_key || (r.is_unique && !r.is_nullable),
  }))
}