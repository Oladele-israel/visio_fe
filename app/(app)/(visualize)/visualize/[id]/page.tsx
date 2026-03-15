'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter }                       from 'next/navigation'
import { api }                                        from '@/lib/api'
import {
  Database, Table2, ChevronRight, ChevronDown,
  Search, X, ArrowLeft, Loader2,
  Key, Link2, Hash, ToggleLeft, Calendar,
  SortAsc, SortDesc, Filter, RefreshCw,
  PanelLeftClose, PanelLeftOpen, Rows3,
  ExternalLink, Info, AlertCircle,
  Link as LucideLink,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface Column {
  name:         string
  dataType:     string
  isNullable:   boolean
  isPrimaryKey: boolean
  isUnique:     boolean
  isIdentifier: boolean
}

interface Table {
  name:    string
  columns: Column[]
}

interface Relation {
  type:       'belongsTo' | 'hasMany'
  fromTable:  string
  fromColumn: string
  toTable:    string
  toColumn:   string
  constraint: string
}

interface QueryResult {
  columns: string[]
  rows:    Record<string, any>[]
  total:   number
}

interface TraversalContext {
  relationType: 'belongsTo' | 'hasMany'
  sourceTable:  string
  sourceColumn: string
  sourceValue:  string | number
  targetTable:  string
  targetColumn: string
}

interface BreadcrumbItem {
  table:             string
  label:             string
  traversalContext?: TraversalContext
}

const PAGE_SIZE = 20

/* ─────────────────────────────────────────────────────────────────────────────
   RESPONSE UNWRAPPERS
   All Next.js API routes return { success: true, data: <payload> }
───────────────────────────────────────────────────────────────────────────── */
function unwrapSchema(res: any): Table[] {
  const raw = res?.data?.data ?? res?.data
  return Array.isArray(raw) ? raw : []
}

function unwrapRelations(res: any): Relation[] {
  return res?.data?.data?.relations ?? res?.data?.relations ?? []
}

function unwrapQueryResult(res: any): QueryResult | null {
  const payload = res?.data?.data ?? res?.data
  if (!payload || !Array.isArray(payload.rows)) return null
  return {
    columns: payload.columns ?? [],
    rows:    payload.rows,
    total:   payload.total ?? 0,
  }
}

function unwrapConnectionName(res: any): string | null {
  return res?.data?.data?.name ?? res?.data?.name ?? null
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function typeIcon(dataType: string) {
  if (/int|serial|numeric|float|double|decimal/.test(dataType))
    return <Hash className="w-3 h-3 text-blue-400" />
  if (/bool/.test(dataType))
    return <ToggleLeft className="w-3 h-3 text-emerald-400" />
  if (/timestamp|date|time/.test(dataType))
    return <Calendar className="w-3 h-3 text-violet-400" />
  return (
    <span className="w-3 h-3 flex items-center justify-center text-muted-foreground text-[10px] font-bold">
      T
    </span>
  )
}

function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean')          return val ? 'true' : 'false'
  if (typeof val === 'object')           return JSON.stringify(val)
  return String(val)
}

/**
 * Resolves the best row identifier.
 * Priority: isPrimaryKey → isIdentifier → column named "id"
 * Never uses "pk" — always prefer "id".
 */
function resolveRowId(
  row:     Record<string, any>,
  columns: Column[] | undefined,
): { column: string; value: string | number } | null {
  if (!columns) return null

  // 1. Explicit primary key
  const pk = columns.find(c => c.isPrimaryKey)
  if (pk && row[pk.name] != null) return { column: pk.name, value: row[pk.name] }

  // 2. Any identifier column (unique + not nullable)
  const identifier = columns.find(c => c.isIdentifier && row[c.name] != null)
  if (identifier) return { column: identifier.name, value: row[identifier.name] }

  // 3. Column literally named "id" — never "pk"
  const idCol = columns.find(
    c => c.name.toLowerCase() === 'id' && row[c.name] != null,
  )
  if (idCol) return { column: idCol.name, value: row[idCol.name] }

  return null
}

function findFkRelation(colName: string, relations: Relation[]): Relation | undefined {
  return relations.find(r => r.type === 'belongsTo' && r.fromColumn === colName)
}

function dedupeRelations(relations: Relation[]): Relation[] {
  const seen = new Set<string>()
  return relations.filter(r => {
    const key = `${r.type}:${r.toTable}:${r.fromColumn}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   COL BADGE
───────────────────────────────────────────────────────────────────────────── */
function ColBadge({ col }: { col: Column }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-xs">
      {col.isPrimaryKey
        ? <Key className="w-3 h-3 text-yellow-400 shrink-0" />
        : typeIcon(col.dataType)}
      <span className="font-medium text-foreground truncate max-w-[90px]">{col.name}</span>
      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[70px]">
        {col.dataType.split('(')[0].replace(' without time zone', '')}
      </span>
      {!col.isNullable && (
        <span className="text-[9px] font-bold text-orange-400 ml-0.5">NN</span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function VisualizePage() {
  const params       = useParams()
  const router       = useRouter()
  const connectionId = params.id as string

  /* ── Layout ── */
  const [sidebarOpen, setSidebarOpen] = useState(true)

  /* ── Schema ── */
  const [schema,         setSchema]         = useState<Table[]>([])
  const [schemaLoading,  setSchemaLoading]  = useState(true)
  const [schemaError,    setSchemaError]    = useState<string | null>(null)
  const [connectionName, setConnectionName] = useState(`Connection ${connectionId}`)

  /* ── Table data ── */
  const [selectedTable,  setSelectedTable]  = useState<string | null>(null)
  const [relations,      setRelations]      = useState<Relation[]>([])
  const [queryResult,    setQueryResult]    = useState<QueryResult | null>(null)
  const [queryLoading,   setQueryLoading]   = useState(false)
  const [queryError,     setQueryError]     = useState<string | null>(null)
  const [breadcrumb,     setBreadcrumb]     = useState<BreadcrumbItem[]>([])
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  /* ── Controls ── */
  const [tableSearch, setTableSearch] = useState('')
  const [rowFilter,   setRowFilter]   = useState('')
  const [page,        setPage]        = useState(0)
  const [orderBy,     setOrderBy]     = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)

  /* ─────────────────────────────────────────────────────────────────────────
     LOAD SCHEMA
     No /connect needed — Next.js API routes are stateless, every request
     opens its own connection via withPostgres() in the route handler.
  ───────────────────────────────────────────────────────────────────────── */
  const loadSchema = useCallback(async () => {
    setSchemaLoading(true)
    setSchemaError(null)
    setSchema([])
    setSelectedTable(null)
    setBreadcrumb([])

    try {
      const [schemaRes, connRes] = await Promise.all([
        // ✅ GET /api/db-agent/:id/schema
        api.get(`/db-agent/${connectionId}/schema`),
        api.get(`/db-agent/${connectionId}`).catch(() => null),
      ])

      setSchema(unwrapSchema(schemaRes))

      const name = unwrapConnectionName(connRes)
      if (name) setConnectionName(name)
    } catch (err: any) {
      setSchemaError(
        err?.response?.data?.error ?? err?.message ?? 'Failed to load schema',
      )
    } finally {
      setSchemaLoading(false)
    }
  }, [connectionId])

  useEffect(() => {
    setSelectedTable(null)
    setQueryResult(null)
    setRelations([])
    setBreadcrumb([])
    setPage(0)
    setOrderBy(null)
    setRowFilter('')
    loadSchema()
  }, [connectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────────────────────────────────────────────────────────────────────
     LOAD RELATIONS
     ✅ GET /api/db-agent/:id/relations/:table  (was /relation/:table)
  ───────────────────────────────────────────────────────────────────────── */
  const loadRelations = useCallback(async (tableName: string) => {
    try {
      const res = await api.get(`/db-agent/${connectionId}/relations/${tableName}`)
      setRelations(unwrapRelations(res))
    } catch {
      setRelations([])
    }
  }, [connectionId])

  /* ─────────────────────────────────────────────────────────────────────────
     QUERY TABLE ROWS
     ✅ POST /api/db-agent/:id/query/:table  (was /:id/:table/query)
  ───────────────────────────────────────────────────────────────────────── */
  const queryTable = useCallback(async (
    tableName: string,
    pg = 0,
    ob: { column: string; direction: 'asc' | 'desc' } | null = null,
  ) => {
    setQueryLoading(true)
    setQueryError(null)
    try {
      const res = await api.post(`/db-agent/${connectionId}/query/${tableName}`, {
        limit:  PAGE_SIZE,
        offset: pg * PAGE_SIZE,
        ...(ob ? { orderBy: ob } : {}),
      })
      const result = unwrapQueryResult(res)
      if (!result) throw new Error('Unexpected response shape from query endpoint')
      setQueryResult(result)
    } catch (err: any) {
      setQueryError(
        err?.response?.data?.error ?? err?.message ?? 'Failed to load rows',
      )
      setQueryResult(null)
    } finally {
      setQueryLoading(false)
    }
  }, [connectionId])

  /* ─────────────────────────────────────────────────────────────────────────
     TRAVERSE RELATION
     ✅ POST /api/db-agent/:id/traverse  (was /query/relation/traverse)

     belongsTo: read FK value from current row
       e.g. transaction.user_id = 5 → WHERE id = 5 on users

     hasMany: read identifier from current row (always prefer `id` over `pk`)
       e.g. user.id = 5 → WHERE user_id = 5 on transactions
  ───────────────────────────────────────────────────────────────────────── */
  const traverseRelation = useCallback(async (
    rel:                Relation,
    row:                Record<string, any>,
    currentTable:       string,
    currentTableCols:   Column[] | undefined,
  ) => {
    setQueryLoading(true)
    setQueryError(null)

    try {
      let sourceColumn: string
      let sourceValue:  string | number

      if (rel.type === 'belongsTo') {
        // Read the FK value stored in this row's column
        sourceColumn = rel.fromColumn
        sourceValue  = row[rel.fromColumn]
        if (sourceValue == null) {
          setQueryError(`FK column "${rel.fromColumn}" is null — cannot traverse`)
          setQueryLoading(false)
          return
        }
      } else {
        // hasMany — use this row's identifier (prefer `id`, never `pk`)
        const rowId = resolveRowId(row, currentTableCols)
        if (!rowId) {
          setQueryError('Cannot determine row identifier for hasMany traversal')
          setQueryLoading(false)
          return
        }
        sourceColumn = rowId.column
        sourceValue  = rowId.value
      }

      // ✅ POST /api/db-agent/:id/traverse
      const res = await api.post(`/db-agent/${connectionId}/traverse`, {
        sourceTable:  currentTable,
        sourceColumn,
        sourceValue,
        relationType: rel.type,
        targetTable:  rel.toTable,
        targetColumn: rel.toColumn,
        limit:        PAGE_SIZE,
        offset:       0,
      })

      const result = unwrapQueryResult(res)
      if (!result) throw new Error('Unexpected response shape from traverse endpoint')

      setQueryResult(result)
      setSelectedTable(rel.toTable)
      setPage(0)
      setOrderBy(null)
      await loadRelations(rel.toTable)

      setBreadcrumb(prev => [
        ...prev,
        {
          table: rel.toTable,
          label: rel.toTable,
          traversalContext: {
            relationType: rel.type,
            sourceTable:  currentTable,
            sourceColumn,
            sourceValue,
            targetTable:  rel.toTable,
            targetColumn: rel.toColumn,
          },
        },
      ])
    } catch (err: any) {
      setQueryError(
        err?.response?.data?.error ?? err?.message ?? 'Failed to traverse relation',
      )
    } finally {
      setQueryLoading(false)
    }
  }, [connectionId, loadRelations])

  /* ─────────────────────────────────────────────────────────────────────────
     SELECT TABLE FROM SIDEBAR
  ───────────────────────────────────────────────────────────────────────── */
  const handleSelectTable = useCallback(async (table: string) => {
    setSelectedTable(table)
    setBreadcrumb([{ table, label: table }])
    setPage(0)
    setOrderBy(null)
    setRowFilter('')
    await Promise.all([queryTable(table, 0, null), loadRelations(table)])
  }, [queryTable, loadRelations])

  /* ─────────────────────────────────────────────────────────────────────────
     BREADCRUMB NAVIGATION
     Re-traverses using the stored context — ✅ POST /api/db-agent/:id/traverse
  ───────────────────────────────────────────────────────────────────────── */
  const handleBreadcrumbClick = useCallback(async (index: number) => {
    const crumb   = breadcrumb[index]
    const trimmed = breadcrumb.slice(0, index + 1)
    setBreadcrumb(trimmed)
    setSelectedTable(crumb.table)
    setPage(0)
    setOrderBy(null)

    if (crumb.traversalContext) {
      const ctx = crumb.traversalContext
      setQueryLoading(true)
      setQueryError(null)
      try {
        // ✅ POST /api/db-agent/:id/traverse
        const res = await api.post(`/db-agent/${connectionId}/traverse`, {
          sourceTable:  ctx.sourceTable,
          sourceColumn: ctx.sourceColumn,
          sourceValue:  ctx.sourceValue,
          relationType: ctx.relationType,
          targetTable:  ctx.targetTable,
          targetColumn: ctx.targetColumn,
          limit:        PAGE_SIZE,
          offset:       0,
        })
        const result = unwrapQueryResult(res)
        if (!result) throw new Error('Unexpected response shape')
        setQueryResult(result)
      } catch (err: any) {
        setQueryError(
          err?.response?.data?.error ?? err?.message ?? 'Failed to navigate back',
        )
      } finally {
        setQueryLoading(false)
      }
      await loadRelations(crumb.table)
    } else {
      await Promise.all([queryTable(crumb.table, 0, null), loadRelations(crumb.table)])
    }
  }, [breadcrumb, connectionId, queryTable, loadRelations])

  /* ── Sort ── */
  const handleSort = useCallback((col: string) => {
    const next =
      orderBy?.column === col && orderBy.direction === 'asc'
        ? { column: col, direction: 'desc' as const }
        : { column: col, direction: 'asc'  as const }
    setOrderBy(next)
    queryTable(selectedTable!, page, next)
  }, [orderBy, page, selectedTable, queryTable])

  /* ── Pagination ── */
  const handlePage = useCallback((dir: 1 | -1) => {
    const next = page + dir
    setPage(next)
    queryTable(selectedTable!, next, orderBy)
  }, [page, selectedTable, orderBy, queryTable])

  const toggleExpand = useCallback((tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev)
      next.has(tableName) ? next.delete(tableName) : next.add(tableName)
      return next
    })
  }, [])

  /* ── Derived ── */
  const filteredSchema = useMemo(
    () => schema.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase())),
    [schema, tableSearch],
  )

  const filteredRows = useMemo(() => {
    if (!queryResult) return []
    if (!rowFilter.trim()) return queryResult.rows
    const q = rowFilter.toLowerCase()
    return queryResult.rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q)),
    )
  }, [queryResult, rowFilter])

  const currentTableSchema = useMemo(
    () => schema.find(t => t.name === selectedTable),
    [schema, selectedTable],
  )

  const hasNextPage = queryResult
    ? (page + 1) * PAGE_SIZE < queryResult.total
    : false

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`shrink-0 border-r border-border transition-all duration-200 ease-in-out overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
        <div className="w-64 h-full flex flex-col bg-card">
          {/* Header */}
          <div className="h-14 px-4 flex items-center gap-3 border-b border-border shrink-0">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <LucideLink className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">DBViz</p>
              <p className="text-[10px] text-muted-foreground truncate">{connectionName}</p>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Search tables..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-foreground placeholder:text-muted-foreground"
              />
              {tableSearch && (
                <button onClick={() => setTableSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Count */}
          <div className="px-5 pb-1 shrink-0">
            {schemaLoading
              ? <div className="h-3 w-16 bg-border rounded animate-pulse" />
              : <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {filteredSchema.length} table{filteredSchema.length !== 1 ? 's' : ''}
                </p>
            }
          </div>

          {/* Error */}
          {schemaError && !schemaLoading && (
            <div className="mx-3 mb-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p>{schemaError}</p>
                <button onClick={loadSchema} className="underline mt-1 hover:text-red-300 transition-colors">Retry</button>
              </div>
            </div>
          )}

          {/* Skeleton */}
          {schemaLoading && (
            <div className="px-3 space-y-1 flex-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-2 px-2 py-2 animate-pulse">
                  <div className="w-3 h-3 bg-border rounded" />
                  <div className="h-3 bg-border rounded" style={{ width: `${50 + i * 8}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* Table list */}
          {!schemaLoading && (
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
              {filteredSchema.map(table => {
                const isSelected = selectedTable === table.name
                const isExpanded = expandedTables.has(table.name)
                return (
                  <div key={table.name}>
                    <div className={`flex items-center rounded-lg transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-blue-500/5'}`}>
                      <button onClick={() => toggleExpand(table.name)} className="p-2 text-muted-foreground hover:text-blue-400 transition-colors shrink-0">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleSelectTable(table.name)}
                        className={`flex-1 flex items-center gap-2 pr-3 py-1.5 text-sm text-left transition-colors min-w-0 ${isSelected ? 'text-blue-400 font-medium' : 'text-foreground hover:text-blue-400'}`}
                      >
                        <Table2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{table.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0 tabular-nums">{table.columns.length}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-7 mr-2 mb-1 pl-3 py-1 border-l border-border space-y-0.5">
                        {table.columns.map(col => (
                          <div key={col.name} className="flex items-center gap-1.5 py-0.5">
                            {col.isPrimaryKey ? <Key className="w-3 h-3 text-yellow-400 shrink-0" /> : typeIcon(col.dataType)}
                            <span className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors">{col.name}</span>
                            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0 hidden sm:block">
                              {col.dataType.split('(')[0].replace(' without time zone', '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Back */}
          <div className="border-t border-border p-3 shrink-0">
            <button
              onClick={() => router.push('/connections')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Connections
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(p => !p)} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          <nav className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={() => { setSelectedTable(null); setBreadcrumb([]) }}
              className={`text-xs shrink-0 transition-colors ${breadcrumb.length === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-blue-400'}`}
            >
              {connectionName}
            </button>
            {breadcrumb.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`text-xs truncate transition-colors ${i === breadcrumb.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-blue-400'}`}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {queryResult && !queryLoading && (
              <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">
                {queryResult.total} total
              </span>
            )}
            {selectedTable && (
              <button onClick={() => queryTable(selectedTable, page, orderBy)} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${queryLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </header>

        {/* Schema toolbar */}
        {selectedTable && currentTableSchema && (
          <div className="shrink-0 border-b border-border bg-card/50 px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Info className="w-3 h-3" /> Schema:
              </span>
              {currentTableSchema.columns.slice(0, 5).map(col => (
                <ColBadge key={col.name} col={col} />
              ))}
              {currentTableSchema.columns.length > 5 && (
                <span className="text-xs text-muted-foreground">+{currentTableSchema.columns.length - 5} more</span>
              )}
            </div>
            <div className="relative shrink-0">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Filter rows..."
                value={rowFilter}
                onChange={e => setRowFilter(e.target.value)}
                className="h-7 pl-7 pr-7 text-xs bg-background border border-border rounded-lg w-36 sm:w-44 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-foreground placeholder:text-muted-foreground"
              />
              {rowFilter && (
                <button onClick={() => setRowFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTable ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3 max-w-xs">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Database className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Select a table</h2>
                <p className="text-sm text-muted-foreground">Choose a table from the sidebar to explore your data and traverse relationships.</p>
              </div>
            </div>
          ) : (
            <>
              {queryLoading ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm">Loading rows...</span>
                </div>
              ) : queryError ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                    <p className="text-sm text-red-400">{queryError}</p>
                    <button onClick={() => queryTable(selectedTable, page, orderBy)} className="text-xs text-blue-400 hover:underline flex items-center gap-1 mx-auto">
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                </div>
              ) : !queryResult || filteredRows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Rows3 className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">No rows found</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm border-collapse min-w-max">
                    <thead className="sticky top-0 z-10 bg-card border-b border-border">
                      <tr>
                        {queryResult.columns.map(col => {
                          const colSchema = currentTableSchema?.columns.find(c => c.name === col)
                          const isOrdered = orderBy?.column === col
                          const fkRel     = findFkRelation(col, relations)
                          return (
                            <th key={col} className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap group">
                              <button onClick={() => handleSort(col)} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                                {colSchema?.isPrimaryKey && <Key className="w-3 h-3 text-yellow-400 shrink-0" />}
                                {fkRel && !colSchema?.isPrimaryKey && <Link2 className="w-3 h-3 text-blue-400 shrink-0" />}
                                <span>{col}</span>
                                {isOrdered
                                  ? orderBy?.direction === 'asc'
                                    ? <SortAsc  className="w-3 h-3 text-blue-400" />
                                    : <SortDesc className="w-3 h-3 text-blue-400" />
                                  : <SortAsc className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                                }
                              </button>
                            </th>
                          )
                        })}
                        {relations.length > 0 && (
                          <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold whitespace-nowrap">
                            Relations
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, ri) => {
                        const rowId = resolveRowId(row, currentTableSchema?.columns)
                        return (
                          <tr key={ri} className="border-b border-border/50 hover:bg-blue-500/5 transition-colors">
                            {queryResult.columns.map(col => {
                              const val   = row[col]
                              const fkRel = findFkRelation(col, relations)
                              return (
                                <td key={col} className="px-4 py-2.5 text-xs whitespace-nowrap max-w-[200px]">
                                  {val === null || val === undefined ? (
                                    <span className="text-muted-foreground/40 italic">null</span>
                                  ) : fkRel ? (
                                    <button
                                      onClick={() => traverseRelation(fkRel, row, selectedTable, currentTableSchema?.columns)}
                                      className="text-blue-400 hover:underline flex items-center gap-1 transition-colors"
                                    >
                                      {formatCellValue(val)}
                                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </button>
                                  ) : (
                                    <span className={`text-foreground truncate block ${typeof val === 'boolean' ? (val ? 'text-emerald-400' : 'text-muted-foreground') : ''}`}>
                                      {formatCellValue(val)}
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                            {relations.length > 0 && (
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {dedupeRelations(relations).map((rel, relIdx) => (
                                    <button
                                      key={`${rel.type}:${rel.toTable}:${rel.fromColumn}:${relIdx}`}
                                      disabled={rel.type === 'hasMany' && rowId === null}
                                      onClick={() => traverseRelation(rel, row, selectedTable, currentTableSchema?.columns)}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Link2 className="w-2.5 h-2.5" />
                                      {rel.type === 'hasMany' ? `↳ ${rel.toTable}` : `→ ${rel.toTable}`}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {queryResult && queryResult.rows.length > 0 && (
                <div className="shrink-0 border-t border-border px-4 py-2.5 flex items-center justify-between bg-card">
                  <span className="text-xs text-muted-foreground">
                    Page {page + 1} · {Math.ceil(queryResult.total / PAGE_SIZE)} pages · {queryResult.total} rows
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePage(-1)} disabled={page === 0 || queryLoading} className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Previous
                    </button>
                    <button onClick={() => handlePage(1)} disabled={!hasNextPage || queryLoading} className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="shrink-0 h-7 border-t border-border bg-card/80 px-4 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5 shrink-0">
            <Database className="w-3 h-3" />
            <span className="font-medium text-foreground">{connectionName}</span>
          </span>
          {selectedTable && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Table2 className="w-3 h-3" />{selectedTable}
                {currentTableSchema && <span className="text-muted-foreground/60">({currentTableSchema.columns.length} cols)</span>}
              </span>
            </>
          )}
          {queryResult && !queryLoading && selectedTable && (
            <><span className="text-border">·</span><span>{queryResult.total} total rows</span></>
          )}
          {relations.length > 0 && selectedTable && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {dedupeRelations(relations).length} relation{dedupeRelations(relations).length !== 1 ? 's' : ''}
              </span>
            </>
          )}
          <span className="ml-auto">
            {queryLoading && (
              <span className="flex items-center gap-1 text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" /> loading...
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
