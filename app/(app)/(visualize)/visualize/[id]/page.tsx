'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Database, Table2, ChevronRight, ChevronDown,
  Search, X, ArrowLeft, Loader2,
  Key, Link2, Hash, ToggleLeft, Calendar,
  SortAsc, SortDesc, Filter, RefreshCw,
  PanelLeftClose, PanelLeftOpen, Rows3,
  ExternalLink, Info, AlertCircle,
  Link as LucideLink,
} from 'lucide-react'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Column {
  name: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
}

interface Table {
  name: string
  columns: Column[]
}

interface Relation {
  type: 'belongsTo' | 'hasMany'
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  constraint: string
}

interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
}

interface BreadcrumbItem {
  table: string
  label: string
  pk?: string | number
}

/* ─────────────────────────────────────────
   MOCK SCHEMA — mirrors real API response
   shape from GET /connections/:id/schema
───────────────────────────────────────── */
const MOCK_SCHEMA: Table[] = [
  {
    name: 'users',
    columns: [
      { name: 'id',         dataType: 'integer',                  isNullable: false, isPrimaryKey: true  },
      { name: 'name',       dataType: 'character varying(255)',    isNullable: false, isPrimaryKey: false },
      { name: 'email',      dataType: 'character varying(255)',    isNullable: false, isPrimaryKey: false },
      { name: 'created_at', dataType: 'timestamp without time zone', isNullable: true, isPrimaryKey: false },
      { name: 'is_active',  dataType: 'boolean',                  isNullable: true,  isPrimaryKey: false },
    ],
  },
  {
    name: 'orders',
    columns: [
      { name: 'id',         dataType: 'integer',    isNullable: false, isPrimaryKey: true  },
      { name: 'user_id',    dataType: 'integer',    isNullable: false, isPrimaryKey: false },
      { name: 'total',      dataType: 'numeric',    isNullable: false, isPrimaryKey: false },
      { name: 'status',     dataType: 'character varying(50)', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', dataType: 'timestamp without time zone', isNullable: true, isPrimaryKey: false },
    ],
  },
  {
    name: 'products',
    columns: [
      { name: 'id',          dataType: 'integer',                isNullable: false, isPrimaryKey: true  },
      { name: 'name',        dataType: 'character varying(255)', isNullable: false, isPrimaryKey: false },
      { name: 'price',       dataType: 'numeric',                isNullable: false, isPrimaryKey: false },
      { name: 'stock',       dataType: 'integer',                isNullable: true,  isPrimaryKey: false },
      { name: 'category_id', dataType: 'integer',                isNullable: true,  isPrimaryKey: false },
    ],
  },
  {
    name: 'order_items',
    columns: [
      { name: 'id',         dataType: 'integer', isNullable: false, isPrimaryKey: true  },
      { name: 'order_id',   dataType: 'integer', isNullable: false, isPrimaryKey: false },
      { name: 'product_id', dataType: 'integer', isNullable: false, isPrimaryKey: false },
      { name: 'quantity',   dataType: 'integer', isNullable: false, isPrimaryKey: false },
      { name: 'unit_price', dataType: 'numeric', isNullable: false, isPrimaryKey: false },
    ],
  },
  {
    name: 'categories',
    columns: [
      { name: 'id',          dataType: 'integer',                isNullable: false, isPrimaryKey: true  },
      { name: 'name',        dataType: 'character varying(100)', isNullable: false, isPrimaryKey: false },
      { name: 'description', dataType: 'text',                   isNullable: true,  isPrimaryKey: false },
    ],
  },
  {
    name: 'payments',
    columns: [
      { name: 'id',         dataType: 'integer',                isNullable: false, isPrimaryKey: true  },
      { name: 'order_id',   dataType: 'integer',                isNullable: false, isPrimaryKey: false },
      { name: 'amount',     dataType: 'numeric',                isNullable: false, isPrimaryKey: false },
      { name: 'method',     dataType: 'character varying(50)',  isNullable: false, isPrimaryKey: false },
      { name: 'paid_at',    dataType: 'timestamp without time zone', isNullable: true, isPrimaryKey: false },
    ],
  },
]

/* ─────────────────────────────────────────
   MOCK ROWS — mirrors POST /:table/query
───────────────────────────────────────── */
const MOCK_ROWS: Record<string, QueryResult> = {
  users: {
    columns: ['id', 'name', 'email', 'created_at', 'is_active'],
    rows: [
      { id: 1, name: 'Alice Johnson',  email: 'alice@example.com',  created_at: '2024-01-10 09:23:00', is_active: true  },
      { id: 2, name: 'Bob Smith',      email: 'bob@example.com',    created_at: '2024-01-15 14:05:00', is_active: true  },
      { id: 3, name: 'Carol White',    email: 'carol@example.com',  created_at: '2024-02-01 08:00:00', is_active: false },
      { id: 4, name: 'David Lee',      email: 'david@example.com',  created_at: '2024-02-20 17:30:00', is_active: true  },
      { id: 5, name: 'Eva Martinez',   email: 'eva@example.com',    created_at: '2024-03-05 11:15:00', is_active: true  },
      { id: 6, name: 'Frank Brown',    email: 'frank@example.com',  created_at: '2024-03-18 10:00:00', is_active: false },
    ],
  },
  orders: {
    columns: ['id', 'user_id', 'total', 'status', 'created_at'],
    rows: [
      { id: 101, user_id: 1, total: 250.00, status: 'completed', created_at: '2024-02-01 10:00:00' },
      { id: 102, user_id: 2, total: 89.99,  status: 'pending',   created_at: '2024-02-15 14:30:00' },
      { id: 103, user_id: 1, total: 430.50, status: 'completed', created_at: '2024-03-01 09:15:00' },
      { id: 104, user_id: 3, total: 119.00, status: 'cancelled', created_at: '2024-03-10 16:45:00' },
      { id: 105, user_id: 4, total: 720.00, status: 'completed', created_at: '2024-03-20 11:00:00' },
      { id: 106, user_id: 5, total: 55.25,  status: 'pending',   created_at: '2024-04-01 08:30:00' },
    ],
  },
  products: {
    columns: ['id', 'name', 'price', 'stock', 'category_id'],
    rows: [
      { id: 1, name: 'Wireless Keyboard', price: 79.99,  stock: 45,  category_id: 1 },
      { id: 2, name: 'USB-C Hub',         price: 49.99,  stock: 120, category_id: 1 },
      { id: 3, name: 'Standing Desk',     price: 499.00, stock: 12,  category_id: 2 },
      { id: 4, name: 'Monitor Arm',       price: 89.99,  stock: 30,  category_id: 2 },
      { id: 5, name: 'Blue Light Glasses',price: 29.99,  stock: 200, category_id: 3 },
    ],
  },
  order_items: {
    columns: ['id', 'order_id', 'product_id', 'quantity', 'unit_price'],
    rows: [
      { id: 1, order_id: 101, product_id: 1, quantity: 2, unit_price: 79.99  },
      { id: 2, order_id: 101, product_id: 2, quantity: 1, unit_price: 49.99  },
      { id: 3, order_id: 102, product_id: 3, quantity: 1, unit_price: 89.99  },
      { id: 4, order_id: 103, product_id: 4, quantity: 3, unit_price: 79.99  },
      { id: 5, order_id: 105, product_id: 5, quantity: 2, unit_price: 499.00 },
    ],
  },
  categories: {
    columns: ['id', 'name', 'description'],
    rows: [
      { id: 1, name: 'Electronics',  description: 'Tech gadgets and accessories' },
      { id: 2, name: 'Furniture',    description: 'Office and home furniture'     },
      { id: 3, name: 'Accessories',  description: 'Wearable accessories'          },
    ],
  },
  payments: {
    columns: ['id', 'order_id', 'amount', 'method', 'paid_at'],
    rows: [
      { id: 1, order_id: 101, amount: 250.00, method: 'credit_card', paid_at: '2024-02-01 10:05:00' },
      { id: 2, order_id: 103, amount: 430.50, method: 'paypal',      paid_at: '2024-03-01 09:20:00' },
      { id: 3, order_id: 105, amount: 720.00, method: 'credit_card', paid_at: '2024-03-20 11:10:00' },
    ],
  },
}

/* ─────────────────────────────────────────
   MOCK RELATIONS — mirrors GET /relation/:table
───────────────────────────────────────── */
const MOCK_RELATIONS: Record<string, Relation[]> = {
  users: [
    { type: 'hasMany', fromTable: 'users', fromColumn: 'id', toTable: 'orders', toColumn: 'user_id', constraint: 'orders_user_id_fkey' },
  ],
  orders: [
    { type: 'belongsTo', fromTable: 'orders', fromColumn: 'user_id',  toTable: 'users',       toColumn: 'id', constraint: 'orders_user_id_fkey'       },
    { type: 'hasMany',   fromTable: 'orders', fromColumn: 'id',       toTable: 'order_items', toColumn: 'order_id', constraint: 'order_items_order_id_fkey' },
    { type: 'hasMany',   fromTable: 'orders', fromColumn: 'id',       toTable: 'payments',    toColumn: 'order_id', constraint: 'payments_order_id_fkey'    },
  ],
  products: [
    { type: 'belongsTo', fromTable: 'products', fromColumn: 'category_id', toTable: 'categories', toColumn: 'id', constraint: 'products_category_id_fkey' },
    { type: 'hasMany',   fromTable: 'products', fromColumn: 'id',          toTable: 'order_items', toColumn: 'product_id', constraint: 'order_items_product_id_fkey' },
  ],
  order_items: [
    { type: 'belongsTo', fromTable: 'order_items', fromColumn: 'order_id',   toTable: 'orders',   toColumn: 'id', constraint: 'order_items_order_id_fkey'   },
    { type: 'belongsTo', fromTable: 'order_items', fromColumn: 'product_id', toTable: 'products', toColumn: 'id', constraint: 'order_items_product_id_fkey' },
  ],
  categories: [
    { type: 'hasMany', fromTable: 'categories', fromColumn: 'id', toTable: 'products', toColumn: 'category_id', constraint: 'products_category_id_fkey' },
  ],
  payments: [
    { type: 'belongsTo', fromTable: 'payments', fromColumn: 'order_id', toTable: 'orders', toColumn: 'id', constraint: 'payments_order_id_fkey' },
  ],
}

const CONNECTION_NAMES: Record<string, string> = {
  '1': 'Production DB',
  '2': 'Staging MySQL',
  '3': 'Local Dev',
  '4': 'Analytics MSSQL',
}

const PAGE_SIZE = 20

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function typeIcon(dataType: string) {
  if (/int|serial|numeric|float|double|decimal/.test(dataType))
    return <Hash className="w-3 h-3 text-blue-400" />
  if (/bool/.test(dataType))
    return <ToggleLeft className="w-3 h-3 text-emerald-400" />
  if (/timestamp|date|time/.test(dataType))
    return <Calendar className="w-3 h-3 text-violet-400" />
  return <span className="w-3 h-3 flex items-center justify-center text-muted-foreground text-[10px] font-bold">T</span>
}

function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function findRelation(colName: string, relations: Relation[]): Relation | undefined {
  return relations.find(r => r.fromColumn === colName)
}

/* ─────────────────────────────────────────
   COLUMN BADGE
───────────────────────────────────────── */
function ColBadge({ col }: { col: Column }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-xs transition-colors">
      {col.isPrimaryKey ? <Key className="w-3 h-3 text-yellow-400 shrink-0" /> : typeIcon(col.dataType)}
      <span className="font-medium text-foreground truncate max-w-[90px]">{col.name}</span>
      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[70px]">
        {col.dataType.split('(')[0].replace(' without time zone', '')}
      </span>
      {!col.isNullable && <span className="text-[9px] font-bold text-orange-400 ml-0.5">NN</span>}
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function VisualizePage() {
  const params  = useParams()
  const router  = useRouter()
  const connectionId   = params.id as string
  const connectionName = CONNECTION_NAMES[connectionId] ?? `Connection ${connectionId}`

  /* ── Layout ── */
  const [sidebarOpen,       setSidebarOpen]       = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  /* ── Table state ── */
  const [selectedTable,  setSelectedTable]  = useState<string | null>(null)
  const [relations,      setRelations]      = useState<Relation[]>([])
  const [queryResult,    setQueryResult]    = useState<QueryResult | null>(null)
  const [queryLoading,   setQueryLoading]   = useState(false)
  const [breadcrumb,     setBreadcrumb]     = useState<BreadcrumbItem[]>([])
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  /* ── Controls ── */
  const [tableSearch,  setTableSearch]  = useState('')
  const [rowFilter,    setRowFilter]    = useState('')
  const [page,         setPage]         = useState(0)
  const [orderBy,      setOrderBy]      = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)

  /* ── Simulate async table query ── */
  const mockQueryTable = (tableName: string, pg = 0, ob: typeof orderBy = null) => {
    setQueryLoading(true)
    setQueryError(null)
    setTimeout(() => {
      const data = MOCK_ROWS[tableName]
      if (!data) { setQueryError('Table not found'); setQueryLoading(false); return }

      let rows = [...data.rows]

      // Apply sort
      if (ob) {
        rows.sort((a, b) => {
          const av = a[ob.column], bv = b[ob.column]
          if (av == null) return 1
          if (bv == null) return -1
          return ob.direction === 'asc'
            ? String(av).localeCompare(String(bv), undefined, { numeric: true })
            : String(bv).localeCompare(String(av), undefined, { numeric: true })
        })
      }

      // Paginate
      const start = pg * PAGE_SIZE
      rows = rows.slice(start, start + PAGE_SIZE)

      setQueryResult({ columns: data.columns, rows })
      setQueryLoading(false)
    }, 300)
  }

  const [queryError, setQueryError] = useState<string | null>(null)

  /* ── Select table ── */
  const handleSelectTable = (table: string) => {
    setSelectedTable(table)
    setBreadcrumb([{ table, label: table }])
    setPage(0)
    setOrderBy(null)
    setRowFilter('')
    setRelations(MOCK_RELATIONS[table] ?? [])
    setMobileSidebarOpen(false)
    mockQueryTable(table, 0, null)
  }

  /* ── Traverse relation ── */
  const handleTraverseRelation = (rel: Relation, pkValue: string | number) => {
    const targetTable = rel.toTable
    setQueryLoading(true)
    setTimeout(() => {
      // Filter target table rows by the FK value
      const data = MOCK_ROWS[targetTable]
      if (!data) { setQueryError('Related table not found'); setQueryLoading(false); return }

      const rows = data.rows.filter(r => r[rel.toColumn] === pkValue)
      setQueryResult({ columns: data.columns, rows })
      setSelectedTable(targetTable)
      setRelations(MOCK_RELATIONS[targetTable] ?? [])
      setBreadcrumb(prev => [...prev, { table: targetTable, label: targetTable, pk: pkValue }])
      setQueryLoading(false)
    }, 300)
  }

  /* ── Breadcrumb nav ── */
  const handleBreadcrumbClick = (index: number) => {
    const crumb = breadcrumb[index]
    setBreadcrumb(breadcrumb.slice(0, index + 1))
    setSelectedTable(crumb.table)
    setRelations(MOCK_RELATIONS[crumb.table] ?? [])
    setPage(0)
    setOrderBy(null)
    mockQueryTable(crumb.table, 0, null)
  }

  /* ── Sort ── */
  const handleSort = (col: string) => {
    const next = orderBy?.column === col && orderBy.direction === 'asc'
      ? { column: col, direction: 'desc' as const }
      : { column: col, direction: 'asc'  as const }
    setOrderBy(next)
    mockQueryTable(selectedTable!, page, next)
  }

  /* ── Pagination ── */
  const handlePage = (dir: 1 | -1) => {
    const next = page + dir
    setPage(next)
    mockQueryTable(selectedTable!, next, orderBy)
  }

  /* ── Toggle sidebar table expand ── */
  const toggleExpand = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev)
      next.has(tableName) ? next.delete(tableName) : next.add(tableName)
      return next
    })
  }

  /* ── Filtered schema ── */
  const filteredSchema = useMemo(() =>
    MOCK_SCHEMA.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase())),
    [tableSearch]
  )

  /* ── Filtered rows ── */
  const filteredRows = useMemo(() => {
    if (!queryResult) return []
    if (!rowFilter.trim()) return queryResult.rows
    const q = rowFilter.toLowerCase()
    return queryResult.rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    )
  }, [queryResult, rowFilter])

  /* ── Current table schema ── */
  const currentTableSchema = useMemo(() =>
    MOCK_SCHEMA.find(t => t.name === selectedTable),
    [selectedTable]
  )

  /* ─────────────────────────────────────────
     SIDEBAR
  ───────────────────────────────────────── */
  const SidebarInner = () => (
    <div className="h-full flex flex-col bg-card">

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

      {/* Table count label */}
      <div className="px-5 pb-1 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {filteredSchema.length} table{filteredSchema.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {filteredSchema.map(table => {
          const isSelected = selectedTable === table.name
          const isExpanded = expandedTables.has(table.name)
          return (
            <div key={table.name}>
              <div className={`flex items-center rounded-lg transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-blue-500/5'}`}>

                {/* Expand chevron */}
                <button
                  onClick={() => toggleExpand(table.name)}
                  className="p-2 text-muted-foreground hover:text-blue-400 transition-colors shrink-0"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                  }
                </button>

                {/* Table name */}
                <button
                  onClick={() => handleSelectTable(table.name)}
                  className={`flex-1 flex items-center gap-2 pr-3 py-1.5 text-sm text-left transition-colors min-w-0 ${
                    isSelected ? 'text-blue-400 font-medium' : 'text-foreground hover:text-blue-400'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{table.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0 tabular-nums">
                    {table.columns.length}
                  </span>
                </button>
              </div>

              {/* Expanded columns */}
              {isExpanded && (
                <div className="ml-7 mr-2 mb-1 pl-3 py-1 border-l border-border space-y-0.5">
                  {table.columns.map(col => (
                    <div key={col.name} className="flex items-center gap-1.5 py-0.5">
                      {col.isPrimaryKey
                        ? <Key className="w-3 h-3 text-yellow-400 shrink-0" />
                        : typeIcon(col.dataType)
                      }
                      <span className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors">
                        {col.name}
                      </span>
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

      {/* Footer */}
      <div className="border-t border-border p-3 shrink-0">
        <button
          onClick={() => router.push('/connections')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          Back to Connections
        </button>
      </div>
    </div>
  )

  /* ─────────────────────────────────────────
     EMPTY STATE
  ───────────────────────────────────────── */
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-3 max-w-xs">
        <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
          <Database className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Select a table</h2>
        <p className="text-sm text-muted-foreground">
          Choose a table from the sidebar to explore your data and traverse relationships.
        </p>
      </div>
    </div>
  )

  /* ─────────────────────────────────────────
     DATA TABLE
  ───────────────────────────────────────── */
  const DataTable = () => {
    if (queryLoading) return (
      <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        <span className="text-sm">Loading rows...</span>
      </div>
    )

    if (queryError) return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{queryError}</p>
          <button
            onClick={() => mockQueryTable(selectedTable!)}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
    )

    if (!queryResult || filteredRows.length === 0) return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Rows3 className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No rows to display</p>
        </div>
      </div>
    )

    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10 bg-card border-b border-border">
            <tr>
              {queryResult.columns.map(col => {
                const colSchema = currentTableSchema?.columns.find(c => c.name === col)
                const isOrdered = orderBy?.column === col
                const rel = findRelation(col, relations)
                return (
                  <th key={col} className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap group">
                    <button
                      onClick={() => handleSort(col)}
                      className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                    >
                      {colSchema?.isPrimaryKey && <Key className="w-3 h-3 text-yellow-400 shrink-0" />}
                      {rel && !colSchema?.isPrimaryKey && <Link2 className="w-3 h-3 text-blue-400 shrink-0" />}
                      <span>{col}</span>
                      {isOrdered
                        ? orderBy?.direction === 'asc'
                          ? <SortAsc className="w-3 h-3 text-blue-400" />
                          : <SortDesc className="w-3 h-3 text-blue-400" />
                        : <SortAsc className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                      }
                    </button>
                  </th>
                )
              })}

              {/* Relations column header */}
              {relations.length > 0 && (
                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold whitespace-nowrap">
                  Relations
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, ri) => {
              const pkCol    = currentTableSchema?.columns.find(c => c.isPrimaryKey)
              const pkValue  = pkCol ? row[pkCol.name] : null
              return (
                <tr
                  key={ri}
                  className="border-b border-border/50 hover:bg-blue-500/5 transition-colors"
                >
                  {queryResult.columns.map(col => {
                    const val = row[col]
                    const rel = findRelation(col, relations)
                    return (
                      <td key={col} className="px-4 py-2.5 text-xs whitespace-nowrap max-w-[200px]">
                        {val === null || val === undefined ? (
                          <span className="text-muted-foreground/40 italic">null</span>
                        ) : rel ? (
                          <button
                            onClick={() => handleTraverseRelation(rel, val)}
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

                  {/* Relation traversal buttons */}
                  {relations.length > 0 && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {relations.map(rel => (
                          <button
                            key={rel.constraint}
                            onClick={() => pkValue !== null && handleTraverseRelation(rel, pkValue)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors whitespace-nowrap"
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
    )
  }

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarInner />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:block shrink-0 border-r border-border transition-all duration-200 ease-in-out overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
        {sidebarOpen && <SidebarInner />}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <header className="h-14 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3">

          {/* Sidebar toggle */}
          <button
            onClick={() => window.innerWidth < 768
              ? setMobileSidebarOpen(p => !p)
              : setSidebarOpen(p => !p)
            }
            className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-5 h-5" />
              : <PanelLeftOpen  className="w-5 h-5" />
            }
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden" aria-label="Breadcrumb">
            <button
              onClick={() => { setSelectedTable(null); setBreadcrumb([]) }}
              className={`text-xs shrink-0 transition-colors ${
                breadcrumb.length === 0
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-blue-400'
              }`}
            >
              {connectionName}
            </button>
            {breadcrumb.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`text-xs capitalize truncate transition-colors ${
                    i === breadcrumb.length - 1
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-blue-400'
                  }`}
                >
                  {crumb.label}
                  {crumb.pk !== undefined && (
                    <span className="text-muted-foreground font-normal"> #{crumb.pk}</span>
                  )}
                </button>
              </div>
            ))}
          </nav>

          {/* Right: row count + refresh */}
          <div className="flex items-center gap-2 shrink-0">
            {queryResult && !queryLoading && (
              <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">
                {filteredRows.length} row{filteredRows.length !== 1 ? 's' : ''}
              </span>
            )}
            {selectedTable && (
              <button
                onClick={() => mockQueryTable(selectedTable, page, orderBy)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${queryLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </header>

        {/* ── Schema toolbar (only when table selected) ── */}
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
                <span className="text-xs text-muted-foreground">
                  +{currentTableSchema.columns.length - 5} more
                </span>
              )}
            </div>

            {/* Row filter */}
            <div className="relative shrink-0">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Filter rows..."
                value={rowFilter}
                onChange={e => setRowFilter(e.target.value)}
                className="h-7 pl-7 pr-7 text-xs bg-background border border-border rounded-lg w-36 sm:w-44 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-foreground placeholder:text-muted-foreground"
              />
              {rowFilter && (
                <button
                  onClick={() => setRowFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTable ? (
            <EmptyState />
          ) : (
            <>
              <DataTable />

              {/* Pagination */}
              {queryResult && queryResult.rows.length > 0 && (
                <div className="shrink-0 border-t border-border px-4 py-2.5 flex items-center justify-between bg-card">
                  <span className="text-xs text-muted-foreground">
                    Page {page + 1} · {PAGE_SIZE} per page
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePage(-1)}
                      disabled={page === 0 || queryLoading}
                      className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePage(1)}
                      disabled={queryResult.rows.length < PAGE_SIZE || queryLoading}
                      className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
    </div>
  )
}