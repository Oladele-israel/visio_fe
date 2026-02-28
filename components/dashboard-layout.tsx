'use client'

import React, { useState, useEffect } from 'react'
import {
  Moon, Sun, LogOut, Link as LucideLink,
  Database, ChevronRight, LayoutDashboard,
  Settings, Bell, PanelLeftClose, PanelLeftOpen,
  ChevronDown, Plus, List, Plug,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface DashboardLayoutProps {
  children: React.ReactNode
  selectedTable: string | null
  onSelectTable: (table: string) => void
  breadcrumb: Array<{ table: string; id?: string }>
  onNavigate: (breadcrumb: Array<{ table: string; id?: string }>) => void
}

/* ─────────────────────────────────────────
   NAV ITEM — reusable sidebar button
───────────────────────────────────────── */
function NavItem({
  icon,
  label,
  active,
  onClick,
  children,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10'
      }`}
    >
      <span className="shrink-0 w-4 h-4">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function DashboardLayout({
  children,
  selectedTable,
  onSelectTable,
  breadcrumb,
  onNavigate,
}: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [connectionsOpen, setConnectionsOpen] = useState(false)

  // Auto-expand connections submenu if on a connections route
  useEffect(() => {
    if (pathname?.startsWith('/connections')) setConnectionsOpen(true)
  }, [pathname])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowShortcuts(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleDarkMode = () => {
    const html = document.documentElement
    isDark ? html.classList.remove('dark') : html.classList.add('dark')
    setIsDark(!isDark)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const closeMobile = () => setMobileSidebarOpen(false)

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const isDashboardActive = pathname === '/dashboard' || pathname === '/'
  const isSettingsActive = pathname === '/settings'
  const isConnectionsActive = pathname?.startsWith('/connections')

  /* ─────────────────────────────────────────
     SIDEBAR INNER CONTENT
  ───────────────────────────────────────── */
  const SidebarContent = () => (
    <div className="h-full flex flex-col">

      {/* Logo */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-border shrink-0">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <LucideLink className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground tracking-tight text-base">DBViz</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 pt-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-3">
          Menu
        </p>

        {/* Dashboard */}
        <NavItem
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          active={isDashboardActive}
          onClick={() => {
            onNavigate([])
            router.push('/dashboard')
            closeMobile()
          }}
        />

        {/* Connections — expandable */}
        <div>
          <NavItem
            icon={<Plug className="w-4 h-4" />}
            label="Connections"
            active={isConnectionsActive}
            onClick={() => setConnectionsOpen(prev => !prev)}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                connectionsOpen ? 'rotate-180' : ''
              } ${isConnectionsActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
            />
          </NavItem>

          {/* Submenu */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              connectionsOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 pl-3 border-l border-border space-y-0.5 py-1">

              <button
                onClick={() => { router.push('/connections/create'); closeMobile() }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === '/connections/create'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Create Connection
              </button>

              <button
                onClick={() => { router.push('/connections'); closeMobile() }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === '/connections'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                View All Connections
              </button>

            </div>
          </div>
        </div>

        {/* Settings */}
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={isSettingsActive}
          onClick={() => { router.push('/settings'); closeMobile() }}
        />
      </nav>

      {/* Footer: Logout */}
      <div className="shrink-0 border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </button>
      </div>
    </div>
  )

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out md:hidden
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:block shrink-0 border-r border-border bg-card
          transition-all duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-60' : 'w-0 border-r-0'}
        `}
      >
        {sidebarOpen && <SidebarContent />}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="h-14 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3">

          {/* Sidebar toggle */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(prev => !prev)
              } else {
                setSidebarOpen(prev => !prev)
              }
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-5 h-5" />
              : <PanelLeftOpen className="w-5 h-5" />
            }
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1" aria-label="Breadcrumb">
            <button
              onClick={() => onNavigate([])}
              className={`shrink-0 transition-colors ${
                breadcrumb.length === 0
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-blue-400'
              }`}
            >
              Dashboard
            </button>

            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <button
                  onClick={() => onNavigate(breadcrumb.slice(0, index + 1))}
                  className={`capitalize truncate transition-colors ${
                    index === breadcrumb.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-blue-400'
                  }`}
                >
                  {crumb.table}
                  {crumb.id && (
                    <span className="text-muted-foreground font-normal"> #{crumb.id}</span>
                  )}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-1 ring-card" />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors outline-none">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{userInitials}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-foreground leading-none">
                      {user?.name ?? 'User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate max-w-[120px]">
                      {user?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 sm:hidden">
                  <p className="text-xs font-medium text-foreground">{user?.name ?? 'User'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />

                <DropdownMenuItem onClick={() => router.push('/connections/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Connection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/connections')}>
                  <Database className="w-4 h-4 mr-2" />
                  View Connections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                  <span className="mr-2 text-xs font-mono">⌘?</span>
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-blue-400 focus:text-blue-400 focus:bg-blue-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  )
}