'use client'

import React, { useState, useEffect } from 'react'
import {
  Moon, Sun, LogOut, Link as LucideLink,
  Database, ChevronRight, LayoutDashboard,
  Settings, Bell, PanelLeftClose, PanelLeftOpen,
  ChevronDown, Plus, List, Plug, Zap, Sparkles,
  Command, User, ShieldCheck, X
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
   NAV ITEM — SENIOR REUSABLE SIDEBAR BUTTON
───────────────────────────────────────── */
function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
  children,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
        active
          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-md shadow-sky-500/10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-sky-400 before:rounded-r-full'
          : 'text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 border border-transparent'
      }`}
    >
      <span className={`shrink-0 w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-sky-400' : 'text-muted-foreground group-hover:text-sky-400'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
          {badge}
        </span>
      )}
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
  const [connectionsOpen, setConnectionsOpen] = useState(true)

  /* Visio Agent Status for Live Sidebar Indicator */
  const [agentLiveStatus, setAgentLiveStatus] = useState<'active' | 'offline'>('active')

  // Auto-expand connections submenu if on a connections route
  useEffect(() => {
    if (pathname?.startsWith('/connections')) setConnectionsOpen(true)
  }, [pathname])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))

    /* Check local agent ping for sidebar status */
    const checkAgentPing = async () => {
      try {
        const res = await fetch('http://127.0.0.1:4567/health').catch(() => null)
        setAgentLiveStatus(res && res.ok ? 'active' : 'offline')
      } catch {
        setAgentLiveStatus('offline')
      }
    }
    checkAgentPing()
    const interval = setInterval(checkAgentPing, 10000)

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
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearInterval(interval)
    }
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
  const isVisualizeActive = pathname?.startsWith('/visualize')

  /* ─────────────────────────────────────────
     SIDEBAR INNER CONTENT (SENIOR PRODUCTION UX)
  ───────────────────────────────────────── */
  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/80 select-none">

      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border/80 shrink-0 bg-card/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/40 shrink-0">
            <LucideLink className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-foreground tracking-tight text-sm flex items-center gap-1.5">
              Visio
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 tracking-wider">
                Agent
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground/80 font-medium">Data Explorer &amp; Visualizer</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Links Container */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">

        {/* SECTION 1: WORKSPACE */}
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70 px-3 mb-2 flex items-center justify-between">
            <span>Workspace</span>
          </p>

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

          {isVisualizeActive && (
            <NavItem
              icon={<Database className="w-4 h-4" />}
              label="Data Explorer"
              active={true}
              badge="Active"
            />
          )}
        </div>

        {/* SECTION 2: CONNECTIONS */}
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70 px-3 mb-2 flex items-center justify-between">
            <span>Databases</span>
          </p>

          <div>
            <NavItem
              icon={<Plug className="w-4 h-4" />}
              label="Connections"
              active={isConnectionsActive && pathname === '/connections'}
              onClick={() => setConnectionsOpen(prev => !prev)}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  connectionsOpen ? 'rotate-180 text-sky-400' : 'text-muted-foreground'
                }`}
              />
            </NavItem>

            {/* Submenu */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                connectionsOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-4 pl-3 border-l border-border/80 space-y-1 py-1">
                <button
                  onClick={() => { router.push('/connections/create'); closeMobile() }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/connections/create'
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  New Connection
                </button>

                <button
                  onClick={() => { router.push('/connections'); closeMobile() }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/connections'
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <List className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  All Connections
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM */}
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70 px-3 mb-2">
            <span>System</span>
          </p>

          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
            active={isSettingsActive}
            onClick={() => { router.push('/settings'); closeMobile() }}
          />

          <NavItem
            icon={<Command className="w-4 h-4" />}
            label="Shortcuts"
            badge="⌘?"
            onClick={() => { setShowShortcuts(true); closeMobile() }}
          />
        </div>

        {/* LIVE VISIO AGENT STATUS WIDGET */}
        <div className="p-3 rounded-2xl bg-card/60 border border-border/80 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-300 fill-current" />
              Visio Agent Bridge
            </span>
            <span className={`w-2 h-2 rounded-full ${agentLiveStatus === 'active' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
          </div>
          <p className="text-[11px] font-mono text-foreground font-semibold truncate">
            {agentLiveStatus === 'active' ? '127.0.0.1:4567 (Connected)' : 'Standby / Offline'}
          </p>
        </div>

      </nav>

      {/* Footer: User Info & Logout */}
      <div className="shrink-0 border-t border-border/80 p-3 bg-card/40 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-background/60 border border-border/80">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {userInitials}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-foreground leading-none truncate">
                {user?.name ?? 'Developer'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                {user?.email ?? 'dev@visio.app'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/80
          transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:block shrink-0 border-r border-border/80 bg-card
          transition-all duration-300 ease-in-out overflow-hidden shadow-xl
          ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}
        `}
      >
        {sidebarOpen && <SidebarContent />}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="h-14 shrink-0 border-b border-border/80 bg-card/60 backdrop-blur-xl flex items-center px-4 gap-3">

          {/* Sidebar toggle */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(prev => !prev)
              } else {
                setSidebarOpen(prev => !prev)
              }
            }}
            className="p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeftOpen className="w-4 h-4" />
            }
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs min-w-0 flex-1" aria-label="Breadcrumb">
            <button
              onClick={() => onNavigate([])}
              className={`shrink-0 transition-colors font-semibold ${
                breadcrumb.length === 0
                  ? 'text-sky-400 font-bold'
                  : 'text-muted-foreground hover:text-sky-400'
              }`}
            >
              Dashboard
            </button>

            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <button
                  onClick={() => onNavigate(breadcrumb.slice(0, index + 1))}
                  className={`capitalize truncate transition-colors font-semibold ${
                    index === breadcrumb.length - 1
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground hover:text-sky-400'
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
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sky-400 rounded-full ring-2 ring-card" />
            </button>

            <div className="w-px h-5 bg-border/80 mx-1" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-sky-500/10 transition-colors outline-none">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs">
                    {userInitials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-foreground leading-none">
                      {user?.name ?? 'Developer'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate max-w-[120px] font-mono">
                      {user?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl">
                <div className="px-3 py-2 sm:hidden">
                  <p className="text-xs font-bold text-foreground">{user?.name ?? 'Developer'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />

                <DropdownMenuItem onClick={() => router.push('/connections/create')} className="rounded-xl text-xs font-semibold cursor-pointer">
                  <Plus className="w-4 h-4 mr-2 text-sky-400" />
                  New Connection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/connections')} className="rounded-xl text-xs font-semibold cursor-pointer">
                  <Database className="w-4 h-4 mr-2 text-sky-400" />
                  View Connections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl text-xs font-semibold cursor-pointer">
                  <Settings className="w-4 h-4 mr-2 text-sky-400" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShortcuts(true)} className="rounded-xl text-xs font-semibold cursor-pointer">
                  <Command className="w-4 h-4 mr-2 text-sky-400" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl text-xs font-semibold text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-auto bg-visio-grid">
          {children}
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  )
}