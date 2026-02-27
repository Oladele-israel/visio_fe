'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectionModal({ open, onOpenChange }: ConnectionModalProps) {
  const router = useRouter()
  const [dbType, setDbType] = useState('postgresql')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState('5432')
  const [database, setDatabase] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setErrorMessage('')

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (!host || !database || !username) {
        throw new Error('Please fill in all required fields')
      }

      setTestResult('success')
    } catch (error) {
      setTestResult('error')
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  const handleConnect = async () => {
    if (testResult !== 'success') {
      alert('Please test connection first')
      return
    }

    // Store connection details in session/state for demo
    sessionStorage.setItem('dbConnection', JSON.stringify({
      type: dbType,
      host,
      port,
      database,
      username,
    }))

    router.push('/dashboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Database</DialogTitle>
          <DialogDescription>
            Enter your database credentials to get started exploring your data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Database Type */}
          <div className="space-y-2">
            <Label htmlFor="db-type">Database Type</Label>
            <Select value={dbType} onValueChange={setDbType}>
              <SelectTrigger id="db-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Host */}
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              placeholder="localhost"
              value={host}
              onChange={e => setHost(e.target.value)}
              disabled={testing}
            />
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              placeholder="5432"
              value={port}
              onChange={e => setPort(e.target.value)}
              disabled={testing}
            />
          </div>

          {/* Database */}
          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              placeholder="mydatabase"
              value={database}
              onChange={e => setDatabase(e.target.value)}
              disabled={testing}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="postgres"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={testing}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={testing}
            />
          </div>

          {/* Test Result */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Connection successful
              </span>
            </div>
          )}

          {testResult === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Connection failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleConnect}
              disabled={testResult !== 'success'}
            >
              Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
