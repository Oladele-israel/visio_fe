'use client'

import { useState, useEffect } from 'react'
import { useRouter }            from 'next/navigation'
import { api }                  from '@/lib/api'
import { Input }                from '@/components/ui/input'
import { Button }               from '@/components/ui/button'
import {
  Database, Plus, Plug, Pencil, Trash2,
  Loader2, AlertTriangle, CheckCircle2,
  X, Shield, Server, Globe, User,
  Lock, Hash, ChevronRight, AlertCircle,
  RefreshCw,
} from 'lucide-react'

type DbType = 'postgres' | 'mysql' | 'sqlite' | 'mssql'

interface Connection {
  id:        string
  name:      string
  type:      string
  host:      string
  port:      number
  database:  string
  username:  string
  password?: string
  ssl:       boolean
  isActive?: boolean
  createdAt?: string
}

const normaliseType = (type: string): DbType => type.toLowerCase() as DbType

const DB_TYPES: { value: DbType; label: string; defaultPort: number }[] = [
  { value: 'postgres', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql',    label: 'MySQL',      defaultPort: 3306 },
  { value: 'mssql',    label: 'SQL Server', defaultPort: 1433 },
  { value: 'sqlite',   label: 'SQLite',     defaultPort: 0    },
]

const DB_BADGE: Record<DbType, { label: string; color: string }> = {
  postgres: { label: 'PostgreSQL', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'          },
  mysql:    { label: 'MySQL',      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20'    },
  mssql:    { label: 'SQL Server', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20'    },
  sqlite:   { label: 'SQLite',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

const FALLBACK_BADGE = { label: 'Database', color: 'bg-muted text-muted-foreground border-border' }
const getBadge = (type: string) => DB_BADGE[normaliseType(type)] ?? FALLBACK_BADGE

// ─── shared error extractor ───────────────────────────────────────────────────
// Our Next.js API routes return { error: '...' } not { message: '...' }
const apiErr = (err: any, fallback: string) =>
  err?.response?.data?.error ?? err?.message ?? fallback

/* ─── Field ──────────────────────────────────────────────────────────────── */
function Field({ label, icon, error, children }: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="text-blue-400">{icon}</span>{label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-2xl">
        {children}
      </div>
    </div>
  )
}

/* ─── EditModal ──────────────────────────────────────────────────────────── */
function EditModal({ connection, onClose, onSave }: {
  connection: Connection
  onClose: () => void
  onSave: (updated: Connection) => void
}) {
  const [form,         setForm]         = useState<Connection>({ ...connection })
  const [errors,       setErrors]       = useState<Record<string, string>>({})
  const [isSaving,     setIsSaving]     = useState(false)
  const [apiError,     setApiError]     = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const set = (field: keyof Connection, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    const t = normaliseType(form.type)
    if (!form.name.trim())                       e.name     = 'Required'
    if (!form.host.trim() && t !== 'sqlite')     e.host     = 'Required'
    if (!form.database.trim())                   e.database = 'Required'
    if (!form.username.trim() && t !== 'sqlite') e.username = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setApiError(null)
    setIsSaving(true)
    try {
      const res = await api.patch(`/db-agent/${form.id}`, {
        name:     form.name,
        type:     form.type,
        host:     form.host,
        port:     Number(form.port),
        database: form.database,
        username: form.username,
        ...(form.password ? { password: form.password } : {}),
        ssl:      form.ssl,
      })
      onSave(res.data?.data ?? res.data)
    } catch (err: any) {
      setApiError(apiErr(err, 'Failed to save changes'))
    } finally {
      setIsSaving(false)
    }
  }

  const isSqlite = normaliseType(form.type) === 'sqlite'

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Pencil className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Edit Connection</p>
            <p className="text-xs text-muted-foreground">{connection.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {apiError && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />{apiError}
          </div>
        )}

        <Field label="Connection Name" icon={<Hash className="w-3.5 h-3.5" />} error={errors.name}>
          <Input value={form.name} onChange={e => set('name', e.target.value)}
            className="bg-background h-10 focus-visible:ring-blue-500/30" />
        </Field>

        <Field label="Database Type" icon={<Database className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-2 gap-2">
            {DB_TYPES.map(db => (
              <button key={db.value} onClick={() => set('type', db.value.toUpperCase())}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  normaliseType(form.type) === db.value
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-background border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5'
                }`}>
                {db.label}
              </button>
            ))}
          </div>
        </Field>

        {!isSqlite && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Host" icon={<Server className="w-3.5 h-3.5" />} error={errors.host}>
                <Input value={form.host} onChange={e => set('host', e.target.value)}
                  className="bg-background h-10 focus-visible:ring-blue-500/30" />
              </Field>
            </div>
            <Field label="Port" icon={<Globe className="w-3.5 h-3.5" />}>
              <Input value={form.port} onChange={e => set('port', parseInt(e.target.value) || 0)}
                className="bg-background h-10 focus-visible:ring-blue-500/30" />
            </Field>
          </div>
        )}

        <Field label="Database" icon={<Database className="w-3.5 h-3.5" />} error={errors.database}>
          <Input value={form.database} onChange={e => set('database', e.target.value)}
            className="bg-background h-10 focus-visible:ring-blue-500/30" />
        </Field>

        {!isSqlite && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" icon={<User className="w-3.5 h-3.5" />} error={errors.username}>
              <Input value={form.username} onChange={e => set('username', e.target.value)}
                className="bg-background h-10 focus-visible:ring-blue-500/30" />
            </Field>
            <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password ?? ''}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="bg-background h-10 pr-14 focus-visible:ring-blue-500/30" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-blue-400 transition-colors">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
          </div>
        )}

        {!isSqlite && (
          <Field label="SSL" icon={<Shield className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('ssl', !form.ssl)}
                className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 ${form.ssl ? 'bg-blue-500' : 'bg-border'}`}
                role="switch" aria-checked={form.ssl}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${form.ssl ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-muted-foreground">{form.ssl ? 'SSL enabled' : 'SSL disabled'}</span>
            </div>
          </Field>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background/40">
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
          Cancel
        </button>
        <Button onClick={handleSave} disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 gap-2">
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  )
}

/* ─── DeleteModal ────────────────────────────────────────────────────────── */
function DeleteModal({ connection, onClose, onConfirm }: {
  connection: Connection
  onClose: () => void
  onConfirm: () => void
}) {
  const [isDeleting,   setIsDeleting]   = useState(false)
  const [confirmText,  setConfirmText]  = useState('')
  const [apiError,     setApiError]     = useState<string | null>(null)

  const normaliseStr = (s: string) => s.trim().replace(/\s+/g, ' ')
  const expectedName = normaliseStr(connection.name)
  const typedName    = normaliseStr(confirmText)
  const canDelete    = typedName === expectedName

  const handleDelete = async () => {
    if (!canDelete) return
    setApiError(null)
    setIsDeleting(true)
    try {
      await api.delete(`/db-agent/${connection.id}`)
      onConfirm()
    } catch (err: any) {
      setApiError(apiErr(err, 'Failed to delete connection'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Delete Connection</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will permanently delete{' '}
              <span className="text-foreground font-medium">"{connection.name}"</span>.
              This action cannot be undone.
            </p>
          </div>
        </div>

        {apiError && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />{apiError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Type <span className="font-semibold text-foreground select-all cursor-text">{expectedName}</span> to confirm
          </label>
          <Input
            placeholder={expectedName}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className={`bg-background h-10 transition-colors ${
              typedName.length > 0
                ? canDelete
                  ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30'
                  : 'border-red-500/50 focus-visible:ring-red-500/30'
                : 'focus-visible:ring-red-500/30'
            }`}
          />
          {typedName.length > 0 && (
            <p className={`text-xs flex items-center gap-1.5 ${canDelete ? 'text-emerald-400' : 'text-red-400'}`}>
              {canDelete
                ? <><CheckCircle2 className="w-3 h-3" /> Name matches — you can now delete</>
                : <><AlertCircle  className="w-3 h-3" /> Name doesn&apos;t match yet</>
              }
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
            Cancel
          </button>
          <Button onClick={handleDelete} disabled={!canDelete || isDeleting}
            className={`h-9 px-5 gap-2 text-white transition-all ${
              canDelete ? 'bg-red-600 hover:bg-red-500' : 'bg-red-600/40 cursor-not-allowed opacity-50'
            }`}>
            {isDeleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              : <><Trash2  className="w-4 h-4" /> Delete Connection</>
            }
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── ConnectionCard ─────────────────────────────────────────────────────── */
function ConnectionCard({ connection, onEdit, onDelete, onConnect, isConnecting }: {
  connection:   Connection
  onEdit:       () => void
  onDelete:     () => void
  onConnect:    () => void
  isConnecting: boolean
}) {
  const badge = getBadge(connection.type)
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-500/30 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
        <Database className="w-5 h-5 text-blue-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground truncate">{connection.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
          {connection.ssl && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> SSL
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {normaliseType(connection.type) !== 'sqlite'
            ? `${connection.username}@${connection.host}:${connection.port} / ${connection.database}`
            : connection.database
          }
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onEdit}
          className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
          title="Edit connection">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete}
          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          title="Delete connection">
          <Trash2 className="w-4 h-4" />
        </button>
        <Button onClick={onConnect} disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 text-sm">
          {isConnecting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
            : <><Plug    className="w-3.5 h-3.5" /> Connect</>
          }
        </Button>
      </div>
    </div>
  )
}

/* ─── ConnectionsPage ────────────────────────────────────────────────────── */
export default function ConnectionsPage() {
  const router = useRouter()

  const [connections,    setConnections]    = useState<Connection[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [fetchError,     setFetchError]     = useState<string | null>(null)
  const [editTarget,     setEditTarget]     = useState<Connection | null>(null)
  const [deleteTarget,   setDeleteTarget]   = useState<Connection | null>(null)
  const [connectingId,   setConnectingId]   = useState<string | null>(null)
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null)
  const [connectError,   setConnectError]   = useState<string | null>(null)

  const fetchConnections = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await api.get('/db-agent')
      // GET /api/db-agent returns { data: [...], meta: {...} }
      setConnections(res.data?.data ?? [])
    } catch (err: any) {
      setFetchError(apiErr(err, 'Failed to load connections'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchConnections() }, [])

  const handleConnect = async (conn: Connection) => {
    setConnectingId(conn.id)
    setConnectError(null)
    try {
      // No /connect endpoint in Next.js — connections are stateless per-request.
      // Just navigate directly to the visualize page.
      setConnectSuccess(conn.id)
      setTimeout(() => router.push(`/visualize/${conn.id}`), 800)
    } catch (err: any) {
      setConnectError(apiErr(err, 'Connection failed'))
      setConnectingId(null)
    }
  }

  const handleSaveEdit = (updated: Connection) => {
    setConnections(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditTarget(null)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setConnections(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Connections</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Database Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : `${connections.length} connection${connections.length !== 1 ? 's' : ''} configured`}
            </p>
          </div>
          <Button onClick={() => router.push('/connections/create')}
            className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> New Connection
          </Button>
        </div>

        {/* Connect error banner */}
        {connectError && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />{connectError}
            </div>
            <button onClick={() => setConnectError(null)} className="shrink-0 hover:text-red-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-border rounded w-1/3" />
                    <div className="h-3 bg-border rounded w-1/2" />
                  </div>
                  <div className="h-9 w-24 bg-border rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fetch error */}
        {!isLoading && fetchError && (
          <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-400">{fetchError}</p>
            <button onClick={fetchConnections}
              className="flex items-center gap-2 text-xs text-blue-400 hover:underline mx-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !fetchError && connections.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No connections yet</h3>
            <p className="text-xs text-muted-foreground">Create your first database connection to get started.</p>
            <Button onClick={() => router.push('/connections/create')}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 mt-2">
              <Plus className="w-4 h-4" /> New Connection
            </Button>
          </div>
        )}

        {/* Connections list */}
        {!isLoading && !fetchError && connections.length > 0 && (
          <div className="space-y-3">
            {connections.map(conn => (
              <div key={conn.id} className="relative">
                {connectSuccess === conn.id && (
                  <div className="absolute inset-0 z-10 bg-card/90 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Connected! Redirecting...</span>
                  </div>
                )}
                <ConnectionCard
                  connection={conn}
                  isConnecting={connectingId === conn.id}
                  onEdit={()    => setEditTarget(conn)}
                  onDelete={()  => setDeleteTarget(conn)}
                  onConnect={()  => handleConnect(conn)}
                />
              </div>
            ))}
          </div>
        )}

      </div>

      {editTarget && (
        <EditModal connection={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />
      )}
      {deleteTarget && (
        <DeleteModal connection={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />
      )}
    </div>
  )
}