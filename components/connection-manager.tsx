'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Database, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreateConnectionRequest } from '@/lib/auth-types'

export function ConnectionManager() {
  const { connections, selectedConnection, addConnection, deleteConnection, selectConnection, fetchConnections } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateConnectionRequest>({
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
  })

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: string | number }
  ) => {
    const { name, value } = 'target' in e ? e.target : e
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? Number(value) : value,
    }))
  }

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await addConnection(formData)
      setFormData({
        name: '',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
      })
      setShowDialog(false)
      await fetchConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return

    try {
      await deleteConnection(id)
    } catch (err) {
      console.error('Failed to delete connection:', err)
    }
  }

  const getDefaultPort = (type: 'postgresql' | 'mysql' | 'sqlite') => {
    const ports: Record<string, number> = {
      postgresql: 5432,
      mysql: 3306,
      sqlite: 0,
    }
    return ports[type]
  }

  return (
    <div className="space-y-4">
      {/* Connections List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Saved Connections</h3>
        <div className="space-y-2">
          {connections.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No connections saved yet</p>
          ) : (
            connections.map(conn => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-3 bg-secondary rounded hover:bg-secondary/80 transition-colors group"
              >
                <button
                  onClick={() => selectConnection(conn.id)}
                  className="flex-1 text-left space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{conn.name}</span>
                    {selectedConnection?.id === conn.id && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conn.type} · {conn.host}:{conn.port}/{conn.database}
                  </p>
                </button>
                <button
                  onClick={() => handleDeleteConnection(conn.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete connection"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Connection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <Plus className="w-4 h-4" />
            Add Database Connection
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Database Connection</DialogTitle>
            <DialogDescription>
              Enter your database credentials. Your password is encrypted and never stored in plain text.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddConnection} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">Connection Name</label>
              <Input
                name="name"
                placeholder="My Production DB"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Database Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={e => {
                  handleChange(e)
                  setFormData(prev => ({
                    ...prev,
                    port: getDefaultPort(e.target.value as any),
                  }))
                }}
                disabled={isLoading}
                className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-foreground text-sm"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Host</label>
                <Input
                  name="host"
                  placeholder="localhost"
                  value={formData.host}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Port</label>
                <Input
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Database Name</label>
              <Input
                name="database"
                placeholder="mydb"
                value={formData.database}
                onChange={handleChange}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                name="username"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Adding...' : 'Add Connection'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
