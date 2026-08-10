'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Server, User, Lock, Hash,
  Globe, Shield, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Cloud, Copy, Check, Zap, Laptop,
  Download, RefreshCw, Sparkles, Plus, Trash2, Pencil, X, AlertTriangle, ArrowLeft,
  ShieldCheck, Terminal
} from 'lucide-react'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FormData {
  name: string
  type: 'postgres' | 'mysql' | 'sqlite' | 'mssql' | ''
  host: string
  port: string
  database: string
  username: string
  password: string
  ssl: boolean
}

interface FormErrors {
  [key: string]: string
}

/* ─────────────────────────────────────────
   DB TYPE OPTIONS
───────────────────────────────────────── */
const DB_TYPES = [
  { value: 'postgres', label: 'PostgreSQL', defaultPort: '5432' },
  { value: 'mysql', label: 'MySQL', defaultPort: '3306' },
  { value: 'mssql', label: 'SQL Server', defaultPort: '1433' },
  { value: 'sqlite', label: 'SQLite', defaultPort: '' },
]

/* ─────────────────────────────────────────
   FIELD COMPONENT
───────────────────────────────────────── */
function Field({
  label,
  icon,
  error,
  hint,
  children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-sky-400">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function CreateConnectionPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    name: '',
    type: 'postgres',
    host: 'localhost',
    port: '5432',
    database: '',
    username: 'postgres',
    password: '',
    ssl: false,
  })

  const [targetMode, setTargetMode] = useState<'direct' | 'tunnel'>('direct')
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  /* Connection URI Parser State */
  const [connectionUri, setConnectionUri] = useState('')
  const [uriParseStatus, setUriParseStatus] = useState<string | null>(null)
  const [uriParseError, setUriParseError] = useState<string | null>(null)
  
  /* Visio Agent State */
  const [agentStatus, setAgentStatus] = useState<'checking' | 'active' | 'offline'>('checking')
  const [isBridging, setIsBridging] = useState(false)
  const [agentMessage, setAgentMessage] = useState<string | null>(null)
  const [discoveredDbs, setDiscoveredDbs] = useState<string[]>([])

  /* Database Management State */
  const [createDbModalOpen, setCreateDbModalOpen] = useState(false)
  const [newDbInputName, setNewDbInputName] = useState('')
  const [renameDbModalOpen, setRenameDbModalOpen] = useState(false)
  const [targetDbToRename, setTargetDbToRename] = useState<string | null>(null)
  const [renameDbNewName, setRenameDbNewName] = useState('')
  const [deleteDbModalOpen, setDeleteDbModalOpen] = useState(false)
  const [targetDbToDelete, setTargetDbToDelete] = useState<string | null>(null)
  const [dbManageLoading, setDbManageLoading] = useState(false)
  const [dbManageMessage, setDbManageMessage] = useState<string | null>(null)
  const [dbManageError, setDbManageError] = useState<string | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dbScanError, setDbScanError] = useState<string | null>(null)

  /* Auto-discover local databases */
  const fetchDiscoveredDatabases = async () => {
    setDbScanError(null)
    try {
      const res = await fetch('http://127.0.0.1:4567/db/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: form.port || '5432',
          username: form.username || 'postgres',
          password: form.password || '',
        }),
      }).catch(() => null)

      if (res && res.ok) {
        const data = await res.json()
        if (data.databases && data.databases.length > 0) {
          setDiscoveredDbs(data.databases)
          if (!form.database && data.databases[0]) {
            setForm(prev => ({ ...prev, database: data.databases[0] }))
          }
        } else if (data.message) {
          setDbScanError(data.message)
        }
      }
    } catch {
      // Ignore
    }
  }

  /* Parse Database Connection URI */
  const handleParseUri = (rawUri: string) => {
    setConnectionUri(rawUri)
    setUriParseError(null)
    setUriParseStatus(null)

    const trimmed = rawUri.trim()
    if (!trimmed) return

    try {
      let uriString = trimmed
      if (uriString.startsWith('postgres://')) {
        uriString = uriString.replace('postgres://', 'postgresql://')
      }

      const parsed = new URL(uriString)
      let type: FormData['type'] = 'postgres'
      let defaultPort = '5432'

      const scheme = parsed.protocol.replace(':', '').toLowerCase()
      if (scheme === 'postgresql' || scheme === 'postgres') {
        type = 'postgres'
        defaultPort = '5432'
      } else if (scheme === 'mysql') {
        type = 'mysql'
        defaultPort = '3306'
      } else if (scheme === 'sqlserver' || scheme === 'mssql') {
        type = 'mssql'
        defaultPort = '1433'
      }

      const username = parsed.username ? decodeURIComponent(parsed.username) : ''
      const password = parsed.password ? decodeURIComponent(parsed.password) : ''
      const host = parsed.hostname || 'localhost'
      const port = parsed.port || defaultPort
      const database = parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, '')) : ''

      const searchParams = parsed.searchParams
      const sslParam = searchParams.get('ssl') || searchParams.get('sslmode') || searchParams.get('sslMode')
      const isSsl = sslParam === 'true' || sslParam === 'require' || sslParam === 'verify-full' || sslParam === 'no-verify' || sslParam === 'prefer'

      setForm(prev => ({
        ...prev,
        type,
        host,
        port,
        database: database || prev.database,
        username: username || prev.username,
        password: password || prev.password,
        ssl: isSsl,
        name: prev.name || (database ? `${database} (${type})` : `${host} (${type})`),
      }))

      setUriParseStatus(`Successfully extracted ${type.toUpperCase()} connection details for database "${database || 'default'}"`)
    } catch {
      setUriParseError('Invalid connection URI format. Example: postgresql://username:password@localhost:5432/dbname?sslmode=require')
    }
  }

  /* Execute DB Management Action */
  const handleManageDatabase = async (action: 'create' | 'drop' | 'rename', dbName: string, newName?: string) => {
    setDbManageError(null)
    setDbManageMessage(null)
    setDbManageLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:4567/db/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          dbName,
          newName,
          port: form.port || '5432',
          username: form.username || 'postgres',
          password: form.password || '',
        }),
      }).catch(() => null)

      if (res && res.ok) {
        const data = await res.json()
        if (data.status === 'success') {
          setDbManageMessage(data.message || `Database ${action} completed!`)
          if (data.databases && Array.isArray(data.databases)) {
            setDiscoveredDbs(data.databases)
          } else {
            fetchDiscoveredDatabases()
          }
          if (action === 'create') setForm(prev => ({ ...prev, database: dbName }))
          if (action === 'rename' && newName) setForm(prev => ({ ...prev, database: newName }))
          if (action === 'drop' && form.database === dbName) setForm(prev => ({ ...prev, database: '' }))

          setCreateDbModalOpen(false)
          setRenameDbModalOpen(false)
          setDeleteDbModalOpen(false)
          setNewDbInputName('')
          setRenameDbNewName('')
        } else {
          setDbManageError(data.message || 'Database operation failed')
        }
      } else {
        setDbManageError('Visio Agent bridge connection failed. Please ensure visio-agent is running.')
      }
    } catch (err: any) {
      setDbManageError(err?.message || 'Error executing database operation')
    } finally {
      setDbManageLoading(false)
    }
  }

  /* Check for local Visio Agent */
  const checkAgentHealth = async (isSilent = false) => {
    if (!isSilent) setAgentStatus('checking')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500)
      const res = await fetch('http://127.0.0.1:4567/health', { signal: controller.signal })
        .catch(() => fetch('http://localhost:4567/health', { signal: controller.signal }))
        .catch(() => null)

      clearTimeout(timeoutId)
      if (res && res.ok) {
        setAgentStatus(prev => {
          if (prev !== 'active') {
            fetchDiscoveredDatabases()
          }
          return 'active'
        })
      } else {
        setAgentStatus('offline')
      }
    } catch {
      setAgentStatus('offline')
    }
  }

  useEffect(() => {
    if (targetMode === 'tunnel') {
      checkAgentHealth(false)
    }
  }, [targetMode])

  const trigger1ClickAutoBridge = async () => {
    setIsBridging(true)
    setAgentMessage(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      let res = await fetch('http://127.0.0.1:4567/bridge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: form.port || '5432' }),
        signal: controller.signal,
      }).catch(() => null)

      if (!res || !res.ok) {
        res = await fetch('http://localhost:4567/bridge/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: form.port || '5432' }),
          signal: controller.signal,
        }).catch(() => null)
      }

      clearTimeout(timeoutId)

      if (res && res.ok) {
        const data = await res.json()
        if (data.host) {
          const cleanHost = data.host.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
          setForm(prev => ({ ...prev, host: cleanHost }))
          setAgentStatus('active')
          setAgentMessage(`✨ Successfully auto-bridged! Tunnel Host pre-filled: ${cleanHost}`)
        }

        // Auto-discover local databases
        fetchDiscoveredDatabases()
      } else {
        setAgentStatus('offline')
        setAgentMessage('💡 Visio Agent desktop binary is offline. Run "npx visio-agent@latest" in your terminal to start.')
      }
    } catch (err: any) {
      setAgentStatus('offline')
      setAgentMessage('💡 Visio Agent is offline. Run "npx visio-agent@latest" in your terminal.')
    }
    setIsBridging(false)
  }

  /* ── Handlers ── */
  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const handleTypeSelect = (value: string) => {
    const found = DB_TYPES.find(d => d.value === value)
    setForm(prev => ({
      ...prev,
      type: value as FormData['type'],
      port: found?.defaultPort ?? prev.port,
    }))
    if (errors.type) setErrors(prev => { const e = { ...prev }; delete e.type; return e })
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Connection name is required'
    if (!form.type) e.type = 'Please select a database type'
    if (!form.host.trim() && form.type !== 'sqlite') e.host = 'Host is required'
    if (!form.port && form.type !== 'sqlite') e.port = 'Port is required'
    else if (form.port && (isNaN(Number(form.port)) || Number(form.port) < 1)) e.port = 'Enter a valid port number'
    if (!form.database.trim()) e.database = 'Database name is required'
    if (!form.username.trim() && form.type !== 'sqlite') e.username = 'Username is required'
    if (!form.password.trim() && form.type !== 'sqlite') e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setApiError(null)
    setIsLoading(true)

    try {
      await api.post('/db-agent', {
        name: form.name,
        type: form.type,
        host: form.host,
        port: parseInt(form.port, 10),
        database: form.database,
        username: form.username,
        password: form.password,
        ssl: form.ssl,
      })
      setIsSuccess(true)
      setTimeout(() => router.push('/connections'), 1500)
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? 'Failed to create connection')
    } finally {
      setIsLoading(false)
    }
  }

  const isSqlite = form.type === 'sqlite'

  /* ─────────────────────────────────────────
     SUCCESS STATE
  ───────────────────────────────────────── */
  if (isSuccess) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-visio-grid">
        <div className="text-center space-y-4 max-w-sm p-8 rounded-2xl bg-card/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Connection Saved!</h2>
            <p className="text-xs text-muted-foreground">
              Connected to <span className="font-mono text-emerald-400 font-semibold">{form.database}</span>. Redirecting to workspace...
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────
     FORM
  ───────────────────────────────────────── */
  return (
    <div className="min-h-full p-4 sm:p-8 bg-visio-grid">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div>
          <button
            onClick={() => router.push('/connections')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-sky-400 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Connections
          </button>

          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-sky-400" />
            New Database Connection
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Connect your cloud or local databases seamlessly to Visio's visualization agent.
          </p>
        </div>

        {/* ── Main Form Card ── */}
        <div className="bg-card/80 border border-border/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">

          {/* Card Header Strip */}
          <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Server className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Connection Configuration</p>
                <p className="text-[10px] text-muted-foreground">Configure host, authentication, and database target</p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            {!isSqlite && (
              <div className="flex items-center gap-1 p-1 bg-background/80 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setTargetMode('direct')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    targetMode === 'direct'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Direct / Cloud DB
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('tunnel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    targetMode === 'tunnel'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Local DB (Visio Agent)
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-8">

            {/* API error */}
            {apiError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </div>
            )}

            {/* ── FAST SETUP VIA CONNECTION URI ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                  Import via Connection String / URI
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Postgres, MySQL, SQL Server</span>
              </div>
              <div className="relative">
                <Input
                  placeholder="postgresql://username:password@localhost:5432/database_name?sslmode=require"
                  value={connectionUri}
                  onChange={e => handleParseUri(e.target.value)}
                  className="bg-background/90 h-10 text-xs font-mono pr-20 rounded-xl border-sky-500/30 focus-visible:ring-sky-500/30 placeholder:text-muted-foreground/50"
                />
                {connectionUri && (
                  <button
                    type="button"
                    onClick={() => handleParseUri('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] px-2 py-0.5 rounded bg-card border border-border"
                  >
                    Clear
                  </button>
                )}
              </div>
              {uriParseStatus && (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  {uriParseStatus}
                </p>
              )}
              {uriParseError && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  {uriParseError}
                </p>
              )}
            </div>

            {/* ── SECTION 1: General ── */}
            <section className="space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 border-b border-border/80 pb-2">
                1. General Settings
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Connection Name */}
                <Field
                  label="Connection Name"
                  icon={<Hash className="w-3.5 h-3.5" />}
                  error={errors.name}
                  hint="Friendly display name"
                >
                  <Input
                    placeholder="e.g. Production PostgreSQL"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className={`bg-background/80 h-10 text-xs rounded-xl ${errors.name ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                  />
                </Field>

                {/* DB Type */}
                <Field
                  label="Engine Type"
                  icon={<Database className="w-3.5 h-3.5" />}
                  error={errors.type}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {DB_TYPES.map(db => (
                      <button
                        key={db.value}
                        type="button"
                        onClick={() => handleTypeSelect(db.value)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-150 ${form.type === db.value
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-sm'
                            : 'bg-background/60 border-border/80 text-muted-foreground hover:border-sky-500/30 hover:text-sky-400'
                          }`}
                      >
                        {db.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </section>

            {/* ── SECTION 2: Visio Agent Auto-Bridge (Local Mode) ── */}
            {!isSqlite && targetMode === 'tunnel' && (
              <section className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-slate-900/90 via-sky-950/30 to-slate-900/90 border border-sky-500/30 rounded-2xl shadow-xl space-y-4 backdrop-blur-md">
                  
                  {/* Card Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 border border-sky-400/40 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-foreground tracking-wide">Visio Desktop Agent</p>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border shadow-sm ${
                            agentStatus === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : agentStatus === 'checking'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-muted-foreground border-border'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              agentStatus === 'active' ? 'bg-emerald-400 animate-ping' : agentStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground'
                            }`} />
                            {agentStatus === 'active' ? 'Agent Active (127.0.0.1:4567)' : agentStatus === 'checking' ? 'Checking Agent...' : 'Agent Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Automated local database discovery &amp; secure tunnel bridge</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => checkAgentHealth(false)}
                      title="Re-check Agent Connection"
                      className="px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-semibold text-muted-foreground hover:text-sky-400 hover:border-sky-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${agentStatus === 'checking' ? 'animate-spin text-sky-400' : ''}`} />
                      <span>Refresh Agent</span>
                    </button>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={trigger1ClickAutoBridge}
                      disabled={isBridging}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                    >
                      {isBridging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 fill-current" />}
                      {isBridging ? 'Bridging & Discovering DBs...' : '⚡ Auto-Bridge & Scan Local DBs'}
                    </button>

                    <button
                      type="button"
                      onClick={fetchDiscoveredDatabases}
                      className="px-3.5 py-2.5 rounded-xl bg-card hover:bg-card/80 border border-border/80 text-xs font-semibold text-muted-foreground hover:text-sky-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      Scan Local DBs
                    </button>
                  </div>

                  {/* Agent Feedback Banner */}
                  {agentMessage && (
                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{agentMessage}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-card/90 border border-sky-500/30 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        Visio Local Agent Terminal Command
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Zero-Install (@latest)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/80 border border-border/80 flex items-center justify-between gap-3 font-mono text-xs shadow-md">
                      <span className="text-emerald-400 font-bold truncate tracking-wide">
                        npx visio-agent@latest
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('npx visio-agent@latest')
                          setCopiedCmd('npx visio-agent@latest')
                          setTimeout(() => setCopiedCmd(null), 2000)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-sans font-bold flex items-center gap-1.5 shrink-0 transition-all border border-sky-500/30 active:scale-95"
                      >
                        {copiedCmd === 'npx visio-agent@latest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                        {copiedCmd === 'npx visio-agent@latest' ? 'Copied!' : 'Copy NPX'}
                      </button>
                    </div>

                    {/* ── Why visio-agent @latest Feature Explanation ── */}
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                        Why do we run <code className="text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded text-[11px] font-mono">npx visio-agent@latest</code>?
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground leading-relaxed">
                        <div className="p-2.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                          <span className="font-bold text-foreground flex items-center gap-1 text-sky-400">
                            🔒 Secure Local Tunneling
                          </span>
                          Bridges your local database (<code className="text-sky-300 font-mono">127.0.0.1:5432</code>, Docker, or dev DBs) directly to Visio without opening router ports or exposing raw credentials publicly.
                        </div>
                        <div className="p-2.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                          <span className="font-bold text-foreground flex items-center gap-1 text-emerald-400">
                            ⚡ Zero-Install (@latest)
                          </span>
                          Running <code className="text-emerald-300 font-mono">@latest</code> guarantees instant access to new schema tools, query speed optimizations, and security updates without global NPM installation.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── SECTION 3: Server & Authentication ── */}
            <section className="space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 border-b border-border/80 pb-2">
                2. Database Endpoint &amp; Credentials
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Host */}
                {!isSqlite && (
                  <div className="sm:col-span-2">
                    <Field
                      label={targetMode === 'tunnel' ? 'Host / Tunnel Host' : 'Server Host'}
                      icon={<Server className="w-3.5 h-3.5" />}
                      error={errors.host}
                      hint={targetMode === 'tunnel' ? 'Auto-filled by Visio Agent tunnel' : 'localhost or IP address'}
                    >
                      <Input
                        placeholder={targetMode === 'tunnel' ? 'abc123xyz.trycloudflare.com' : 'localhost'}
                        value={form.host}
                        onChange={e => set('host', e.target.value)}
                        className={`bg-background/80 h-10 text-xs font-mono rounded-xl ${errors.host ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                      />
                    </Field>
                  </div>
                )}

                {/* Port */}
                {!isSqlite && (
                  <Field
                    label="Port"
                    icon={<Globe className="w-3.5 h-3.5" />}
                    error={errors.port}
                  >
                    <Input
                      placeholder="5432"
                      value={form.port}
                      onChange={e => set('port', e.target.value)}
                      className={`bg-background/80 h-10 text-xs font-mono rounded-xl ${errors.port ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                    />
                  </Field>
                )}
              </div>

              {!isSqlite && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <Field
                    label="Username"
                    icon={<User className="w-3.5 h-3.5" />}
                    error={errors.username}
                  >
                    <Input
                      placeholder="postgres"
                      value={form.username}
                      onChange={e => set('username', e.target.value)}
                      className={`bg-background/80 h-10 text-xs rounded-xl ${errors.username ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                    />
                  </Field>

                  {/* Password */}
                  <Field
                    label="Password"
                    icon={<Lock className="w-3.5 h-3.5" />}
                    error={errors.password}
                  >
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        className={`bg-background/80 h-10 text-xs pr-16 rounded-xl ${errors.password ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-sky-400 transition-colors font-medium"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Field>
                </div>
              )}
            </section>

            {/* ── SECTION 4: Database Target & Management Toolbar ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  3. Select &amp; Manage Database
                </h2>
                {agentStatus === 'active' && (
                  <button
                    type="button"
                    onClick={() => { setNewDbInputName(''); setCreateDbModalOpen(true) }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Database
                  </button>
                )}
              </div>

              {/* Database input */}
              <Field
                label="Target Database Name"
                icon={<Database className="w-3.5 h-3.5" />}
                error={errors.database}
                hint={isSqlite ? 'Path to your SQLite file' : 'Select a scanned database or type database name directly'}
              >
                <div className="flex gap-2">
                  <Input
                    placeholder={isSqlite ? './data.db' : 'my_database'}
                    value={form.database}
                    onChange={e => set('database', e.target.value)}
                    className={`bg-background/80 h-10 text-xs font-mono rounded-xl ${errors.database ? 'border-rose-500/50 focus-visible:ring-rose-500/30' : 'focus-visible:ring-sky-500/30'}`}
                  />
                  {targetMode === 'tunnel' && (
                    <button
                      type="button"
                      onClick={fetchDiscoveredDatabases}
                      className="px-3 py-2 rounded-xl bg-card border border-border/80 hover:border-sky-500/30 text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Scan local databases"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      Scan
                    </button>
                  )}
                </div>

                {dbScanError && (
                  <p className="text-xs text-amber-400 font-medium pt-1 flex items-center gap-1">
                    <span>💡 {dbScanError}</span>
                  </p>
                )}
              </Field>

              {/* ── SENIOR DATABASE MANAGEMENT TOOLBAR (DISCOVERED DATABASES) ── */}
              {discoveredDbs.length > 0 && (
                <div className="p-4 rounded-2xl bg-card/60 border border-border/80 space-y-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      Discovered Databases ({discoveredDbs.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground">Click to select · Hover for DB actions</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {discoveredDbs.map(db => {
                      const isSelected = form.database === db
                      return (
                        <div
                          key={db}
                          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500 text-sky-300 font-bold shadow-md shadow-sky-500/10'
                              : 'bg-background/80 border-border/80 text-muted-foreground hover:text-foreground hover:border-sky-500/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => set('database', db)}
                            className="flex items-center gap-1.5 focus:outline-none"
                          >
                            <Database className={`w-3 h-3 ${isSelected ? 'text-sky-400' : 'text-muted-foreground'}`} />
                            <span>{db}</span>
                          </button>

                          {/* Quick Actions (Rename / Delete) */}
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border/60 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetDbToRename(db)
                                setRenameDbNewName(db)
                                setRenameDbModalOpen(true)
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                              title={`Rename database "${db}"`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetDbToDelete(db)
                                setDeleteDbModalOpen(true)
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title={`Delete database "${db}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SSL toggle */}
              {!isSqlite && (
                <Field
                  label="Encryption &amp; SSL"
                  icon={<Shield className="w-3.5 h-3.5" />}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set('ssl', !form.ssl)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${form.ssl ? 'bg-sky-500' : 'bg-border'}`}
                      role="switch"
                      aria-checked={form.ssl}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${form.ssl ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {form.ssl ? 'SSL Enabled (Encrypted connection)' : 'SSL Disabled'}
                    </span>
                  </div>
                </Field>
              )}
            </section>

          </div>

          {/* ── Footer Actions ── */}
          <div className="px-6 py-4 border-t border-border/80 flex items-center justify-between gap-3 bg-card/40">
            <button
              type="button"
              onClick={() => router.push('/connections')}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white h-10 px-6 gap-2 rounded-xl shadow-lg shadow-sky-500/20 font-bold transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Connection...
                </>
              ) : (
                <>
                  Connect Database
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
         DATABASE MANAGEMENT MODALS
      ───────────────────────────────────────────────────────────────────────── */}

      {/* ── Modal 1: Create Database Modal ── */}
      {createDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Create New Database</h3>
              </div>
              <button onClick={() => setCreateDbModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {dbManageError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {dbManageError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Database Name</label>
              <Input
                placeholder="e.g. staging_db"
                value={newDbInputName}
                onChange={e => setNewDbInputName(e.target.value)}
                className="bg-background h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateDbModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dbManageLoading || !newDbInputName.trim()}
                onClick={() => handleManageDatabase('create', newDbInputName.trim())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {dbManageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Rename Database Modal ── */}
      {renameDbModalOpen && targetDbToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Rename Database</h3>
              </div>
              <button onClick={() => setRenameDbModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {dbManageError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {dbManageError}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Renaming database <span className="font-mono text-sky-400 font-bold">{targetDbToRename}</span>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">New Database Name</label>
                <Input
                  placeholder="e.g. renamed_db"
                  value={renameDbNewName}
                  onChange={e => setRenameDbNewName(e.target.value)}
                  className="bg-background h-10 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameDbModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dbManageLoading || !renameDbNewName.trim()}
                onClick={() => handleManageDatabase('rename', targetDbToRename, renameDbNewName.trim())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {dbManageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                Save New Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Delete Database Confirmation Modal ── */}
      {deleteDbModalOpen && targetDbToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Drop Database Confirmation</h3>
              </div>
              <button onClick={() => setDeleteDbModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {dbManageError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {dbManageError}
              </div>
            )}

            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                Are you sure you want to drop database <span className="font-mono text-rose-400 font-bold">{targetDbToDelete}</span>?
              </p>
              <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                ⚠️ Warning: This operation will terminate active connections and permanently delete all tables and data in this database.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDbModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dbManageLoading}
                onClick={() => handleManageDatabase('drop', targetDbToDelete)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {dbManageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Drop Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}