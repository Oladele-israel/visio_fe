// 'use client'

// import Link                from 'next/link'
// import { Button }          from '@/components/ui/button'
// import { useAuth }         from '@/lib/auth-context'
// import {
//   Database, Zap, Eye, ArrowRight,
//   ChevronRight, Shield, LogOut,
//   Table2, Link2, Search,
// } from 'lucide-react'

// export function LandingPage() {
//   const { user, isLoading, logout } = useAuth()

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-x-hidden">

//       {/* ── Subtle grid background ── */}
//       <div
//         className="fixed inset-0 pointer-events-none"
//         style={{
//           backgroundImage: `
//             linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
//           `,
//           backgroundSize: '64px 64px',
//         }}
//       />

//       {/* ── Glow orb ── */}
//       <div
//         className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
//         style={{
//           background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
//         }}
//       />

//       {/* ── Nav ── */}
//       <header className="relative z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
//         <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

//           {/* Logo */}
//           <div className="flex items-center gap-2.5">
//             <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
//               <Database className="w-3.5 h-3.5 text-white" />
//             </div>
//             <span className="text-sm font-semibold tracking-tight text-white">DBViz</span>
//           </div>

//           {/* Nav right */}
//           <nav className="flex items-center gap-1">
//             {isLoading ? (
//               <div className="w-32 h-8 rounded-lg bg-white/5 animate-pulse" />
//             ) : user ? (
//               /* ── Authenticated nav ── */
//               <div className="flex items-center gap-2">
//                 <span className="text-xs text-white/40 hidden sm:block">
//                   {user.email}
//                 </span>
//                 <Link href="/dashboard">
//                   <Button
//                     size="sm"
//                     className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-1.5 shadow-lg shadow-blue-600/20"
//                   >
//                     Dashboard
//                     <ArrowRight className="w-3.5 h-3.5" />
//                   </Button>
//                 </Link>
//                 <button
//                   onClick={() => logout()}
//                   className="h-8 px-3 text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 rounded-lg hover:bg-white/5"
//                 >
//                   <LogOut className="w-3.5 h-3.5" />
//                   <span className="hidden sm:inline">Sign out</span>
//                 </button>
//               </div>
//             ) : (
//               /* ── Unauthenticated nav ── */
//               <>
//                 <Link
//                   href="/login"
//                   className="px-4 py-1.5 text-sm text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
//                 >
//                   Sign in
//                 </Link>
//                 <Link href="/signup">
//                   <Button
//                     size="sm"
//                     className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/20"
//                   >
//                     Get started
//                   </Button>
//                 </Link>
//               </>
//             )}
//           </nav>
//         </div>
//       </header>

//       {/* ── Hero ── */}
//       <main className="relative flex-1 flex flex-col">
//         <section className="flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center">

//           {/* Badge */}
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-8 shadow-lg shadow-blue-500/5">
//             <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
//             Postgres database explorer
//           </div>

//           {/* Headline */}
//           <h1
//             className="text-5xl sm:text-7xl font-bold tracking-tight max-w-3xl leading-[1.05] mb-6"
//             style={{ fontFamily: '"DM Sans", system-ui, sans-serif', letterSpacing: '-0.03em' }}
//           >
//             Your database,{' '}
//             <span
//               className="text-transparent"
//               style={{
//                 backgroundClip: 'text',
//                 WebkitBackgroundClip: 'text',
//                 backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #818cf8 100%)',
//               }}
//             >
//               finally visible
//             </span>
//           </h1>

//           <p className="text-lg text-white/40 max-w-lg leading-relaxed mb-10">
//             Connect any Postgres database and explore your data visually.
//             Traverse foreign key relations with one click. No SQL required.
//           </p>

//           {/* CTA row */}
//           <div className="flex items-center gap-3">
//             {user ? (
//               <Link href="/dashboard">
//                 <Button
//                   className="h-11 px-7 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5"
//                 >
//                   Open dashboard
//                   <ArrowRight className="w-4 h-4" />
//                 </Button>
//               </Link>
//             ) : (
//               <>
//                 <Link href="/signup">
//                   <Button
//                     className="h-11 px-7 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5"
//                   >
//                     Start for free
//                     <ArrowRight className="w-4 h-4" />
//                   </Button>
//                 </Link>
//                 <Link href="/login">
//                   <Button
//                     variant="ghost"
//                     className="h-11 px-7 text-sm text-white/50 hover:text-white hover:bg-white/5 border border-white/8"
//                   >
//                     Sign in
//                   </Button>
//                 </Link>
//               </>
//             )}
//           </div>

//           {/* Social proof hint */}
//           <p className="mt-6 text-xs text-white/20">
//             No credit card required · Free to start
//           </p>
//         </section>

//         {/* ── Fake UI preview ── */}
//         <section className="px-6 pb-20 flex justify-center">
//           <div
//             className="w-full max-w-4xl rounded-xl border border-white/8 overflow-hidden shadow-2xl"
//             style={{ background: 'rgba(255,255,255,0.02)' }}
//           >
//             {/* Window chrome */}
//             <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.015]">
//               <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
//               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
//               <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
//               <div className="ml-3 flex items-center gap-1.5 text-[10px] text-white/20">
//                 <Database className="w-3 h-3" />
//                 <span>production-db · users</span>
//               </div>
//             </div>

//             {/* Fake table */}
//             <div className="flex">
//               {/* Sidebar */}
//               <div className="w-44 border-r border-white/5 p-3 space-y-0.5 shrink-0 hidden sm:block">
//                 <p className="text-[9px] uppercase tracking-widest text-white/20 font-semibold px-2 pb-1">Tables</p>
//                 {['users', 'sessions', 'posts', 'comments', 'api_keys'].map((t, i) => (
//                   <div
//                     key={t}
//                     className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
//                       i === 0 ? 'bg-blue-500/10 text-blue-400' : 'text-white/30 hover:text-white/60'
//                     }`}
//                   >
//                     <Table2 className="w-3 h-3 shrink-0" />
//                     {t}
//                   </div>
//                 ))}
//               </div>

//               {/* Table content */}
//               <div className="flex-1 overflow-hidden">
//                 {/* Toolbar */}
//                 <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
//                   <Search className="w-3 h-3 text-white/20" />
//                   <span className="text-xs text-white/20">Filter rows...</span>
//                   <div className="ml-auto text-[10px] text-white/20">1,247 rows</div>
//                 </div>

//                 {/* Headers */}
//                 <div className="grid text-[10px] font-semibold text-white/30 uppercase tracking-widest px-4 py-2 border-b border-white/5"
//                   style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr' }}>
//                   <span>id</span>
//                   <span>email</span>
//                   <span>created_at</span>
//                   <span className="flex items-center gap-1 text-blue-400/60">
//                     <Link2 className="w-2.5 h-2.5" /> relations
//                   </span>
//                 </div>

//                 {/* Rows */}
//                 {[
//                   ['usr_01', 'alice@example.com', '2024-01-12'],
//                   ['usr_02', 'bob@company.io', '2024-01-14'],
//                   ['usr_03', 'carol@dev.co', '2024-02-01'],
//                   ['usr_04', 'dan@startup.ai', '2024-02-08'],
//                 ].map(([id, email, date], i) => (
//                   <div
//                     key={id}
//                     className={`grid px-4 py-2.5 text-xs border-b border-white/[0.03] ${
//                       i === 1 ? 'bg-blue-500/5' : ''
//                     }`}
//                     style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr' }}
//                   >
//                     <span className="text-white/40 font-mono text-[10px]">{id}</span>
//                     <span className="text-white/60 truncate">{email}</span>
//                     <span className="text-white/30 text-[10px]">{date}</span>
//                     <div className="flex gap-1">
//                       <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
//                         ↳ posts
//                       </span>
//                       <span className="px-1.5 py-0.5 rounded text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20">
//                         ↳ api_keys
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ── Features ── */}
//         <section className="border-t border-white/5 px-6 py-20">
//           <div className="max-w-4xl mx-auto">
//             <p className="text-center text-xs uppercase tracking-widest text-white/20 font-semibold mb-12">
//               Everything you need
//             </p>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

//               <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-blue-500/20 transition-colors group">
//                 <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
//                   <Zap className="w-4 h-4 text-blue-400" />
//                 </div>
//                 <h3 className="text-sm font-semibold text-white">Instant traversal</h3>
//                 <p className="text-sm text-white/35 leading-relaxed">
//                   Click any FK value and jump to the related record. Full breadcrumb history so you never lose context.
//                 </p>
//               </div>

//               <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-violet-500/20 transition-colors group">
//                 <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
//                   <Eye className="w-4 h-4 text-violet-400" />
//                 </div>
//                 <h3 className="text-sm font-semibold text-white">Auto schema detection</h3>
//                 <p className="text-sm text-white/35 leading-relaxed">
//                   Tables, columns, types, PKs and foreign key relations are detected automatically on every connect.
//                 </p>
//               </div>

//               <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-emerald-500/20 transition-colors group">
//                 <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
//                   <Shield className="w-4 h-4 text-emerald-400" />
//                 </div>
//                 <h3 className="text-sm font-semibold text-white">Secure by default</h3>
//                 <p className="text-sm text-white/35 leading-relaxed">
//                   Credentials are AES-256 encrypted at rest. Each query opens a fresh connection — no persistent sockets.
//                 </p>
//               </div>

//             </div>
//           </div>
//         </section>

//         {/* ── CTA banner ── */}
//         {!user && !isLoading && (
//           <section className="px-6 pb-20">
//             <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03]">
//               <h2 className="text-2xl font-bold tracking-tight mb-3">
//                 Ready to explore your database?
//               </h2>
//               <p className="text-sm text-white/40 mb-8">
//                 Connect in under 30 seconds. No setup required.
//               </p>
//               <Link href="/signup">
//                 <Button className="h-10 px-8 bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-lg shadow-blue-600/20">
//                   Create free account
//                   <ArrowRight className="w-4 h-4" />
//                 </Button>
//               </Link>
//             </div>
//           </section>
//         )}

//         {/* ── Footer ── */}
//         <footer className="border-t border-white/5 py-6 px-6">
//           <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/20">
//             <div className="flex items-center gap-2">
//               <Database className="w-3.5 h-3.5" />
//               <span className="font-medium">DBViz</span>
//             </div>
//             <div className="flex items-center gap-1">
//               <span>Built for developers</span>
//               <ChevronRight className="w-3 h-3" />
//               {user ? (
//                 <Link href="/dashboard" className="text-blue-400/70 hover:text-blue-400 transition-colors">
//                   Go to dashboard
//                 </Link>
//               ) : (
//                 <Link href="/signup" className="text-blue-400/70 hover:text-blue-400 transition-colors">
//                   Get started free
//                 </Link>
//               )}
//             </div>
//           </div>
//         </footer>
//       </main>
//     </div>
//   )
// }


'use client'

import Link                   from 'next/link'
import { Button }             from '@/components/ui/button'
import { useAuth }            from '@/lib/auth-context'
import { AnimatedDbDemo } from './animated-db-demo'
import {
  Database, Zap, Eye, ArrowRight,
  ChevronRight, Shield, LogOut,
} from 'lucide-react'

export function LandingPage() {
  const { user, isLoading, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-x-hidden">

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow orb */}
      <div
        className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)' }}
      />

      {/* Nav */}
      <header className="relative z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">DBViz</span>
          </div>
          <nav className="flex items-center gap-1">
            {isLoading ? (
              <div className="w-32 h-8 rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30 hidden sm:block">{user.email}</span>
                <Link href="/dashboard">
                  <Button size="sm" className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-1.5 shadow-lg shadow-blue-600/20">
                    Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <button
                  onClick={() => logout()}
                  className="h-8 px-3 text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5 rounded-lg hover:bg-white/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-1.5 text-sm text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/20">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col">

        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Postgres database explorer
          </div>

          <h1
            className="text-5xl sm:text-7xl font-bold tracking-tight max-w-3xl leading-[1.05] mb-6"
            style={{ letterSpacing: '-0.03em' }}
          >
            Your database,{' '}
            <span
              className="text-transparent"
              style={{
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #818cf8 100%)',
              }}
            >
              finally visible
            </span>
          </h1>

          <p className="text-lg text-white/40 max-w-lg leading-relaxed mb-10">
            Connect any Postgres database and explore your data visually.
            Traverse foreign key relations with one click. No SQL required.
          </p>

          <div className="flex items-center gap-3 mb-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="h-11 px-7 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5">
                  Open dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button className="h-11 px-7 text-sm bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="h-11 px-7 text-sm text-white/50 hover:text-white hover:bg-white/5">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-white/15">No credit card required · Free to start</p>
        </section>

        {/* Animated demo */}
        <section className="px-6 pb-20 flex flex-col items-center gap-3">
          <p className="text-xs text-white/20 flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
            Live demo — click any row to traverse its relations
          </p>
          <AnimatedDbDemo />
        </section>

        {/* Features */}
        <section className="border-t border-white/5 px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs uppercase tracking-widest text-white/20 font-semibold mb-12">
              Everything you need
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-blue-500/20 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold">Instant traversal</h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  Click any FK value and jump to the related record. Full breadcrumb history so you never lose context.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-violet-500/20 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                  <Eye className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold">Auto schema detection</h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  Tables, columns, types, PKs and FK relations are introspected automatically on every connect.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-white/5 bg-white/[0.015] space-y-3 hover:border-emerald-500/20 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold">Secure by default</h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  Credentials are AES-256 encrypted at rest. Each query opens a fresh connection — no persistent sockets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA banner */}
        {!user && !isLoading && (
          <section className="px-6 pb-20">
            <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03]">
              <h2 className="text-2xl font-bold tracking-tight mb-3">Ready to explore your database?</h2>
              <p className="text-sm text-white/40 mb-8">Connect in under 30 seconds. No setup required.</p>
              <Link href="/signup">
                <Button className="h-10 px-8 bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2 shadow-lg shadow-blue-600/20">
                  Create free account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/20">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              <span className="font-medium">DBViz</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Built for developers</span>
              <ChevronRight className="w-3 h-3" />
              {user ? (
                <Link href="/dashboard" className="text-blue-400/70 hover:text-blue-400 transition-colors">Go to dashboard</Link>
              ) : (
                <Link href="/signup" className="text-blue-400/70 hover:text-blue-400 transition-colors">Get started free</Link>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}