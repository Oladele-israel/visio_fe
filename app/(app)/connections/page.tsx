'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Plus, Plug, Pencil, Trash2,
  Loader2, AlertTriangle, CheckCircle2,
  X, Shield, Server, Globe, User,
  Lock, Hash, ChevronRight, Circle,
} from 'lucide-react'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type DbType = 'postgres' | 'mysql' | 'sqlite' | 'mssql'

interface Connection {
  id: string
  name: string
  type: DbType
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
}

/* ─────────────────────────────────────────
   MOCK DATA — replace with real API calls
───────────────────────────────────────── */
const MOCK_CONNECTIONS: Connection[] = [
  { id: '1', name: 'Production DB',  type: 'postgres', host: 'db.prod.example.com', port: 5432, database: 'prod_db',    username: 'admin',    password: '••••••••', ssl: true  },
  { id: '2', name: 'Staging MySQL',  type: 'mysql',    host: '10.0.0.12',           port: 3306, database: 'staging_db', username: 'root',     password: '••••••••', ssl: false },
  { id: '3', name: 'Local Dev',      type: 'postgres', host: 'localhost',           port: 5432, database: 'dev_db',     username: 'postgres', password: '••••••••', ssl: false },
  { id: '4', name: 'Analytics MSSQL',type: 'mssql',    host: 'analytics.internal',  port: 1433, database: 'analytics',  username: 'sa',       password: '••••••••', ssl: true  },
]

const DB_TYPES: { value: DbType; label: string; defaultPort: number }[] = [
  { value: 'postgres', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql',    label: 'MySQL',      defaultPort: 3306 },
  { value: 'mssql',    label: 'SQL Server', defaultPort: 1433 },
  { value: 'sqlite',   label: 'SQLite',     defaultPort: 0    },
]

const DB_BADGE: Record<DbType, { label: string; color: string }> = {
  postgres: { label: 'PostgreSQL', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  mysql:    { label: 'MySQL',      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  mssql:    { label: 'SQL Server', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  sqlite:   { label: 'SQLite',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

/* ─────────────────────────────────────────
   FIELD COMPONENT
───────────────────────────────────────── */
function Field({
  label, icon, error, children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="text-blue-400">{icon}</span>
        {label}
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

/* ─────────────────────────────────────────
   MODAL BACKDROP
───────────────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-2xl">
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────── */
function EditModal({
  connection,
  onClose,
  onSave,
}: {
  connection: Connection
  onClose: () => void
  onSave: (updated: Connection) => void
}) {
  const [form, setForm] = useState<Connection>({ ...connection })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (field: keyof Connection, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name     = 'Required'
    if (!form.host.trim() && form.type !== 'sqlite') e.host = 'Required'
    if (!form.database.trim()) e.database = 'Required'
    if (!form.username.trim() && form.type !== 'sqlite') e.username = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 800)) // replace with: await api.patch(`/connections/${form.id}`, form)
    setIsSaving(false)
    onSave(form)
  }

  const isSqlite = form.type === 'sqlite'

  return (
    <Modal onClose={onClose}>
      {/* Header */}
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
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">

        {/* Name */}
        <Field label="Connection Name" icon={<Hash className="w-3.5 h-3.5" />} error={errors.name}>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="bg-background h-10 focus-visible:ring-blue-500/30"
          />
        </Field>

        {/* DB Type */}
        <Field label="Database Type" icon={<Database className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-2 gap-2">
            {DB_TYPES.map(db => (
              <button
                key={db.value}
                onClick={() => set('type', db.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.type === db.value
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-background border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5'
                }`}
              >
                {db.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Host + Port */}
        {!isSqlite && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Host" icon={<Server className="w-3.5 h-3.5" />} error={errors.host}>
                <Input
                  value={form.host}
                  onChange={e => set('host', e.target.value)}
                  className="bg-background h-10 focus-visible:ring-blue-500/30"
                />
              </Field>
            </div>
            <Field label="Port" icon={<Globe className="w-3.5 h-3.5" />}>
              <Input
                value={form.port}
                onChange={e => set('port', parseInt(e.target.value) || 0)}
                className="bg-background h-10 focus-visible:ring-blue-500/30"
              />
            </Field>
          </div>
        )}

        {/* Database */}
        <Field label="Database" icon={<Database className="w-3.5 h-3.5" />} error={errors.database}>
          <Input
            value={form.database}
            onChange={e => set('database', e.target.value)}
            className="bg-background h-10 focus-visible:ring-blue-500/30"
          />
        </Field>

        {/* Username + Password */}
        {!isSqlite && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" icon={<User className="w-3.5 h-3.5" />} error={errors.username}>
              <Input
                value={form.username}
                onChange={e => set('username', e.target.value)}
                className="bg-background h-10 focus-visible:ring-blue-500/30"
              />
            </Field>
            <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="bg-background h-10 pr-14 focus-visible:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
          </div>
        )}

        {/* SSL */}
        {!isSqlite && (
          <Field label="SSL" icon={<Shield className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('ssl', !form.ssl)}
                className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 ${
                  form.ssl ? 'bg-blue-500' : 'bg-border'
                }`}
                role="switch"
                aria-checked={form.ssl}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${form.ssl ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-muted-foreground">
                {form.ssl ? 'SSL enabled' : 'SSL disabled'}
              </span>
            </div>
          </Field>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background/40">
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-blue-400 transition-colors"
        >
          Cancel
        </button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 gap-2"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────
   DELETE CONFIRMATION MODAL
───────────────────────────────────────── */
function DeleteModal({
  connection,
  onClose,
  onConfirm,
}: {
  connection: Connection
  onClose: () => void
  onConfirm: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText === connection.name

  const handleDelete = async () => {
    if (!canDelete) return
    setIsDeleting(true)
    await new Promise(r => setTimeout(r, 800)) // replace with: await api.delete(`/connections/${connection.id}`)
    setIsDeleting(false)
    onConfirm()
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5">
        {/* Icon + title */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Delete Connection</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will permanently delete <span className="text-foreground font-medium">"{connection.name}"</span>. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Confirm by typing name */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Type <span className="font-semibold text-foreground">{connection.name}</span> to confirm
          </label>
          <Input
            placeholder={connection.name}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="bg-background h-10 focus-visible:ring-red-500/30"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-blue-400 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white h-9 px-5 gap-2"
          >
            {isDeleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              : <><Trash2 className="w-4 h-4" /> Delete Connection</>
            }
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────
   CONNECTION CARD
───────────────────────────────────────── */
function ConnectionCard({
  connection,
  onEdit,
  onDelete,
  onConnect,
  isConnecting,
}: {
  connection: Connection
  onEdit: () => void
  onDelete: () => void
  onConnect: () => void
  isConnecting: boolean
}) {
  const badge = DB_BADGE[connection.type]

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-500/30 transition-all duration-200 group">

      {/* Left: icon */}
      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
        <Database className="w-5 h-5 text-blue-400" />
      </div>

      {/* Middle: info */}
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
          {connection.type !== 'sqlite'
            ? `${connection.username}@${connection.host}:${connection.port} / ${connection.database}`
            : connection.database
          }
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Edit */}
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
          title="Edit connection"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          title="Delete connection"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Connect */}
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 text-sm"
        >
          {isConnecting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
          ) : (
            <><Plug className="w-3.5 h-3.5" /> Connect</>
          )}
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function ConnectionsPage() {
  const router = useRouter()

  const [connections, setConnections] = useState<Connection[]>(MOCK_CONNECTIONS)
  const [editTarget, setEditTarget]   = useState<Connection | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null)

  /* ── Connect ── */
  const handleConnect = async (conn: Connection) => {
    setConnectingId(conn.id)
    try {
      // replace with: await api.post(`/connections/${conn.id}/connect`)
      await new Promise(r => setTimeout(r, 1500))
      setConnectSuccess(conn.id)
      setTimeout(() => {
        router.push(`/visualize/${conn.id}`)
      }, 800)
    } catch {
      setConnectingId(null)
    }
  }

  /* ── Save edit ── */
  const handleSaveEdit = (updated: Connection) => {
    setConnections(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditTarget(null)
  }

  /* ── Confirm delete ── */
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setConnections(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Connections</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Database Connections
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {connections.length} connection{connections.length !== 1 ? 's' : ''} configured
            </p>
          </div>

          <Button
            onClick={() => router.push('/connections/create')}
            className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Connection
          </Button>
        </div>

        {/* ── Connection List ── */}
        {connections.length === 0 ? (
          /* Empty state */
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No connections yet</h3>
            <p className="text-xs text-muted-foreground">Create your first database connection to get started.</p>
            <Button
              onClick={() => router.push('/connections/create')}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> New Connection
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <div key={conn.id} className="relative">
                {/* Success overlay */}
                {connectSuccess === conn.id && (
                  <div className="absolute inset-0 z-10 bg-card/90 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Connected! Redirecting...</span>
                  </div>
                )}
                <ConnectionCard
                  connection={conn}
                  isConnecting={connectingId === conn.id}
                  onEdit={() => setEditTarget(conn)}
                  onDelete={() => setDeleteTarget(conn)}
                  onConnect={() => handleConnect(conn)}
                />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Edit Modal ── */}
      {editTarget && (
        <EditModal
          connection={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteModal
          connection={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}