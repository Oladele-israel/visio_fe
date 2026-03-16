'use client'

import React, { useState }  from 'react'
import { useRouter }         from 'next/navigation'
import { useAuth }           from '@/lib/auth-context'
import { Button }            from '@/components/ui/button'
import { Input }             from '@/components/ui/input'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router       = useRouter()
  const { signup }   = useAuth()

  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
  })

  const [error,               setError]               = useState<string | null>(null)
  const [isLoading,           setIsLoading]           = useState(false)
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim())                         return setError('Name is required')
    if (!formData.email.trim())                        return setError('Email is required')
    if (formData.password.length < 6)                  return setError('Password must be at least 6 characters')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match')

    try {
      setIsLoading(true)
      await signup(formData.email, formData.password, formData.name)
    } catch (err: any) {
      const message = err?.message || 'Signup failed'
      setError(Array.isArray(message) ? message[0] : message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join DBViz to explore your databases</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text" name="name" placeholder="John Doe"
                value={formData.name} onChange={handleChange}
                className="pl-10" disabled={isLoading} autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email" name="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
                className="pl-10" disabled={isLoading} autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'} name="password"
                placeholder="••••••••" value={formData.password}
                onChange={handleChange} className="pl-10 pr-10"
                disabled={isLoading} autoComplete="new-password"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                placeholder="••••••••" value={formData.confirmPassword}
                onChange={handleChange} className="pl-10 pr-10"
                disabled={isLoading} autoComplete="new-password"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowConfirmPassword(p => !p)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-10" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>

        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  )
}