'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Server, User, Lock, Hash,
  Globe, Shield, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Cloud, Terminal, Copy, Check, Zap, Laptop,
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
  const [activeOs, setActiveOs] = useState<'mac' | 'linux' | 'win'>('mac')
  const [tunnelServiceMode, setTunnelServiceMode] = useState<'quick' | 'daemon'>('quick')
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

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

              {/* Professional Step-by-Step Local Tunnel Wizard */}
              {!isSqlite && targetMode === 'tunnel' && (
                <div className="p-5 bg-card/90 border border-amber-500/30 rounded-xl shadow-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Local Database Tunnel Guide</p>
                        <p className="text-[11px] text-muted-foreground">Follow these 3 simple steps to bridge your local laptop database to production.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      TLS Encrypted
                    </span>
                  </div>

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
                          ⚡ Quick Dev Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setTunnelServiceMode('daemon')}
                          className={`px-2 py-0.5 rounded transition-colors ${tunnelServiceMode === 'daemon' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          🔄 24/7 Background Service
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
                        <p className="text-[11px] text-muted-foreground">Run once to install as a system service that auto-starts at system boot:</p>
                        <div className="flex items-center justify-between bg-muted/40 p-2 rounded">
                          <code className="font-mono text-[11px] text-blue-300">
                            sudo cloudflared service install
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('sudo cloudflared service install', 'daemon')}
                            className="text-muted-foreground hover:text-blue-400 flex items-center gap-1 text-[10px]"
                          >
                            {copiedCmd === 'daemon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedCmd === 'daemon' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
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
                <Input
                  placeholder={isSqlite ? './data.db' : 'my_database'}
                  value={form.database}
                  onChange={e => set('database', e.target.value)}
                  className={`bg-background h-10 ${errors.database ? 'border-red-500/50 focus-visible:ring-red-500/30' : 'focus-visible:ring-blue-500/30'}`}
                />
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