'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Server, User, Lock, Hash,
  Globe, Shield, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Cloud, Terminal, Copy, Check, Zap, Laptop,
  Download, RefreshCw, Radio, Sparkles,
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
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="text-blue-400">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
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
    type: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    ssl: false,
  })

  const [targetMode, setTargetMode] = useState<'direct' | 'tunnel'>('direct')
  const [bridgeType, setBridgeType] = useState<'permanent' | 'quick'>('permanent')
  const [activeOs, setActiveOs] = useState<'mac' | 'linux' | 'win'>('mac')
  const [tunnelServiceMode, setTunnelServiceMode] = useState<'quick' | 'daemon'>('quick')
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  
  /* Visio Agent State (Option A: 1-Click Auto-Bridge) */
  const [agentStatus, setAgentStatus] = useState<'checking' | 'active' | 'offline'>('checking')
  const [isBridging, setIsBridging] = useState(false)
  const [agentMessage, setAgentMessage] = useState<string | null>(null)
  const [discoveredDbs, setDiscoveredDbs] = useState<string[]>([])

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
      const interval = setInterval(() => {
        checkAgentHealth(true) // Silent heartbeat check without UI flickers
      }, 5000)
      return () => clearInterval(interval)
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
          setAgentMessage(`✨ Successfully auto-bridged! Host pre-filled: ${cleanHost}`)
        }

        // Auto-discover local databases
        try {
          const dbRes = await fetch('http://127.0.0.1:4567/db/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              port: form.port || '5432',
              username: form.username || 'postgres',
              password: form.password || '',
            }),
          }).catch(() => null)

          if (dbRes && dbRes.ok) {
            const dbData = await dbRes.json()
            if (dbData.databases && dbData.databases.length > 0) {
              setDiscoveredDbs(dbData.databases)
              // Auto-select first discovered database if empty
              if (!form.database && dbData.databases[0]) {
                setForm(prev => ({ ...prev, database: dbData.databases[0] }))
              }
            }
          }
        } catch {
          // Ignore discovery errors
        }
      } else {
        setAgentStatus('offline')
        setAgentMessage('💡 Visio Agent desktop app is not detected on your computer. Download Visio Agent or use the manual tunnel guide below!')
      }
    } catch (err: any) {
      setAgentStatus('offline')
      setAgentMessage('💡 Visio Agent is offline. Download Visio Agent or use the manual tunnel guide below!')
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
      // ── API CALL: POST /db-agent ───────────────────────────────────────
      await api.post('/db-agent', {
        name: form.name,
        type: form.type, // backend expects "POSTGRES" not "postgres"
        host: form.host,
        port: parseInt(form.port, 10),
        database: form.database,
        username: form.username,
        password: form.password,
        ssl: form.ssl,
      })
      // ─────────────────────────────────────────────────────────────────
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
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Connection Created</h2>
          <p className="text-sm text-muted-foreground">Redirecting to your connections...</p>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────
     FORM
  ───────────────────────────────────────── */
  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-8">
          {/* Breadcrumb trail */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <button
              onClick={() => router.push('/connections')}
              className="hover:text-blue-400 transition-colors"
            >
              Connections
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">New Connection</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            New Database Connection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect to your database to start exploring and visualizing your data.
          </p>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">

          {/* Card header strip */}
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Connection Details</p>
              <p className="text-xs text-muted-foreground">All fields marked are required</p>
            </div>
          </div>

          <div className="p-6 space-y-8">

            {/* API error */}
            {apiError && (
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </div>
            )}

            {/* ── SECTION 1: General ── */}
            <section className="space-y-5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-border pb-2">
                General
              </h2>

              {/* Connection Name */}
              <Field
                label="Connection Name"
                icon={<Hash className="w-3.5 h-3.5" />}
                error={errors.name}
                hint="A friendly name to identify this connection"
              >
                <Input
                  placeholder="e.g. Production DB"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={`bg-background h-10 ${errors.name ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
                />
              </Field>

              {/* DB Type */}
              <Field
                label="Database Type"
                icon={<Database className="w-3.5 h-3.5" />}
                error={errors.type}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DB_TYPES.map(db => (
                    <button
                      key={db.value}
                      type="button"
                      onClick={() => handleTypeSelect(db.value)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${form.type === db.value
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                          : 'bg-background border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5'
                        }`}
                    >
                      {db.label}
                    </button>
                  ))}
                </div>
                {errors.type && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.type}
                  </p>
                )}
              </Field>
            </section>

            {/* ── SECTION 2: Server ── */}
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                  Server & Connection Mode
                </h2>
                {!isSqlite && (
                  <div className="flex items-center gap-1 p-0.5 bg-secondary rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setTargetMode('direct')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        targetMode === 'direct'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Cloud className="w-3 h-3" />
                      Direct / Cloud DB
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMode('tunnel')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        targetMode === 'tunnel'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      Local DB (TCP Tunnel)
                    </button>
                  </div>
                )}
              </div>

              {/* ── OPTION A: SENIOR UI/UX HERO DESKTOP AGENT CARD ── */}
              {!isSqlite && targetMode === 'tunnel' && (
                <div className="p-5 bg-gradient-to-br from-slate-900/90 via-blue-950/40 to-slate-900/90 border border-blue-500/30 rounded-2xl shadow-xl space-y-4 backdrop-blur-md">
                  
                  {/* Card Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground tracking-wide">Visio Desktop Agent</p>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border shadow-sm ${
                            agentStatus === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : agentStatus === 'checking'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : 'bg-secondary/80 text-muted-foreground border-border'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              agentStatus === 'active' ? 'bg-emerald-400 animate-ping' : agentStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground'
                            }`} />
                            {agentStatus === 'active' ? 'Agent Active (127.0.0.1:4567)' : agentStatus === 'checking' ? 'Connecting to Agent...' : 'Standby / App Not Detected'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Automated local-to-cloud bridge &amp; database discovery</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={checkAgentHealth}
                      title="Re-check Agent Connection"
                      className="self-start sm:self-center px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground border border-border flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${agentStatus === 'checking' ? 'animate-spin' : ''}`} />
                      <span>Refresh Agent</span>
                    </button>
                  </div>

                  {/* Local Credentials Sub-Card */}
                  <div className="p-4 rounded-xl bg-background/60 border border-border/80 space-y-3">
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Local Database Credentials &amp; Port
                    </p>

                    <div className="grid sm:grid-cols-3 gap-3">
                      {/* Port */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Local Port</label>
                        <Input
                          placeholder="5432"
                          value={form.port}
                          onChange={e => set('port', e.target.value)}
                          className="bg-background/90 h-9 text-xs font-mono"
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Username</label>
                        <Input
                          placeholder="postgres"
                          value={form.username}
                          onChange={e => set('username', e.target.value)}
                          className="bg-background/90 h-9 text-xs"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Password</label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => set('password', e.target.value)}
                            className="bg-background/90 h-9 text-xs pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Primary CTA Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={trigger1ClickAutoBridge}
                        disabled={isBridging}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                      >
                        {isBridging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current text-amber-300" />}
                        {isBridging ? 'Bridging & Discovering DBs...' : '⚡ Auto-Bridge & Discover Local DBs'}
                      </button>

                      <button
                        type="button"
                        onClick={fetchDiscoveredDatabases}
                        className="px-3 py-2 rounded-lg bg-secondary/80 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground border border-border flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        Scan DBs Only
                      </button>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {agentMessage && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{agentMessage}</span>
                    </div>
                  )}

                  {dbScanError && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{dbScanError}</span>
                    </div>
                  )}

                  {agentStatus === 'offline' && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Laptop className="w-4 h-4 text-amber-400" />
                            Visio Desktop Agent Not Running
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Run the zero-install command below or download the desktop app to enable 1-click local DB auto-bridging.
                          </p>
                        </div>

                        <a
                          href="https://github.com/visio-app/releases/latest"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-bold text-blue-300 transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download App Binary
                        </a>
                      </div>

                      {/* NPX Instant Copy Command */}
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-emerald-400 font-semibold truncate">
                          npx visio-agent
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('npx visio-agent')
                            setCopiedCmd('npx visio-agent')
                            setTimeout(() => setCopiedCmd(null), 2000)
                          }}
                          className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copiedCmd === 'npx visio-agent' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          {copiedCmd === 'npx visio-agent' ? 'Copied NPX!' : 'Copy NPX'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Step-by-Step Local Tunnel Wizard */}
              {!isSqlite && targetMode === 'tunnel' && (
                <div className="p-5 bg-card/90 border border-amber-500/30 rounded-xl shadow-lg space-y-4">
                  {/* Header & Sub-mode Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Local Database Tunnel Guide</p>
                        <p className="text-[11px] text-muted-foreground">Expose local databases securely to production.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border shrink-0">
                      <button
                        type="button"
                        onClick={() => setBridgeType('permanent')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          bridgeType === 'permanent'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        🌟 Permanent 24/7 Bridge
                      </button>
                      <button
                        type="button"
                        onClick={() => setBridgeType('quick')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          bridgeType === 'quick'
                            ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ⚡ Quick Dev Tunnel
                      </button>
                    </div>
                  </div>

                  {bridgeType === 'permanent' ? (
                    /* ── PERMANENT MULTI-DB BRIDGE (ONE-TIME SETUP) ── */
                    <div className="space-y-4">
                      <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-300 leading-relaxed">
                        ✨ <strong>Set up ONCE for all your local databases:</strong> This configures a single permanent background bridge on your laptop that handles unlimited local databases (Postgres, MySQL, Staging) without changing URLs or re-running commands after reboots.
                      </div>

                      {/* STEP 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">1</span>
                            Authenticate & Create Named Tunnel (One-time)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                          <code className="font-mono text-[11px] text-foreground overflow-x-auto block max-w-[420px] whitespace-nowrap">
                            cloudflared tunnel login &amp;&amp; cloudflared tunnel create visio-bridge
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('cloudflared tunnel login && cloudflared tunnel create visio-bridge', 'perm-step1')}
                            className="text-muted-foreground hover:text-amber-400 flex items-center gap-1 text-[10px] shrink-0 ml-2"
                          >
                            {copiedCmd === 'perm-step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedCmd === 'perm-step1' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* STEP 2 */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">2</span>
                          Multi-DB Ingress Config (<code className="text-amber-300 font-mono">~/.cloudflared/config.yml</code>)
                        </span>
                        <div className="p-2.5 bg-background border border-border rounded-lg space-y-1">
                          <div className="flex items-center justify-between border-b border-border/50 pb-1 mb-1">
                            <span className="text-[10px] text-muted-foreground font-mono">config.yml (Route multiple local DBs easily)</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(
                                `tunnel: visio-bridge\ncredentials-file: ~/.cloudflared/visio-bridge.json\n\ningress:\n  - hostname: db.mycompany.com\n    service: tcp://localhost:5432\n  - service: http_status:404`,
                                'perm-yaml'
                              )}
                              className="text-muted-foreground hover:text-amber-400 flex items-center gap-1 text-[10px]"
                            >
                              {copiedCmd === 'perm-yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedCmd === 'perm-yaml' ? 'Copied' : 'Copy Config'}
                            </button>
                          </div>
                          <pre className="font-mono text-[10px] text-amber-200/90 leading-relaxed overflow-x-auto">
{`tunnel: visio-bridge
credentials-file: ~/.cloudflared/visio-bridge.json

ingress:
  - hostname: db.mycompany.com
    service: tcp://localhost:5432
  - service: http_status:404`}
                          </pre>
                        </div>
                      </div>

                      {/* STEP 3 */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">3</span>
                          Route DNS & Start 24/7 Auto-Boot Service
                        </span>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                          <code className="font-mono text-[11px] text-blue-300 overflow-x-auto block max-w-[420px] whitespace-nowrap">
                            cloudflared tunnel route dns visio-bridge db.mycompany.com &amp;&amp; cloudflared tunnel run visio-bridge
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('cloudflared tunnel route dns visio-bridge db.mycompany.com && cloudflared tunnel run visio-bridge', 'perm-step3')}
                            className="text-muted-foreground hover:text-amber-400 flex items-center gap-1 text-[10px] shrink-0 ml-2"
                          >
                            {copiedCmd === 'perm-step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedCmd === 'perm-step3' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── QUICK DEV TUNNEL (TEMPORARY 5-SECOND TEST) ── */
                    <div className="space-y-4">
                      {/* STEP 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">1</span>
                            Install `cloudflared` (One-time setup on your machine)
                          </span>
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setActiveOs('mac')}
                              className={`px-2 py-0.5 rounded transition-colors ${activeOs === 'mac' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              macOS
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveOs('linux')}
                              className={`px-2 py-0.5 rounded transition-colors ${activeOs === 'linux' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              Linux
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveOs('win')}
                              className={`px-2 py-0.5 rounded transition-colors ${activeOs === 'win' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              Windows
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                          <code className="font-mono text-[11px] text-foreground overflow-x-auto block max-w-[420px] whitespace-nowrap">
                            {activeOs === 'mac' && 'brew install cloudflared'}
                            {activeOs === 'linux' && 'curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb'}
                            {activeOs === 'win' && 'winget install Cloudflare.cloudflared'}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(
                              activeOs === 'mac'
                                ? 'brew install cloudflared'
                                : activeOs === 'linux'
                                ? 'curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb'
                                : 'winget install Cloudflare.cloudflared',
                              'inst'
                            )}
                            className="text-muted-foreground hover:text-amber-400 flex items-center gap-1 text-[10px] shrink-0 ml-2"
                          >
                            {copiedCmd === 'inst' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedCmd === 'inst' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* STEP 2 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">2</span>
                            Choose Execution Mode
                          </span>
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setTunnelServiceMode('quick')}
                              className={`px-2 py-0.5 rounded transition-colors ${tunnelServiceMode === 'quick' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              ⚡ Foreground Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setTunnelServiceMode('daemon')}
                              className={`px-2 py-0.5 rounded transition-colors ${tunnelServiceMode === 'daemon' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              🔄 Background Process
                            </button>
                          </div>
                        </div>

                        {tunnelServiceMode === 'quick' ? (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                            <code className="font-mono text-[11px] text-amber-300">
                              cloudflared tunnel --url tcp://localhost:5432
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('cloudflared tunnel --url tcp://localhost:5432', 'run')}
                              className="text-muted-foreground hover:text-amber-400 flex items-center gap-1 text-[10px]"
                            >
                              {copiedCmd === 'run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedCmd === 'run' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-background border border-border space-y-2">
                            <p className="text-[11px] text-muted-foreground">Run in background (continues running even when terminal is closed):</p>
                            <div className="flex items-center justify-between bg-muted/40 p-2 rounded">
                              <code className="font-mono text-[11px] text-blue-300 overflow-x-auto block max-w-[400px] whitespace-nowrap">
                                nohup cloudflared tunnel --url tcp://localhost:5432 &gt; cloudflared.log 2&gt;&amp;1 &amp;
                              </code>
                              <button
                                type="button"
                                onClick={() => copyToClipboard('nohup cloudflared tunnel --url tcp://localhost:5432 > cloudflared.log 2>&1 &', 'daemon')}
                                className="text-muted-foreground hover:text-blue-400 flex items-center gap-1 text-[10px] shrink-0 ml-2"
                              >
                                {copiedCmd === 'daemon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedCmd === 'daemon' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80">
                              💡 Run <code className="text-blue-400 font-mono">cat cloudflared.log \| grep trycloudflare.com</code> to see your active background tunnel URL!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* STEP 3 */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">3</span>
                          Paste your generated tunnel hostname in Host below
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">
                          Terminal will output a hostname like <code className="text-amber-400 font-mono">abc123xyz.trycloudflare.com</code> or your domain <code className="text-blue-400 font-mono">db.mycompany.com</code>. Paste it into the Host field.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={`grid gap-4 ${isSqlite ? '' : 'sm:grid-cols-3'}`}>
                {/* Host */}
                {!isSqlite && (
                  <div className="sm:col-span-2">
                    <Field
                      label={targetMode === 'tunnel' ? 'Tunnel Host or IP' : 'Host'}
                      icon={<Server className="w-3.5 h-3.5" />}
                      error={errors.host}
                      hint={targetMode === 'tunnel' ? 'e.g. 0.tcp.ngrok.io or db.mycompany.com' : 'localhost or 192.168.1.1'}
                    >
                      <Input
                        placeholder={targetMode === 'tunnel' ? '0.tcp.ngrok.io or db.mycompany.com' : 'localhost or 192.168.1.1'}
                        value={form.host}
                        onChange={e => handleHostChange(e.target.value)}
                        className={`bg-background h-10 ${errors.host ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
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
                      className={`bg-background h-10 ${errors.port ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
                    />
                  </Field>
                )}
              </div>

              {/* Database name */}
              <Field
                label="Database"
                icon={<Database className="w-3.5 h-3.5" />}
                error={errors.database}
                hint={isSqlite ? 'Path to your SQLite file e.g. ./data.db' : 'The database name to connect to'}
              >
                <div className="flex gap-2">
                  <Input
                    placeholder={isSqlite ? './data.db' : 'my_database'}
                    value={form.database}
                    onChange={e => set('database', e.target.value)}
                    className={`bg-background h-10 ${errors.database ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
                  />
                  {targetMode === 'tunnel' && (
                    <button
                      type="button"
                      onClick={fetchDiscoveredDatabases}
                      className="px-3 py-2 rounded-lg bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground border border-border flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Scan local databases via Visio Agent"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      Scan Local DBs
                    </button>
                  )}
                </div>

                {dbScanError && (
                  <p className="text-[11px] text-amber-400 font-medium pt-1 flex items-center gap-1">
                    <span>💡 {dbScanError}</span>
                  </p>
                )}

                {discoveredDbs.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                      Discovered Local DBs:
                    </span>
                    {discoveredDbs.map(db => (
                      <button
                        key={db}
                        type="button"
                        onClick={() => set('database', db)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all border ${
                          form.database === db
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-semibold'
                            : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                        }`}
                      >
                        {db}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            </section>

            {/* ── SECTION 3: Auth ── */}
            {!isSqlite && (
              <section className="space-y-5">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-border pb-2">
                  Authentication
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <Field
                    label="Username"
                    icon={<User className="w-3.5 h-3.5" />}
                    error={errors.username}
                  >
                    <Input
                      placeholder="db_user"
                      value={form.username}
                      onChange={e => set('username', e.target.value)}
                      className={`bg-background h-10 ${errors.username ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
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
                        className={`bg-background h-10 pr-16 ${errors.password ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
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

                {/* SSL toggle */}
                <Field
                  label="SSL"
                  icon={<Shield className="w-3.5 h-3.5" />}
                >
                  <button
                    type="button"
                    onClick={() => set('ssl', !form.ssl)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${form.ssl ? 'bg-blue-500' : 'bg-border'
                      }`}
                    role="switch"
                    aria-checked={form.ssl}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${form.ssl ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </button>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {form.ssl ? 'SSL enabled — encrypted connection' : 'SSL disabled'}
                  </span>
                </Field>
              </section>
            )}

          </div>

          {/* ── Footer Actions ── */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-background/40">
            <button
              type="button"
              onClick={() => router.push('/connections')}
              className="text-sm text-muted-foreground hover:text-blue-400 transition-colors"
            >
              Cancel
            </button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-6 gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Connection
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}