'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, X, Settings, Moon, Sun, LogOut, Link as LucideLink, User, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sampleDatabase } from '@/lib/mock-data'
import { useAuth } from '@/lib/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { ConnectionManager } from '@/components/connection-manager'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DashboardLayoutProps {
  children: React.ReactNode
  selectedTable: string | null
  onSelectTable: (table: string) => void
  breadcrumb: Array<{ table: string; id?: string }>
  onNavigate: (breadcrumb: Array<{ table: string; id?: string }>) => void
}

export function DashboardLayout({
  children,
  selectedTable,
  onSelectTable,
  breadcrumb,
  onNavigate,
}: DashboardLayoutProps) {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showConnections, setShowConnections] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)

    // Keyboard shortcuts handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
      }
      // ? for keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowShortcuts(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleDarkMode = () => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  const filteredTables = Object.keys(sampleDatabase).filter(table =>
    table.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } border-r border-border bg-secondary transition-all duration-200 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <LucideLink className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">DBViz</span>
            </div>
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Database: sample_db
            </div>

            <div className="relative mb-4">
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              {filteredTables.map(table => {
                const rowCount = sampleDatabase[table as keyof typeof sampleDatabase].rows.length
                const isSelected = selectedTable === table

                return (
                  <button
                    key={table}
                    onClick={() => onSelectTable(table)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-background text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{table}</span>
                      <span
                        className={`text-xs ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}
                      >
                        ({rowCount})
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border p-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs bg-transparent"
              onClick={() => setShowConnections(true)}
            >
              <Database className="w-4 h-4 mr-2" />
              Connections
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground hover:bg-background p-2 rounded transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => {
                    onNavigate([])
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>

                {breadcrumb.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <button
                      onClick={() => {
                        onNavigate(breadcrumb.slice(0, index + 1))
                      }}
                      className={`transition-colors ${
                        index === breadcrumb.length - 1
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {crumb.table}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-foreground"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowConnections(true)}>
                  Manage Connections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />

        {/* Connections Manager Dialog */}
        <Dialog open={showConnections} onOpenChange={setShowConnections}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Database Connections</DialogTitle>
              <DialogDescription>
                Manage your saved database connections. Select one to use it in the explorer.
              </DialogDescription>
            </DialogHeader>
            <ConnectionManager />
          </DialogContent>
        </Dialog>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
