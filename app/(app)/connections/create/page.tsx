'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Database, Server, User, Lock, Hash,
  Globe, Shield, ChevronRight, Loader2,
  CheckCircle2, AlertCircle,
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
  { value: 'mysql',    label: 'MySQL',      defaultPort: '3306' },
  { value: 'mssql',   label: 'SQL Server',  defaultPort: '1433' },
  { value: 'sqlite',  label: 'SQLite',      defaultPort: ''     },
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
    if (!form.name.trim())     e.name     = 'Connection name is required'
    if (!form.type)            e.type     = 'Please select a database type'
    if (!form.host.trim() && form.type !== 'sqlite') e.host = 'Host is required'
    if (!form.port && form.type !== 'sqlite')        e.port = 'Port is required'
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
        name:     form.name,
        type:     form.type, // backend expects "POSTGRES" not "postgres"
        host:     form.host,
        port:     parseInt(form.port, 10),
        database: form.database,
        username: form.username,
        password: form.password,
        ssl:      form.ssl,
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
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        form.type === db.value
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
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-border pb-2">
                Server
              </h2>

              <div className={`grid gap-4 ${isSqlite ? '' : 'sm:grid-cols-3'}`}>
                {/* Host */}
                {!isSqlite && (
                  <div className="sm:col-span-2">
                    <Field
                      label="Host"
                      icon={<Server className="w-3.5 h-3.5" />}
                      error={errors.host}
                    >
                      <Input
                        placeholder="localhost or 192.168.1.1"
                        value={form.host}
                        onChange={e => set('host', e.target.value)}
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
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      form.ssl ? 'bg-blue-500' : 'bg-border'
                    }`}
                    role="switch"
                    aria-checked={form.ssl}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                        form.ssl ? 'translate-x-4' : 'translate-x-0'
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