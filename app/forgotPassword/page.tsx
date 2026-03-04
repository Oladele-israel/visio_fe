'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Mail, ArrowLeft, Loader2, CheckCircle2,
  AlertCircle, Shield, Eye, EyeOff,
  RotateCcw, Lock, KeyRound,
} from 'lucide-react'

type Step = 'email' | 'otp' | 'newpw' | 'done'

/* ─────────────────────────────────────────
   STRENGTH METER
───────────────────────────────────────── */
function StrengthMeter({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels  = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors  = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const tcolors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400']
  if (!password) return null
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-border'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${tcolors[score]}`}>{labels[score]} password</p>
    </div>
  )
}

/* ─────────────────────────────────────────
   OTP INPUT — 6 digit boxes
───────────────────────────────────────── */
function OtpInput({ value, onChange, disabled, hasError }: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  hasError?: boolean
}) {
  const refs   = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const update = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d)).join('').slice(0, 6)
    onChange(next.replace(/\D/g, ''))
    if (char && index < 5) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        update(index, '')
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        const next = digits.map((d, i) => (i === index - 1 ? '' : d)).join('')
        onChange(next.replace(/\D/g, ''))
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // Auto-focus first empty box on mount
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d)
    refs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus()
  }, [])

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, i) => (
        <div key={i} className="relative">
          <input
            ref={el => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={e => update(i, e.target.value.replace(/\D/g, '').slice(-1))}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            className={`
              w-12 text-center text-xl font-bold rounded-xl border-2 bg-background
              transition-all duration-150 outline-none caret-transparent
              disabled:opacity-40 disabled:cursor-not-allowed
              ${hasError
                ? 'border-red-500/60 text-red-400 bg-red-500/5'
                : digit
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                  : 'border-border text-foreground hover:border-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
              }
            `}
            style={{ height: '56px' }}
          />
          {/* Filled indicator dot */}
          {digit && !hasError && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────── */
function StepIndicator({ steps, currentIndex }: {
  steps: { label: string }[]
  currentIndex: number
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-0 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              transition-all duration-300
              ${i < currentIndex
                ? 'bg-emerald-500 text-white'
                : i === currentIndex
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                  : 'bg-muted border border-border text-muted-foreground'
              }
            `}>
              {i < currentIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
              i === currentIndex ? 'text-blue-400' : i < currentIndex ? 'text-emerald-400' : 'text-muted-foreground'
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-500 ${i < currentIndex ? 'bg-emerald-400/50' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step,          setStep]          = useState<Step>('email')
  const [email,         setEmail]         = useState('')
  const [otp,           setOtp]           = useState('')
  const [otpError,      setOtpError]      = useState(false)
  const [resetToken,    setResetToken]    = useState('')
  const [newPw,         setNewPw]         = useState('')
  const [confirmPw,     setConfirmPw]     = useState('')
  const [showNewPw,     setShowNewPw]     = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [resendCooldown,setResendCooldown]= useState(0)
  const [resendMsg,     setResendMsg]     = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    if (step !== 'done') return
    const t = setTimeout(() => router.push('/login'), 3000)
    return () => clearTimeout(t)
  }, [step, router])

  const clearErrors = () => { setError(null); setOtpError(false) }

  /* ── STEP 1 ── */
  const handleRequestOtp = async () => {
    if (!email.trim()) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setError('Enter a valid email address'); return }
    setLoading(true); clearErrors()
    try {
      await api.post('/auth/reset/request-otp', { email: email.trim() })
      setStep('otp')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    clearErrors(); setResendMsg(null)
    try {
      await api.post('/auth/reset/request-otp', { email: email.trim() })
      setOtp(''); setResendCooldown(60)
      setResendMsg('A new code has been sent to your email.')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to resend code.')
    }
  }

  /* ── STEP 2 ── */
  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the full 6-digit code'); setOtpError(true); return }
    setLoading(true); clearErrors()
    try {
      const res = await api.post('/auth/reset/verify-otp', { email: email.trim(), otp })
      setResetToken(res.data?.resetToken ?? res.data?.data?.resetToken)
      setStep('newpw')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid or expired code.'
      setError(msg); setOtpError(true)
      if (msg.toLowerCase().includes('attempt') || msg.toLowerCase().includes('expired')) {
        setOtp('')
      }
    } finally { setLoading(false) }
  }

  /* ── STEP 3 ── */
  const handleResetPassword = async () => {
    if (!newPw)              { setError('New password is required'); return }
    if (newPw.length < 8)    { setError('Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    setLoading(true); clearErrors()
    try {
      await api.post('/auth/reset/password', { email: email.trim(), resetToken, newPassword: newPw })
      setStep('done')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to reset password. Please start over.')
    } finally { setLoading(false) }
  }

  const STEPS = [
    { label: 'Email' },
    { label: 'Verify' },
    { label: 'Password' },
  ]
  const stepIndex = { email: 0, otp: 1, newpw: 2, done: 3 }[step]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Back link */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">

          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                {step === 'done'
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <Shield className="w-5 h-5 text-blue-400" />
                }
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight">
                  {step === 'email' && 'Reset your password'}
                  {step === 'otp'   && 'Check your email'}
                  {step === 'newpw' && 'Create new password'}
                  {step === 'done'  && 'Password updated!'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step === 'email' && "We'll send a 6-digit code to verify it's you"}
                  {step === 'otp'   && `Code sent to ${email}`}
                  {step === 'newpw' && 'Choose a strong password for your account'}
                  {step === 'done'  && 'You can now sign in with your new password'}
                </p>
              </div>
            </div>
          </div>

          {/* Step bar */}
          {step !== 'done' && (
            <div className="px-6 pt-5 pb-1">
              <StepIndicator steps={STEPS} currentIndex={stepIndex} />
            </div>
          )}

          {/* Body */}
          <div className="p-6 space-y-4">

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border bg-red-500/10 border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ══ STEP 1: EMAIL ══════════════════════════════════════════════ */}
            {step === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearErrors() }}
                      onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
                      placeholder="you@example.com"
                      className="pl-10 h-11 bg-background focus-visible:ring-blue-500/30"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white gap-2 font-semibold"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                    : <><Mail className="w-4 h-4" /> Send verification code</>
                  }
                </Button>
              </div>
            )}

            {/* ══ STEP 2: OTP ════════════════════════════════════════════════ */}
            {step === 'otp' && (
              <div className="space-y-5">

                {/* Instruction */}
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Enter verification code</p>
                  <p className="text-xs text-muted-foreground">
                    We sent a 6-digit code to{' '}
                    <span className="text-foreground font-semibold">{email}</span>
                  </p>
                </div>

                {/* ── Split OTP boxes ── */}
                <div className="space-y-3">
                  <OtpInput
                    value={otp}
                    onChange={v => {
                      setOtp(v)
                      clearErrors()
                      // Auto-submit when all 6 digits are filled
                      if (v.length === 6) handleVerifyOtp()
                    }}
                    disabled={loading}
                    hasError={otpError}
                  />

                  {/* ── Fallback: plain text input ──
                      Visible below the boxes so users can always type/paste
                      the code even if split-box styling breaks            */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground text-center block">
                      Or type your code here
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setOtp(v)
                        clearErrors()
                        if (v.length === 6) handleVerifyOtp()
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                      placeholder="Enter 6-digit code"
                      disabled={loading}
                      className={`
                        h-11 bg-background text-center text-lg font-bold tracking-[0.4em]
                        focus-visible:ring-blue-500/30
                        ${otpError ? 'border-red-500/60 text-red-400' : otp.length === 6 ? 'border-emerald-500/50 text-emerald-400' : ''}
                      `}
                    />
                  </div>

                  {/* Character counter */}
                  <div className="flex gap-1 justify-center">
                    {[0,1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-200 ${
                          i < otp.length
                            ? otpError ? 'w-6 bg-red-500' : 'w-6 bg-blue-500'
                            : 'w-3 bg-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend */}
                {resendMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {resendMsg}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => { setStep('email'); setOtp(''); clearErrors() }}
                    className="text-muted-foreground hover:text-blue-400 transition-colors"
                  >
                    ← Use different email
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                {/* Verify button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white gap-2 font-semibold disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Verify code</>
                  }
                </Button>
              </div>
            )}

            {/* ══ STEP 3: NEW PASSWORD ═══════════════════════════════════════ */}
            {step === 'newpw' && (
              <div className="space-y-4">
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" /> New password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => { setNewPw(e.target.value); clearErrors() }}
                      placeholder="At least 8 characters"
                      className="h-11 bg-background pr-10 focus-visible:ring-blue-500/30"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <StrengthMeter password={newPw} />
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" /> Confirm password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={e => { setConfirmPw(e.target.value); clearErrors() }}
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                      placeholder="Repeat new password"
                      className={`h-11 bg-background pr-10 focus-visible:ring-blue-500/30 ${
                        confirmPw && newPw
                          ? confirmPw === newPw ? 'border-emerald-500/50' : 'border-red-500/50'
                          : ''
                      }`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPw && newPw && (
                    <p className={`text-xs flex items-center gap-1.5 ${confirmPw === newPw ? 'text-emerald-400' : 'text-red-400'}`}>
                      {confirmPw === newPw
                        ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                        : <><AlertCircle className="w-3 h-3" /> Passwords don't match</>
                      }
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={loading || !newPw || newPw !== confirmPw}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white gap-2 font-semibold disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                    : <><Shield className="w-4 h-4" /> Reset password</>
                  }
                </Button>
              </div>
            )}

            {/* ══ STEP 4: DONE ═══════════════════════════════════════════════ */}
            {step === 'done' && (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">You're all set!</p>
                  <p className="text-sm text-muted-foreground">
                    Password updated. Redirecting to login...
                  </p>
                </div>
                <Link href="/login" className="text-sm text-blue-400 hover:underline font-medium">
                  Go to login now →
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}