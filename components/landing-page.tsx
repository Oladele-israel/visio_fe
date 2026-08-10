'use client'

import { useState }            from 'react'
import Link                    from 'next/link'
import { Button }              from '@/components/ui/button'
import { useAuth }             from '@/lib/auth-context'
import { AnimatedDbDemo }      from './animated-db-demo'
import {
  Database, Zap, Eye, ArrowRight,
  Shield, LogOut, Terminal, Copy,
  Check, Server, Lock, RefreshCw,
  Layers, ArrowUpRight, Code2, Cpu,
  Sparkles, GitBranch, Activity, KeyRound,
  CheckCircle2, ChevronRight, Globe2
} from 'lucide-react'

export function LandingPage() {
  const { user, isLoading, logout } = useAuth()
  const [copiedCmd, setCopiedCmd]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'postgres' | 'mysql' | 'mssql' | 'sqlite'>('postgres')

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npx visio-agent@latest')
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden">

      {/* ── Background Grid & Radial Lighting Matrix ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Top Glow Ambient */}
        <div
          className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.12) 0%, rgba(56, 189, 248, 0.03) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Secondary Side Glow */}
        <div
          className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-50 border-b border-slate-800/80 bg-[#030712]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Visio Brand Badge */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
              <Database className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">visio</span>
              <span className="text-[11px] font-mono text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                gui
              </span>
            </div>
          </Link>

          {/* Quick Engine Switcher & Auth */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-28 h-8 rounded-lg bg-slate-800/60 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono hidden md:block px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  {user.email}
                </span>
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 border-0 gap-1.5 shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                  >
                    Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <button
                  onClick={() => logout()}
                  className="h-9 px-3 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-slate-800/60"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 border-0 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                  >
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Landing Body ── */}
      <main className="relative z-10 flex-1 flex flex-col">

        {/* ── Hero Section ── */}
        <section className="px-4 sm:px-6 pt-16 sm:pt-24 pb-14 max-w-5xl mx-auto text-center flex flex-col items-center">

          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-300 text-xs font-medium mb-8 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-400">visio-agent@1.0.8</span>
            <span className="text-slate-600">·</span>
            <span className="text-sky-400 font-semibold">Zero-Config Local Tunneling</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mb-6">
            Visual database explorer for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300">
              local &amp; cloud PostgreSQL.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
            Traverse foreign keys, run safe queries, and inspect raw rows directly from your browser. Connect local databases in seconds via <code className="text-sky-300 font-mono">npx visio-agent@latest</code>.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-12 w-full sm:w-auto">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11 px-8 text-sm font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 border-0 gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95">
                  Launch Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-11 px-8 text-sm font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 border-0 gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95">
                    Start Exploring Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-11 px-7 text-sm font-semibold text-slate-300 hover:text-white border-slate-800 bg-slate-900/60 hover:bg-slate-800/80">
                    Sign in to Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Terminal Command Widget */}
          <div className="w-full max-w-xl p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-2xl space-y-2.5 text-left font-mono backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] px-1 font-sans">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-sky-400" />
                Connect Local Database via Terminal:
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                No Installation Overhead
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#020408] border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-inner">
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-sky-400 font-bold select-none">$</span>
                <span className="text-emerald-400 font-bold tracking-wide truncate">
                  npx visio-agent@latest
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCmd}
                className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-sans font-bold flex items-center gap-1.5 shrink-0 transition-all border border-sky-500/30 active:scale-95"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                {copiedCmd ? 'Copied!' : 'Copy NPX'}
              </button>
            </div>
          </div>

        </section>

        {/* ── Product Interactive Showcase Container ── */}
        <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto w-full flex flex-col items-center">
          <div className="w-full space-y-1 text-center mb-4">
            <span className="text-[11px] font-mono text-sky-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Workbench Preview
            </span>
          </div>

          <AnimatedDbDemo />
        </section>

        {/* ── Linear-Style Bento Feature Grid ── */}
        <section className="px-4 sm:px-6 py-20 max-w-6xl mx-auto w-full border-t border-slate-800/80">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-sky-400 font-extrabold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 font-mono">
              Engineered Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for high-speed database inspection
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Bento Card 1 (Span 2) */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 group backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">1-Click FK Relation Traversal &amp; History</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                  Step into related records across foreign key constraints with zero manual SQL joins. Every hop preserves breadcrumb history so you can move forward and backward seamlessly.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020408] border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center gap-2 overflow-x-auto">
                <span className="text-slate-500">public</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-sky-400 font-bold">users (usr_1a2b)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-emerald-400 font-bold">posts (3 rows matched)</span>
              </div>
            </div>

            {/* Bento Card 2 (Span 1) */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 group backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Globe2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Multi-Engine Support</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Native query translation and introspection engine for PostgreSQL, MySQL, Microsoft SQL Server, and SQLite.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 font-bold">PostgreSQL</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-bold">MySQL</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-rose-400 font-bold">SQL Server</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-bold">SQLite</span>
              </div>
            </div>

            {/* Bento Card 3 (Span 1) */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 group backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">AES-256 Credentials</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Credentials are encrypted at rest. Cloud connections are preserved persistently while ephemeral tunnels auto-clean upon disconnection.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Zero Socket Credentials Leak</span>
              </div>
            </div>

            {/* Bento Card 4 (Span 2) */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 group backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Local Database Management Suite</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                  Scan installed database server instances locally. Create new databases, rename existing ones, or drop databases with instant validation directly through the Visio Desktop agent.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Auto DB Scan
                </span>
                <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Create DB
                </span>
                <span className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> Drop DB
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Conversion Section ── */}
        {!user && !isLoading && (
          <section className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto w-full">
            <div className="p-10 sm:p-12 rounded-3xl border border-sky-500/30 bg-gradient-to-b from-slate-900/90 to-[#020408] text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Connect your database in seconds
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Experience fast relation browsing and local database tunneling. Free to start.
                </p>
              </div>

              <div className="flex justify-center">
                <Link href="/signup">
                  <Button className="h-11 px-8 text-sm font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 border-0 gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition-all">
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Technical Footer ── */}
        <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 bg-[#020306]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="font-bold text-slate-300 font-sans">visio-db</span>
              <span>© {new Date().getFullYear()}</span>
            </div>

            <div className="flex items-center gap-4 font-sans text-xs">
              <Link href="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-slate-300 transition-colors">Register</Link>
              <Link href="/dashboard" className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 font-semibold">
                Dashboard <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}