'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ChevronRight, User, Lock, Terminal,
  Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, X, Copy, Check, Plus,
  Trash2, Key, RefreshCw, Shield,
  Clock, AlertTriangle, Calendar,
} from 'lucide-react'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface PAT {
  id: string
  name: string
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

type SettingsTab = 'profile' | 'security' | 'tokens'

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never used'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

function isExpired(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

/* ─────────────────────────────────────────
   SUCCESS REDIRECT MODAL
───────────────────────────────────────── */
function SuccessRedirectModal({ message }: { message: string }) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.href = '/dashboard'
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard in{' '}
            <span className="text-blue-400 font-semibold tabular-nums">{countdown}s</span>
          </p>
        </div>
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
        <button onClick={() => { window.location.href = '/dashboard' }} className="text-xs text-blue-400 hover:underline">
          Go now
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   FIELD
───────────────────────────────────────── */
function Field({
  label, icon, error, hint, children,
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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   SECTION CARD
───────────────────────────────────────── */
function SectionCard({
  title, description, icon, children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ALERT BANNER
───────────────────────────────────────── */
function Alert({
  type, message, onDismiss,
}: {
  type: 'success' | 'error'
  message: string
  onDismiss?: () => void
}) {
  const styles = type === 'success'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : 'bg-red-500/10 border-red-500/20 text-red-400'
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border text-sm ${styles}`}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   PASSWORD INPUT
───────────────────────────────────────── */
function PasswordInput({
  value, onChange, placeholder, className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-background h-10 pr-14 focus-visible:ring-blue-500/30 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────
   PASSWORD STRENGTH METER
───────────────────────────────────────── */
function StrengthMeter({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400']

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>
        {labels[score]} password
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────
   TOKEN REVEAL MODAL
───────────────────────────────────────── */
function TokenRevealModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Token Generated</p>
              <p className="text-xs text-muted-foreground">Copy it now — you won't see it again</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              This token is shown <strong>exactly once</strong>. Store it securely in your
              terminal profile or password manager. It cannot be recovered.
            </span>
          </div>
          <div className="relative">
            <div className="bg-background border border-border rounded-lg px-4 py-3 pr-12 font-mono text-sm text-emerald-400 break-all select-all">
              {token}
            </div>
            <button onClick={copy} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Usage</p>
            <div className="bg-background border border-border rounded-lg px-4 py-3 font-mono text-xs text-muted-foreground">
              <span className="text-blue-400">Authorization:</span> Bearer {token.substring(0, 20)}...
            </div>
          </div>
          <Button onClick={copy} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-10 gap-2">
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Token</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   REVOKE CONFIRM MODAL
───────────────────────────────────────── */
function RevokeModal({
  tokenName, onClose, onConfirm, isRevoking,
}: {
  tokenName: string
  onClose: () => void
  onConfirm: () => void
  isRevoking: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Revoke Token</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Revoke <span className="text-foreground font-medium">"{tokenName}"</span>?
              Any scripts or tools using it will stop working immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
            Cancel
          </button>
          <Button onClick={onConfirm} disabled={isRevoking} className="bg-red-600 hover:bg-red-500 text-white h-9 px-5 gap-2">
            {isRevoking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Revoking...</>
              : <><Trash2 className="w-4 h-4" /> Revoke Token</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   TAB: PROFILE
───────────────────────────────────────── */
function ProfileTab() {
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      e.email = 'Invalid email address'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildPayload = () => {
    const payload: Record<string, string> = {}
    if (name.trim())  payload.name  = name.trim()
    if (email.trim()) payload.email = email.trim()
    return payload
  }

  const nothingToSave = !name.trim() && !email.trim()

  const handleSave = async () => {
    if (nothingToSave || !validate()) return
    setSaving(true)
    setError(null)
    try {
      await api.patch('/user', buildPayload())
      const updated = [name.trim() && 'name', email.trim() && 'email'].filter(Boolean).join(' and ')
      setSuccessMsg(`Your ${updated} has been updated successfully`)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionCard
        title="Profile Information"
        description="Update your display name or email — fill in only what you'd like to change"
        icon={<User className="w-4 h-4 text-blue-400" />}
      >
        <div className="space-y-5">
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display Name" icon={<User className="w-3.5 h-3.5" />} hint="Leave blank to keep current name">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="bg-background h-10 focus-visible:ring-blue-500/30"
              />
            </Field>
            <Field label="Email Address" icon={<User className="w-3.5 h-3.5" />} error={errors.email} hint="Leave blank to keep current email">
              <Input
                value={email}
                onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })) }}
                placeholder="you@example.com"
                className="bg-background h-10 focus-visible:ring-blue-500/30"
              />
            </Field>
          </div>

          {nothingToSave && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-blue-400 shrink-0" />
              Fill in at least one field to save changes
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || nothingToSave}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {successMsg && <SuccessRedirectModal message={successMsg} />}
    </>
  )
}

/* ─────────────────────────────────────────
   TAB: SECURITY
   Only "Change Password" lives here now.
   The reset flow lives at /forgot-password,
   linked from the login page.
───────────────────────────────────────── */
function SecurityTab() {
  const [current,      setCurrent]      = useState('')
  const [newPw,        setNewPw]        = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [pwSaving,     setPwSaving]     = useState(false)
  const [pwError,      setPwError]      = useState<string | null>(null)
  const [pwErrors,     setPwErrors]     = useState<Record<string, string>>({})
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null)

  const validatePw = () => {
    const e: Record<string, string> = {}
    if (!current)              e.current = 'Current password is required'
    if (!newPw)                e.newPw   = 'New password is required'
    else if (newPw.length < 8) e.newPw   = 'Must be at least 8 characters'
    if (newPw !== confirm)     e.confirm  = 'Passwords do not match'
    setPwErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChangePw = async () => {
    if (!validatePw()) return
    setPwSaving(true)
    setPwError(null)
    try {
      await api.patch('/auth/password', { currentPassword: current, newPassword: newPw })
      setPwSuccessMsg('Password changed successfully')
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <>
      <SectionCard
        title="Change Password"
        description="Update your current password while staying logged in"
        icon={<Lock className="w-4 h-4 text-blue-400" />}
      >
        <div className="space-y-5">
          {pwError && <Alert type="error" message={pwError} onDismiss={() => setPwError(null)} />}

          <Field label="Current Password" icon={<Lock className="w-3.5 h-3.5" />} error={pwErrors.current}>
            <PasswordInput
              value={current}
              onChange={v => { setCurrent(v); if (pwErrors.current) setPwErrors(p => ({ ...p, current: '' })) }}
              placeholder="Your current password"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password" icon={<Lock className="w-3.5 h-3.5" />} error={pwErrors.newPw}>
              <PasswordInput
                value={newPw}
                onChange={v => { setNewPw(v); if (pwErrors.newPw) setPwErrors(p => ({ ...p, newPw: '' })) }}
                placeholder="At least 8 characters"
              />
              <StrengthMeter password={newPw} />
            </Field>

            <Field label="Confirm Password" icon={<Lock className="w-3.5 h-3.5" />} error={pwErrors.confirm}>
              <PasswordInput
                value={confirm}
                onChange={v => { setConfirm(v); if (pwErrors.confirm) setPwErrors(p => ({ ...p, confirm: '' })) }}
                placeholder="Repeat new password"
                className={
                  confirm && newPw
                    ? confirm === newPw
                      ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30'
                      : 'border-red-500/50 focus-visible:ring-red-500/30'
                    : ''
                }
              />
              {confirm && newPw && (
                <p className={`text-xs flex items-center gap-1.5 ${confirm === newPw ? 'text-emerald-400' : 'text-red-400'}`}>
                  {confirm === newPw
                    ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                    : <><AlertCircle className="w-3 h-3" /> Passwords don't match</>
                  }
                </p>
              )}
            </Field>
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Forgot password link — takes user to the dedicated reset page */}
            <a
              href="/forgotPassword"
              className="text-xs text-blue-400 hover:underline"
            >
              Forgot your password?
            </a>
            <Button onClick={handleChangePw} disabled={pwSaving} className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 gap-2">
              {pwSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                : <><Shield className="w-4 h-4" /> Update Password</>
              }
            </Button>
          </div>
        </div>
      </SectionCard>

      {pwSuccessMsg && <SuccessRedirectModal message={pwSuccessMsg} />}
    </>
  )
}

/* ─────────────────────────────────────────
   TAB: ACCESS TOKENS
───────────────────────────────────────── */
function TokensTab() {
  const [tokens,       setTokens]       = useState<PAT[]>([])
  const [loading,      setLoading]      = useState(false)
  const [fetched,      setFetched]      = useState(false)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const [name,         setName]         = useState('')
  const [expiresAt,    setExpiresAt]    = useState('')
  const [creating,     setCreating]     = useState(false)
  const [createAlert,  setCreateAlert]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [nameError,    setNameError]    = useState('')
  const [revealToken,  setRevealToken]  = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<PAT | null>(null)
  const [revoking,     setRevoking]     = useState(false)

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await api.get('/auth/tokens')
      setTokens(res.data?.data ?? res.data ?? [])
      setFetched(true)
    } catch (err: any) {
      setFetchError(err?.response?.data?.message ?? 'Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }, [])

  const [init, setInit] = useState(false)
  if (!init) { setInit(true); fetchTokens() }

  const handleCreate = async () => {
    if (!name.trim()) { setNameError('Token name is required'); return }
    setNameError('')
    setCreating(true)
    setCreateAlert(null)
    try {
      const res = await api.post('/auth/tokens', {
        name: name.trim(),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      })
      const created = res.data?.data ?? res.data
      setRevealToken(created.token)
      setTokens(prev => [created, ...prev])
      setName('')
      setExpiresAt('')
    } catch (err: any) {
      setCreateAlert({ type: 'error', msg: err?.response?.data?.message ?? 'Failed to create token' })
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await api.delete(`/auth/tokens/${revokeTarget.id}`)
      setTokens(prev => prev.filter(t => t.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch {
      setRevokeTarget(null)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Generate Access Token"
        description="Create tokens for CLI, scripts, and terminal access"
        icon={<Terminal className="w-4 h-4 text-blue-400" />}
      >
        <div className="space-y-5">
          {createAlert && <Alert type={createAlert.type} message={createAlert.msg} onDismiss={() => setCreateAlert(null)} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Token Name" icon={<Key className="w-3.5 h-3.5" />} error={nameError} hint="e.g. Laptop CLI, CI Pipeline, Home Server">
              <Input
                value={name}
                onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
                placeholder="My CLI Token"
                className="bg-background h-10 focus-visible:ring-blue-500/30"
              />
            </Field>
            <Field label="Expiry Date" icon={<Calendar className="w-3.5 h-3.5" />} hint="Leave empty for a token that never expires">
              <Input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-background h-10 focus-visible:ring-blue-500/30 text-foreground [color-scheme:dark]"
              />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Generated tokens are shown <strong className="text-foreground">once</strong> and cannot be retrieved.
              Store them securely in your{' '}
              <code className="bg-background px-1 py-0.5 rounded text-blue-400">~/.bashrc</code> or a secrets manager.
            </span>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 gap-2">
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Plus className="w-4 h-4" /> Generate Token</>
              }
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Active Tokens"
        description="Manage and revoke your existing access tokens"
        icon={<Key className="w-4 h-4 text-blue-400" />}
      >
        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-background border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-border rounded w-1/3" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
                <div className="h-8 w-16 bg-border rounded-lg" />
              </div>
            ))}
          </div>
        )}
        {fetchError && (
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
            <p className="text-sm text-red-400">{fetchError}</p>
            <button onClick={fetchTokens} className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 mx-auto">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
        {!loading && !fetchError && fetched && tokens.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-foreground">No tokens yet</p>
            <p className="text-xs text-muted-foreground">Generate a token above to start using the API from your terminal.</p>
          </div>
        )}
        {!loading && !fetchError && tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map(token => {
              const expired = isExpired(token.expiresAt)
              return (
                <div
                  key={token.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-all ${
                    expired ? 'bg-background/50 border-border opacity-60' : 'bg-background border-border hover:border-blue-500/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    expired ? 'bg-muted border border-border' : 'bg-blue-500/10 border border-blue-500/20'
                  }`}>
                    <Key className={`w-4 h-4 ${expired ? 'text-muted-foreground' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{token.name}</span>
                      {expired && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{timeAgo(token.lastUsedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {token.expiresAt ? `Expires ${formatDate(token.expiresAt)}` : 'Never expires'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRevokeTarget(token)}
                    className="self-start sm:self-auto p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {revealToken && <TokenRevealModal token={revealToken} onClose={() => setRevealToken(null)} />}
      {revokeTarget && (
        <RevokeModal
          tokenName={revokeTarget.name}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
          isRevoking={revoking}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',  label: 'Profile',       icon: <User     className="w-4 h-4" /> },
    { id: 'security', label: 'Security',      icon: <Shield   className="w-4 h-4" /> },
    { id: 'tokens',   label: 'Access Tokens', icon: <Terminal className="w-4 h-4" /> },
  ]

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account, security, and API access</p>
        </div>

        <div className="flex gap-1 p-1 bg-card border border-border rounded-xl w-full sm:w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'profile'  && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'tokens'   && <TokensTab />}
        </div>
      </div>
    </div>
  )
}