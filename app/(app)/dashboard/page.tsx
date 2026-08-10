'use client'

import { useEffect, useState } from 'react'
import { useAuth }             from '@/lib/auth-context'
import { Users, Database, Activity, AlertTriangle, Sparkles, ArrowUpRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'

interface MetricPoint {
  time:               string
  queries:            number
  activeConnections:  number
  failedQueries:      number
}

interface StatCardProps {
  icon:        React.ReactNode
  label:       string
  value:       string | number
  sub?:        string
  iconBg:      string
  iconColor:   string
  valueColor?: string
}

function StatCard({ icon, label, value, sub, iconBg, iconColor, valueColor }: StatCardProps) {
  return (
    <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-5 flex items-start gap-4 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
      <div className={`${iconBg} p-3 rounded-xl shrink-0 border border-white/5`}>
        <div className={`${iconColor} w-5 h-5`}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 tracking-tight ${valueColor ?? 'text-foreground'}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [metrics, setMetrics] = useState<MetricPoint[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => [
        ...prev,
        {
          time:              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          queries:           Math.floor(Math.random() * 80 + 20),
          activeConnections: Math.floor(Math.random() * 6 + 2),
          failedQueries:     Math.floor(Math.random() * 3),
        },
      ].slice(-20))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const [teamCount]     = useState(8)
  const [dbConnections] = useState(3)
  const [lastRequest]   = useState({
    user:   'admin@visio.dev',
    action: 'SELECT on users table',
    time:   'Just now',
  })
  const [errorStats]    = useState({ failed: 4, total: 420 })

  const errorRate      = ((errorStats.failed / errorStats.total) * 100).toFixed(1)
  const errorRateNum   = parseFloat(errorRate)
  const errorRateColor = errorRateNum < 5 ? 'text-emerald-400' : errorRateNum < 15 ? 'text-amber-400' : 'text-rose-400'
  const errorIconBg    = errorRateNum < 5 ? 'bg-emerald-500/10' : errorRateNum < 15 ? 'bg-amber-500/10' : 'bg-rose-500/10'
  const errorIconColor = errorRateNum < 5 ? 'text-emerald-400' : errorRateNum < 15 ? 'text-amber-400' : 'text-rose-400'

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Hydrating session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900/80 to-indigo-950/60 border border-sky-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Visio Live System
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">{user?.name || 'Explorer'}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Monitor active database tunnels, schema relations, and query metrics in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Users"
          value={teamCount}
          sub="Collaborating now"
          iconBg="bg-sky-500/10"
          iconColor="text-sky-400"
        />
        <StatCard
          icon={<Database className="w-5 h-5" />}
          label="Database Tunnels"
          value={dbConnections}
          sub="Active & healthy"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Last Query"
          value={lastRequest.time}
          sub={`${lastRequest.user} · ${lastRequest.action}`}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-400"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Query Failure Rate"
          value={`${errorRate}%`}
          sub={`${errorStats.failed} failed / ${errorStats.total} queries`}
          iconBg={errorIconBg}
          iconColor={errorIconColor}
          valueColor={errorRateColor}
        />
      </div>

      {/* Realtime Chart */}
      <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Real-Time Query Throughput
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Live query performance streamed from tunnel agent</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live
          </span>
        </div>
        <div className="h-[280px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" name="Queries / sec" dataKey="queries" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              <Line type="monotone" name="Active Tunnels" dataKey="activeConnections" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Failed Queries" dataKey="failedQueries" stroke="#fb7185" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}