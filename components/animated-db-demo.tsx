'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Table2, Link2, Key, ChevronRight, ArrowLeft } from 'lucide-react'

/* ─── Demo data ─────────────────────────────────────────────────────────────── */

const USERS = [
  { id: 'usr_1a2b', name: 'Alice Chen',    email: 'alice@acme.io',    role: 'admin',  created: 'Jan 12' },
  { id: 'usr_3c4d', name: 'Bob Martinez',  email: 'bob@acme.io',      role: 'member', created: 'Jan 14' },
  { id: 'usr_5e6f', name: 'Carol Zhang',   email: 'carol@acme.io',    role: 'member', created: 'Feb 01' },
  { id: 'usr_7g8h', name: 'Dan Okafor',    email: 'dan@acme.io',      role: 'member', created: 'Feb 08' },
]

const POSTS: Record<string, { id: string; title: string; status: string; views: string }[]> = {
  usr_1a2b: [
    { id: 'pst_a1b2', title: 'Getting started with Postgres', status: 'published', views: '2.4k' },
    { id: 'pst_c3d4', title: 'Query optimization tricks',     status: 'published', views: '1.1k' },
    { id: 'pst_e5f6', title: 'Draft: Advanced indexing',      status: 'draft',     views: '—'    },
  ],
  usr_3c4d: [
    { id: 'pst_g7h8', title: 'Building a REST API',           status: 'published', views: '892'  },
    { id: 'pst_i9j0', title: 'TypeScript best practices',     status: 'published', views: '3.2k' },
  ],
  usr_5e6f: [
    { id: 'pst_k1l2', title: 'React Server Components guide', status: 'published', views: '5.7k' },
  ],
  usr_7g8h: [
    { id: 'pst_m3n4', title: 'Database migrations explained', status: 'draft',     views: '—'    },
  ],
}

const TABLES = ['users', 'posts', 'sessions', 'comments', 'api_keys']

type Step =
  | { type: 'users' }
  | { type: 'traversing'; userId: string; userName: string }
  | { type: 'posts'; userId: string; userName: string }

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function AnimatedDbDemo() {
  const [step, setStep]             = useState<Step>({ type: 'users' })
  const [highlightRow, setHighlight] = useState<string | null>(null)
  const [fadeIn, setFadeIn]          = useState(false)
  const [pulse, setPulse]            = useState<string | null>(null)
  const [autoPlay, setAutoPlay]      = useState(true)

  /* Fade-in on mount */
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100)
    return () => clearTimeout(t)
  }, [])

  /* Auto-play: cycle through a demo traverse */
  useEffect(() => {
    if (!autoPlay) return

    const sequence = async () => {
      // Highlight first user
      await delay(1800)
      setHighlight('usr_1a2b')
      setPulse('usr_1a2b')
      await delay(700)
      setPulse(null)

      // Traverse
      await delay(900)
      setStep({ type: 'traversing', userId: 'usr_1a2b', userName: 'Alice Chen' })
      await delay(700)
      setStep({ type: 'posts', userId: 'usr_1a2b', userName: 'Alice Chen' })
      setHighlight(null)

      // Wait, then go back
      await delay(3000)
      setStep({ type: 'users' })

      // Highlight second user
      await delay(1200)
      setHighlight('usr_3c4d')
      setPulse('usr_3c4d')
      await delay(700)
      setPulse(null)

      await delay(900)
      setStep({ type: 'traversing', userId: 'usr_3c4d', userName: 'Bob Martinez' })
      await delay(700)
      setStep({ type: 'posts', userId: 'usr_3c4d', userName: 'Bob Martinez' })
      setHighlight(null)

      await delay(3000)
      setStep({ type: 'users' })
      setHighlight(null)
    }

    const interval = setInterval(sequence, 14000)
    sequence()
    return () => clearInterval(interval)
  }, [autoPlay]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTraverse = useCallback((userId: string, userName: string) => {
    setAutoPlay(false)
    setHighlight(userId)
    setTimeout(() => {
      setStep({ type: 'traversing', userId, userName })
      setTimeout(() => {
        setStep({ type: 'posts', userId, userName })
        setHighlight(null)
      }, 500)
    }, 300)
  }, [])

  const handleBack = useCallback(() => {
    setAutoPlay(false)
    setStep({ type: 'users' })
    setHighlight(null)
  }, [])

  const isTraversing = step.type === 'traversing'
  const isPosts      = step.type === 'posts'
  const activeUser   = isPosts || isTraversing
    ? USERS.find(u => u.id === (step as any).userId)
    : null

  return (
    <div
      className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
      style={{
        opacity:    fadeIn ? 1 : 0,
        transform:  fadeIn ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        border:     '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Window chrome ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/30 ml-2">
          <Database className="w-3 h-3" />
          <span>acme-production</span>
          <ChevronRight className="w-3 h-3 text-white/15" />
          <span
            className={`transition-colors duration-300 ${
              step.type === 'users' ? 'text-white/60' : 'text-white/30 cursor-pointer hover:text-white/50'
            }`}
            onClick={step.type !== 'users' ? handleBack : undefined}
          >
            users
          </span>
          {(isPosts || isTraversing) && (
            <>
              <ChevronRight className="w-3 h-3 text-white/15" />
              <span
                className="text-blue-400/80"
                style={{
                  opacity:    isTraversing ? 0.4 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                posts
              </span>
            </>
          )}
        </div>

        <div className="ml-auto text-[10px] text-white/15 flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"
            style={{ animation: 'pulse 2s infinite' }}
          />
          connected
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-[280px]">

        {/* Sidebar */}
        <div
          className="w-40 shrink-0 border-r p-2 hidden sm:flex flex-col gap-0.5"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-[9px] uppercase tracking-widest text-white/15 font-semibold px-2 py-1">
            Tables
          </p>
          {TABLES.map((t, i) => {
            const isActive =
              (t === 'users' && step.type === 'users') ||
              (t === 'posts' && (isPosts || isTraversing))
            return (
              <div
                key={t}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                  color:      isActive ? 'rgba(96,165,250,0.9)' : 'rgba(255,255,255,0.2)',
                  transform:  isActive ? 'translateX(2px)' : 'translateX(0)',
                }}
              >
                <Table2 className="w-3 h-3 shrink-0" />
                {t}
                {isActive && (
                  <div
                    className="ml-auto w-1 h-1 rounded-full bg-blue-400"
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Table header */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}
          >
            {isPosts && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-blue-400/60 hover:text-blue-400 transition-colors mr-1"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}
            {isPosts ? (
              <>
                <span className="text-blue-400/70">posts</span>
                <span className="text-white/10 mx-1">·</span>
                <span className="text-white/25 normal-case font-normal tracking-normal">
                  where user_id = <span className="text-blue-400/60 font-mono">{activeUser?.id}</span>
                </span>
                <div className="ml-auto text-white/20 normal-case font-normal tracking-normal">
                  {POSTS[(step as any).userId]?.length ?? 0} rows
                </div>
              </>
            ) : (
              <>
                <span>users</span>
                <div className="ml-auto text-white/20 normal-case font-normal tracking-normal">
                  {USERS.length} rows
                </div>
              </>
            )}
          </div>

          {/* Column headers */}
          <div
            className="grid px-4 py-2 border-b text-[9px] uppercase tracking-widest"
            style={{
              borderColor:        'rgba(255,255,255,0.04)',
              color:              'rgba(255,255,255,0.2)',
              gridTemplateColumns: isPosts ? '1fr 2fr 1fr 1fr' : '1fr 1.5fr 1fr 1fr',
            }}
          >
            {isPosts ? (
              <>
                <span className="flex items-center gap-1"><Key className="w-2.5 h-2.5 text-yellow-400/50" />id</span>
                <span>title</span>
                <span>status</span>
                <span>views</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1"><Key className="w-2.5 h-2.5 text-yellow-400/50" />id</span>
                <span>name</span>
                <span>role</span>
                <span className="flex items-center gap-1 text-blue-400/40">
                  <Link2 className="w-2.5 h-2.5" />relations
                </span>
              </>
            )}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-hidden relative">

            {/* Traversal flash overlay */}
            {isTraversing && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{
                  background: 'rgba(59,130,246,0.04)',
                  animation:  'fadeIn 0.2s ease',
                }}
              >
                <div className="flex items-center gap-2 text-xs text-blue-400/60">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-blue-400/40 border-t-blue-400"
                    style={{ animation: 'spin 0.6s linear infinite' }}
                  />
                  Traversing relation…
                </div>
              </div>
            )}

            {isPosts ? (
              /* Posts rows */
              <div
                style={{
                  opacity:    isTraversing ? 0 : 1,
                  transform:  isTraversing ? 'translateX(8px)' : 'translateX(0)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                }}
              >
                {(POSTS[(step as any).userId] ?? []).map((post, i) => (
                  <div
                    key={post.id}
                    className="grid px-4 py-2.5 border-b text-[11px]"
                    style={{
                      borderColor:        'rgba(255,255,255,0.03)',
                      gridTemplateColumns: '1fr 2fr 1fr 1fr',
                      opacity:             1,
                      transform:           'translateX(0)',
                      animation:           `slideInRight 0.25s ease ${i * 0.06}s both`,
                    }}
                  >
                    <span className="font-mono text-[10px] text-white/30">{post.id}</span>
                    <span className="text-white/60 truncate pr-2">{post.title}</span>
                    <span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px]"
                        style={{
                          background: post.status === 'published' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                          color:      post.status === 'published' ? 'rgba(52,211,153,0.8)' : 'rgba(255,255,255,0.3)',
                          border:     post.status === 'published' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {post.status}
                      </span>
                    </span>
                    <span className="text-white/30 tabular-nums">{post.views}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Users rows */
              USERS.map((user, i) => {
                const isHighlighted = highlightRow === user.id
                const isPulsing     = pulse === user.id
                return (
                  <div
                    key={user.id}
                    className="grid px-4 py-2.5 border-b text-[11px] transition-all duration-200 cursor-pointer group"
                    style={{
                      borderColor:        'rgba(255,255,255,0.03)',
                      gridTemplateColumns: '1fr 1.5fr 1fr 1fr',
                      background:          isHighlighted
                        ? 'rgba(59,130,246,0.06)'
                        : 'transparent',
                      transform: isPulsing ? 'scale(1.005)' : 'scale(1)',
                    }}
                    onClick={() => handleTraverse(user.id, user.name)}
                  >
                    <span className="font-mono text-[10px] text-white/30">{user.id}</span>
                    <span
                      className="font-medium truncate pr-2 transition-colors duration-200"
                      style={{ color: isHighlighted ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)' }}
                    >
                      {user.name}
                    </span>
                    <span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px]"
                        style={{
                          background: user.role === 'admin' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                          color:      user.role === 'admin' ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.25)',
                          border:     user.role === 'admin' ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {user.role}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 transition-all duration-200"
                        style={{
                          background: isHighlighted ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.06)',
                          color:      isHighlighted ? 'rgba(96,165,250,1)'    : 'rgba(96,165,250,0.5)',
                          border:     isHighlighted ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.12)',
                          transform:  isHighlighted ? 'translateX(2px)' : 'translateX(0)',
                        }}
                      >
                        <Link2 className="w-2 h-2" />
                        posts
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex items-center gap-4 px-4 py-2 border-t text-[10px]"
        style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}
      >
        <span className="flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          acme-production
        </span>
        <span style={{ color: 'rgba(255,255,255,0.08)' }}>·</span>
        <span
          className="transition-colors duration-300"
          style={{ color: isPosts ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.2)' }}
        >
          {isPosts ? 'posts' : 'users'} table
        </span>
        {isPosts && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.08)' }}>·</span>
            <span style={{ color: 'rgba(52,211,153,0.5)' }}>
              {POSTS[(step as any).userId]?.length} rows matched
            </span>
          </>
        )}
        <span className="ml-auto opacity-50">
          {autoPlay ? 'click a row to interact' : 'interactive mode'}
        </span>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}