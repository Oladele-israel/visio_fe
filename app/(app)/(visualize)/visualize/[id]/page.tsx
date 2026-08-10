'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Table2, Key, Link2, ExternalLink,
  ChevronRight, ChevronDown, ArrowLeft, RefreshCw,
  Search, AlertCircle, Loader2, SortAsc, SortDesc,
  Rows3, Filter, Plus, Pencil, Trash2, CheckCircle2,
  Info, ToggleLeft, Calendar, Hash, X, PanelLeftClose,
  PanelLeftOpen, Sparkles, Copy, Check, Eye, MoveHorizontal, WrapText, Maximize2
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface Column {
  name:          string
  dataType:      string
  isNullable:    boolean
  isPrimaryKey:  boolean
  isIdentifier?: boolean
}

interface Table {
  name:    string
  columns: Column[]
}

interface Relation {
  fromTable:  string
  fromColumn: string
  toTable:    string
  toColumn:   string
  type:       'belongsTo' | 'hasMany'
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

function resolveRowId(
  row: Record<string, any>,
  cols?: Column[],
): { column: string; value: any } | null {
  if (cols) {
    const pkCol = cols.find(c => c.isPrimaryKey)
    if (pkCol && row[pkCol.name] !== undefined) {
      return { column: pkCol.name, value: row[pkCol.name] }
    }
  }
  if (row.id !== undefined && row.id !== null) {
    return { column: 'id', value: row.id }
  }
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().endsWith('_id') && row[k] !== undefined) {
      return { column: k, value: row[k] }
    }
  }
  const firstKey = Object.keys(row)[0]
  if (firstKey && row[firstKey] !== undefined) {
    return { column: firstKey, value: row[firstKey] }
  }
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
  const [sidebarOpen,       setSidebarOpen]       = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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

  /* ── Display Mode & Controls ── */
  const [cellWrapMode, setCellWrapMode] = useState<'scroll' | 'wrap' | 'truncate'>('scroll')
  const [tableSearch, setTableSearch]   = useState('')
  const [rowFilter,   setRowFilter]     = useState('')
  const [page,        setPage]          = useState(0)
  const [orderBy,     setOrderBy]       = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)

  /* ── Row Mutation State ── */
  const [insertModalOpen, setInsertModalOpen] = useState(false)
  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedRowData, setSelectedRowData] = useState<Record<string, any> | null>(null)
  const [formData,        setFormData]        = useState<Record<string, any>>({})
  const [mutationLoading, setMutationLoading] = useState(false)
  const [mutationError,   setMutationError]   = useState<string | null>(null)
  const [toastMessage,    setToastMessage]    = useState<string | null>(null)

  /* ── Cell Inspector Modal State ── */
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [inspectCellData, setInspectCellData]  = useState<{ col: string; val: any } | null>(null)

  const handleInspectCell = (col: string, val: any) => {
    setInspectCellData({ col, val })
    setInspectModalOpen(true)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const copyCellContent = (val: any) => {
    if (val == null) return
    const text = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
    navigator.clipboard.writeText(text)
    showToast('Copied cell to clipboard!')
  }

  /* ── Load Schema ── */
  const loadSchema = useCallback(async () => {
    setSchemaLoading(true)
    setSchemaError(null)
    try {
      const [resSchema, resAgent] = await Promise.all([
        api.get(`/db-agent/${connectionId}/schema`),
        api.get(`/db-agent/${connectionId}`).catch(() => null),
      ])

      const loaded = unwrapSchema(resSchema)
      setSchema(loaded)

      if (resAgent) {
        const name = unwrapConnectionName(resAgent)
        if (name) setConnectionName(name)
      }

      if (loaded.length > 0 && !selectedTable) {
        const first = loaded[0].name
        setSelectedTable(first)
        setBreadcrumb([{ table: first, label: first }])
        queryTable(first, 0, null)
        loadRelations(first)
      }
    } catch (err: any) {
      setSchemaError(
        err?.response?.data?.error ?? err?.message ?? 'Failed to load database schema',
      )
    } finally {
      setSchemaLoading(false)
    }
  }, [connectionId])

  useEffect(() => {
    loadSchema()
  }, [loadSchema])

  /* ── Query Table ── */
  const queryTable = useCallback(
    async (
      tableName: string,
      p = 0,
      order: { column: string; direction: 'asc' | 'desc' } | null = null,
    ) => {
      setQueryLoading(true)
      setQueryError(null)
      try {
        const res = await api.get(`/db-agent/${connectionId}/query`, {
          params: {
            table: tableName,
            limit: PAGE_SIZE,
            offset: p * PAGE_SIZE,
            orderBy: order?.column,
            orderDir: order?.direction,
          },
        })
        const result = unwrapQueryResult(res)
        setQueryResult(result)
      } catch (err: any) {
        setQueryError(
          err?.response?.data?.error ?? err?.message ?? 'Failed to execute query',
        )
      } finally {
        setQueryLoading(false)
      }
    },
    [connectionId],
  )

  /* ── Load Relations ── */
  const loadRelations = useCallback(async (tableName: string) => {
    try {
      const res = await api.get(`/db-agent/${connectionId}/relations`, {
        params: { table: tableName },
      })
      setRelations(unwrapRelations(res))
    } catch {
      setRelations([])
    }
  }, [connectionId])

  /* ── Handle Row Mutation Handlers ── */
  const handleOpenInsert = () => {
    const initData: Record<string, any> = {}
    currentTableSchema?.columns.forEach(c => {
      initData[c.name] = ''
    })
    setFormData(initData)
    setMutationError(null)
    setInsertModalOpen(true)
  }

  const handleInsertSubmit = async () => {
    if (!selectedTable) return
    setMutationLoading(true)
    setMutationError(null)
    try {
      await api.post(`/db-agent/${connectionId}/rows`, {
        tableName: selectedTable,
        data: formData,
      })
      setInsertModalOpen(false)
      showToast('Row inserted successfully!')
      queryTable(selectedTable, page, orderBy)
    } catch (err: any) {
      setMutationError(err?.response?.data?.error ?? err?.message ?? 'Failed to insert row')
    } finally {
      setMutationLoading(false)
    }
  }

  const handleOpenEdit = (row: Record<string, any>) => {
    setSelectedRowData(row)
    setFormData({ ...row })
    setMutationError(null)
    setEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedTable || !selectedRowData || !currentTableSchema) return
    const rowId = resolveRowId(selectedRowData, currentTableSchema.columns)
    if (!rowId) {
      setMutationError('Could not resolve primary key for row update')
      return
    }

    setMutationLoading(true)
    setMutationError(null)
    try {
      await api.put(`/db-agent/${connectionId}/rows`, {
        tableName: selectedTable,
        primaryKey: { [rowId.column]: rowId.value },
        data: formData,
      })
      setEditModalOpen(false)
      showToast('Row updated successfully!')
      queryTable(selectedTable, page, orderBy)
    } catch (err: any) {
      setMutationError(err?.response?.data?.error ?? err?.message ?? 'Failed to update row')
    } finally {
      setMutationLoading(false)
    }
  }

  const handleOpenDelete = (row: Record<string, any>) => {
    setSelectedRowData(row)
    setMutationError(null)
    setDeleteModalOpen(true)
  }

  const handleDeleteSubmit = async () => {
    if (!selectedTable || !selectedRowData || !currentTableSchema) return
    const rowId = resolveRowId(selectedRowData, currentTableSchema.columns)
    if (!rowId) {
      setMutationError('Could not resolve primary key for row deletion')
      return
    }

    setMutationLoading(true)
    setMutationError(null)
    try {
      await api.delete(`/db-agent/${connectionId}/rows`, {
        data: {
          tableName: selectedTable,
          primaryKey: { [rowId.column]: rowId.value },
        },
      })
      setDeleteModalOpen(false)
      showToast('Row deleted successfully!')
      queryTable(selectedTable, page, orderBy)
    } catch (err: any) {
      setMutationError(err?.response?.data?.error ?? err?.message ?? 'Failed to delete row')
    } finally {
      setMutationLoading(false)
    }
  }

  /* ── Traverse Relation ── */
  const traverseRelation = useCallback(async (
    rel: Relation,
    row: Record<string, any>,
    currentTable: string,
    currentCols?: Column[],
  ) => {
    const sourceColumn = rel.fromColumn
    const sourceValue  = row[sourceColumn]

    if (sourceValue === undefined || sourceValue === null) {
      showToast(`Cannot traverse relation: ${sourceColumn} is NULL`)
      return
    }

    setQueryLoading(true)
    setQueryError(null)

    try {
      const res = await api.post(`/db-agent/${connectionId}/traverse`, {
        sourceTable:  currentTable,
        sourceColumn,
        sourceValue,
        relationType: rel.type,
        targetTable:  rel.toTable,
        targetColumn: rel.toColumn,
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

  /* ── Select Table from Sidebar ── */
  const handleSelectTable = useCallback(async (table: string) => {
    setSelectedTable(table)
    setBreadcrumb([{ table, label: table }])
    setPage(0)
    setOrderBy(null)
    setRowFilter('')
    setMobileSidebarOpen(false)
    await Promise.all([queryTable(table, 0, null), loadRelations(table)])
  }, [queryTable, loadRelations])

  /* ── Breadcrumb Navigation ── */
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
        const res = await api.post(`/db-agent/${connectionId}/traverse`, {
          sourceTable:  ctx.sourceTable,
          sourceColumn: ctx.sourceColumn,
          sourceValue:  ctx.sourceValue,
          relationType: ctx.relationType,
          targetTable:  ctx.targetTable,
          targetColumn: ctx.targetColumn,
        })
        const result = unwrapQueryResult(res)
        if (!result) throw new Error('Failed to unwrap traversal result')
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
    <div className="flex h-screen bg-background overflow-hidden relative font-sans">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto bg-card border-r border-border/80 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
        mobileSidebarOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
      } ${sidebarOpen ? 'md:w-64' : 'md:w-0 md:border-r-0'}`}>
        <div className="w-72 md:w-64 h-full flex flex-col">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-border/80 shrink-0 bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                  Visio <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">DB</span>
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">{connectionName}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Search tables..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs bg-background/80 border border-border/80 rounded-xl focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 text-foreground placeholder:text-muted-foreground transition-all"
              />
              {tableSearch && (
                <button onClick={() => setTableSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-sky-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Count */}
          <div className="px-5 pb-1 shrink-0 flex items-center justify-between">
            {schemaLoading
              ? <div className="h-3 w-16 bg-border/60 rounded animate-pulse" />
              : <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {filteredSchema.length} table{filteredSchema.length !== 1 ? 's' : ''}
                </p>
            }
          </div>

          {/* Error */}
          {schemaError && !schemaLoading && (
            <div className="mx-3 mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p>{schemaError}</p>
                <button onClick={loadSchema} className="underline mt-1 hover:text-rose-300 transition-colors">Retry</button>
              </div>
            </div>
          )}

          {/* Skeleton */}
          {schemaLoading && (
            <div className="px-3 space-y-1.5 flex-1 pt-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-border/20 animate-pulse">
                  <div className="w-3.5 h-3.5 bg-border/50 rounded" />
                  <div className="h-3 bg-border/50 rounded flex-1" style={{ width: `${60 + (i % 3) * 10}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* Table list */}
          {!schemaLoading && (
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 custom-scrollbar">
              {filteredSchema.map(table => {
                const isSelected = selectedTable === table.name
                const isExpanded = expandedTables.has(table.name)
                return (
                  <div key={table.name}>
                    <div className={`flex items-center rounded-xl transition-all duration-150 ${isSelected ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-sky-500/5'}`}>
                      <button onClick={() => toggleExpand(table.name)} className="p-2 text-muted-foreground hover:text-sky-400 transition-colors shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleSelectTable(table.name)}
                        className={`flex-1 flex items-center gap-2 pr-3 py-2 text-xs font-medium text-left transition-colors min-w-0 ${isSelected ? 'text-sky-400 font-bold' : 'text-foreground hover:text-sky-400'}`}
                      >
                        <Table2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-muted-foreground'}`} />
                        <span className="truncate">{table.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border/50 text-muted-foreground ml-auto shrink-0 tabular-nums">{table.columns.length}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-7 mr-2 mb-1 pl-3 py-1 border-l border-border/60 space-y-1">
                        {table.columns.map(col => (
                          <div key={col.name} className="flex items-center gap-1.5 py-0.5">
                            {col.isPrimaryKey ? <Key className="w-3 h-3 text-amber-400 shrink-0" /> : typeIcon(col.dataType)}
                            <span className="text-[11px] text-muted-foreground truncate hover:text-foreground transition-colors">{col.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto shrink-0 hidden sm:block">
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
          <div className="border-t border-border/80 p-3 shrink-0 bg-card/40">
            <button
              onClick={() => router.push('/connections')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Connections
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">

        {/* Top Header Bar */}
        <header className="h-14 shrink-0 border-b border-border/80 bg-card/70 backdrop-blur-md flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="hidden md:flex p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all shrink-0"
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileSidebarOpen(p => !p)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all shrink-0"
            title="Open Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          <nav className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={() => { setSelectedTable(null); setBreadcrumb([]) }}
              className={`text-xs font-semibold shrink-0 transition-colors ${breadcrumb.length === 0 ? 'text-sky-400 font-bold' : 'text-muted-foreground hover:text-sky-400'}`}
            >
              {connectionName}
            </button>
            {breadcrumb.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`text-xs truncate transition-colors ${i === breadcrumb.length - 1 ? 'text-sky-400 font-bold' : 'text-muted-foreground hover:text-sky-400'}`}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {queryResult && !queryLoading && (
              <span className="text-xs font-mono text-muted-foreground hidden sm:block tabular-nums bg-card px-2.5 py-1 rounded-lg border border-border/50">
                {queryResult.total} row{queryResult.total !== 1 ? 's' : ''}
              </span>
            )}
            {selectedTable && (
              <button
                onClick={() => queryTable(selectedTable, page, orderBy)}
                className="p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all"
                title="Refresh Table Data"
              >
                <RefreshCw className={`w-4 h-4 ${queryLoading ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}
          </div>
        </header>

        {/* Schema Toolbar & Display Controls */}
        {selectedTable && currentTableSchema && (
          <div className="shrink-0 border-b border-border/80 bg-card/40 backdrop-blur-sm px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                <Info className="w-3.5 h-3.5 text-sky-400" /> Columns ({currentTableSchema.columns.length}):
              </span>
              {currentTableSchema.columns.slice(0, 5).map(col => (
                <ColBadge key={col.name} col={col} />
              ))}
              {currentTableSchema.columns.length > 5 && (
                <span className="text-xs text-muted-foreground font-mono">+{currentTableSchema.columns.length - 5} more</span>
              )}
            </div>

            {/* Toolbar Right Controls */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Display Mode Pills */}
              <div className="flex items-center gap-1 p-1 bg-background/80 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setCellWrapMode('scroll')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    cellWrapMode === 'scroll'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Horizontal Scroll Mode (Full untruncated cell content)"
                >
                  <MoveHorizontal className="w-3 h-3" />
                  <span className="hidden md:inline">Full Scroll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCellWrapMode('wrap')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    cellWrapMode === 'wrap'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Wrap Multi-line Text Mode"
                >
                  <WrapText className="w-3 h-3" />
                  <span className="hidden md:inline">Wrap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCellWrapMode('truncate')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    cellWrapMode === 'truncate'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Compact Grid Mode"
                >
                  <Rows3 className="w-3 h-3" />
                  <span className="hidden md:inline">Compact</span>
                </button>
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                <input
                  placeholder="Filter rows..."
                  value={rowFilter}
                  onChange={e => setRowFilter(e.target.value)}
                  className="h-8 pl-7 pr-7 text-xs bg-background border border-border/80 rounded-xl w-32 sm:w-44 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 text-foreground placeholder:text-muted-foreground transition-all"
                />
                {rowFilter && (
                  <button onClick={() => setRowFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-sky-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add Row Button */}
              <button
                onClick={handleOpenInsert}
                className="h-8 px-3.5 text-xs bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!selectedTable ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-visio-grid">
              <div className="text-center space-y-4 max-w-sm p-8 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/10 to-blue-500/10 border border-sky-500/20 flex items-center justify-center mx-auto shadow-inner">
                  <Database className="w-8 h-8 text-sky-400" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold text-foreground">Select a Table</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pick a database table from the sidebar to inspect records, traverse relationships, and run mutations.
                  </p>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold hover:bg-sky-500/20 transition-all"
                >
                  Browse Tables
                </button>
              </div>
            </div>
          ) : (
            <>
              {queryLoading ? (
                <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Executing query...</span>
                  </div>
                  <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/40">
                    <div className="h-10 bg-card border-b border-border/80 px-4 flex items-center gap-4 animate-pulse">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-border/60 rounded w-24" />)}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(ri => (
                      <div key={ri} className="h-12 border-b border-border/40 px-4 flex items-center gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(ci => <div key={ci} className="h-3 bg-border/40 rounded w-20" />)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : queryError ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-3 max-w-md p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="text-xs font-mono text-rose-400 leading-relaxed">{queryError}</p>
                    <button onClick={() => queryTable(selectedTable, page, orderBy)} className="px-4 py-2 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Query
                    </button>
                  </div>
                </div>
              ) : !queryResult || filteredRows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-2 max-w-xs">
                    <Rows3 className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No rows found</p>
                    <p className="text-xs text-muted-foreground">This table contains no matching records for the current filter.</p>
                  </div>
                </div>
              ) : (
                /* ── SENIOR PRODUCTION DATA TABLE CONTAINER (FULL HORIZONTAL SCROLL) ── */
                <div className="flex-1 overflow-auto custom-scrollbar p-2 sm:p-4 min-w-0">
                  <div className="border border-border/80 rounded-2xl overflow-x-auto custom-scrollbar shadow-2xl bg-card/70 backdrop-blur-md max-w-full block">
                    <table className="w-full text-xs border-collapse min-w-max">
                      <thead className="sticky top-0 z-10 bg-card border-b border-border/80 shadow-sm">
                        <tr>
                          {queryResult.columns.map(col => {
                            const colSchema = currentTableSchema?.columns.find(c => c.name === col)
                            const isOrdered = orderBy?.column === col
                            const fkRel     = findFkRelation(col, relations)
                            return (
                              <th
                                key={col}
                                className={`px-4 py-3 text-left font-bold text-xs whitespace-nowrap min-w-[140px] group ${
                                  colSchema?.isPrimaryKey ? 'bg-amber-500/5 text-amber-300' : 'text-muted-foreground'
                                }`}
                              >
                                <button onClick={() => handleSort(col)} className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                                  {colSchema?.isPrimaryKey && <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Primary Key" />}
                                  {fkRel && !colSchema?.isPrimaryKey && <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Foreign Key" />}
                                  <span className="font-semibold text-foreground">{col}</span>
                                  {isOrdered
                                    ? orderBy?.direction === 'asc'
                                      ? <SortAsc  className="w-3.5 h-3.5 text-sky-400" />
                                      : <SortDesc className="w-3.5 h-3.5 text-sky-400" />
                                    : <SortAsc className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                  }
                                </button>
                              </th>
                            )
                          })}
                          {relations.length > 0 && (
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground whitespace-nowrap min-w-[140px]">
                              Relations
                            </th>
                          )}
                          <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground whitespace-nowrap min-w-[100px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredRows.map((row, ri) => {
                          const rowId = resolveRowId(row, currentTableSchema?.columns)
                          return (
                            <tr key={ri} className="hover:bg-sky-500/5 transition-colors group">
                              {queryResult.columns.map(col => {
                                const val   = row[col]
                                const fkRel = findFkRelation(col, relations)

                                /* Cell Styling based on Wrap Mode */
                                const cellLayoutClass = cellWrapMode === 'scroll'
                                  ? 'whitespace-nowrap min-w-[150px]'
                                  : cellWrapMode === 'wrap'
                                  ? 'break-words whitespace-pre-wrap max-w-[320px] min-w-[150px]'
                                  : 'whitespace-nowrap max-w-[220px] truncate'

                                return (
                                  <td
                                    key={col}
                                    onClick={() => copyCellContent(val)}
                                    onDoubleClick={() => handleInspectCell(col, val)}
                                    title="Click to copy · Double-click to inspect"
                                    className={`px-4 py-3 cursor-pointer hover:bg-sky-500/10 transition-colors relative ${cellLayoutClass}`}
                                  >
                                    {val === null || val === undefined ? (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card/80 text-muted-foreground/50 border border-border/50">NULL</span>
                                    ) : fkRel ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); traverseRelation(fkRel, row, selectedTable, currentTableSchema?.columns) }}
                                        className="text-sky-400 font-semibold hover:underline inline-flex items-center gap-1.5 transition-colors"
                                      >
                                        <span className="font-mono">{formatCellValue(val)}</span>
                                        <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                                      </button>
                                    ) : typeof val === 'boolean' ? (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                        {val ? 'TRUE' : 'FALSE'}
                                      </span>
                                    ) : (
                                      <span className={`text-foreground font-mono text-xs ${cellWrapMode === 'truncate' ? 'truncate block' : ''}`}>
                                        {formatCellValue(val)}
                                      </span>
                                    )}
                                  </td>
                                )
                              })}

                              {/* Relations Column */}
                              {relations.length > 0 && (
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {dedupeRelations(relations).map((rel, relIdx) => (
                                      <button
                                        key={`${rel.type}:${rel.toTable}:${rel.fromColumn}:${relIdx}`}
                                        disabled={rel.type === 'hasMany' && rowId === null}
                                        onClick={() => traverseRelation(rel, row, selectedTable, currentTableSchema?.columns)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                                      >
                                        <Link2 className="w-3 h-3" />
                                        {rel.type === 'hasMany' ? `↳ ${rel.toTable}` : `→ ${rel.toTable}`}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              )}

                              {/* Actions Column */}
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleOpenEdit(row)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                    title="Edit Row"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDelete(row)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Delete Row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {queryResult && queryResult.rows.length > 0 && (
                <div className="shrink-0 border-t border-border/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-card/80 backdrop-blur-md">
                  <span className="text-xs font-mono text-muted-foreground">
                    Page {page + 1} of {Math.ceil(queryResult.total / PAGE_SIZE)} · Showing {filteredRows.length} of {queryResult.total} total rows
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePage(-1)}
                      disabled={page === 0 || queryLoading}
                      className="px-3 py-1.5 text-xs rounded-xl border border-border/80 text-muted-foreground hover:text-sky-400 hover:border-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePage(1)}
                      disabled={!hasNextPage || queryLoading}
                      className="px-3 py-1.5 text-xs rounded-xl border border-border/80 text-muted-foreground hover:text-sky-400 hover:border-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
         CELL VALUE INSPECTOR MODAL
      ───────────────────────────────────────────────────────────────────────── */}
      {inspectModalOpen && inspectCellData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Cell Value Inspector</h3>
                  <p className="text-[10px] font-mono text-sky-400">Column: {inspectCellData.col}</p>
                </div>
              </div>
              <button onClick={() => setInspectModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/70 border border-border/80 overflow-auto max-h-96 font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
              {typeof inspectCellData.val === 'object'
                ? JSON.stringify(inspectCellData.val, null, 2)
                : String(inspectCellData.val ?? 'NULL')
              }
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => copyCellContent(inspectCellData.val)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Content
              </button>
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
         INSERT / EDIT MODALS
      ───────────────────────────────────────────────────────────────────────── */}
      {insertModalOpen && currentTableSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Insert Row into {selectedTable}</h3>
                  <p className="text-[10px] text-muted-foreground">Fill column values to insert a record</p>
                </div>
              </div>
              <button onClick={() => setInsertModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {mutationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {mutationError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {currentTableSchema.columns.map(col => (
                <div key={col.name} className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    {col.isPrimaryKey ? <Key className="w-3 h-3 text-amber-400" /> : typeIcon(col.dataType)}
                    <span>{col.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">({col.dataType})</span>
                  </label>
                  <Input
                    placeholder={col.isNullable ? 'NULL (optional)' : 'Value'}
                    value={formData[col.name] ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                    className="bg-background h-9 text-xs font-mono rounded-xl"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/80 shrink-0">
              <button
                type="button"
                onClick={() => setInsertModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <Button
                onClick={handleInsertSubmit}
                disabled={mutationLoading}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white h-9 px-5 text-xs font-bold rounded-xl shadow-md"
              >
                {mutationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Insert Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && currentTableSchema && selectedRowData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Edit Row in {selectedTable}</h3>
                  <p className="text-[10px] text-muted-foreground">Modify column fields and save changes</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {mutationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {mutationError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {currentTableSchema.columns.map(col => (
                <div key={col.name} className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    {col.isPrimaryKey ? <Key className="w-3 h-3 text-amber-400" /> : typeIcon(col.dataType)}
                    <span>{col.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">({col.dataType})</span>
                  </label>
                  <Input
                    placeholder="Value"
                    value={formData[col.name] ?? ''}
                    disabled={col.isPrimaryKey}
                    onChange={e => setFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                    className="bg-background h-9 text-xs font-mono rounded-xl disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/80 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <Button
                onClick={handleEditSubmit}
                disabled={mutationLoading}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white h-9 px-5 text-xs font-bold rounded-xl shadow-md"
              >
                {mutationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && selectedRowData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Delete Record Confirmation</h3>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {mutationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {mutationError}
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this row from table <span className="font-mono text-sky-400 font-bold">{selectedTable}</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mutationLoading}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {mutationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
