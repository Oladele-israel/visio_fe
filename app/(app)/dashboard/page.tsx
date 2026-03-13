'use client'

import { useEffect, useState } from 'react'
import { useAuth }             from '@/lib/auth-context'
import { Users, Database, Activity, AlertTriangle } from 'lucide-react'
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
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`${iconBg} p-3 rounded-lg shrink-0`}>
        <div className={`${iconColor} w-5 h-5`}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium truncate">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${valueColor ?? 'text-foreground'}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // No redirect logic here — middleware handles that.
  // We just wait for isPending to settle before rendering.
  const { user, isLoading } = useAuth()

  // ── Realtime metrics ─────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<MetricPoint[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => [
        ...prev,
        {
          time:              new Date().toLocaleTimeString(),
          queries:           Math.floor(Math.random() * 100),
          activeConnections: Math.floor(Math.random() * 10),
          failedQueries:     Math.floor(Math.random() * 5),
        },
      ].slice(-20))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // ── Mock stats ────────────────────────────────────────────────────────────
  const [teamCount]    = useState(8)
  const [dbConnections] = useState(3)
  const [lastRequest]  = useState({
    user:   'alice@example.com',
    action: 'SELECT on users table',
    time:   '2 minutes ago',
  })
  const [errorStats] = useState({ failed: 12, total: 374 })

  const errorRate      = ((errorStats.failed / errorStats.total) * 100).toFixed(1)
  const errorRateNum   = parseFloat(errorRate)
  const errorRateColor = errorRateNum < 5 ? 'text-emerald-500' : errorRateNum < 15 ? 'text-yellow-500' : 'text-red-500'
  const errorIconBg    = errorRateNum < 5 ? 'bg-emerald-500/10' : errorRateNum < 15 ? 'bg-yellow-500/10' : 'bg-red-500/10'
  const errorIconColor = errorRateNum < 5 ? 'text-emerald-500' : errorRateNum < 15 ? 'text-yellow-500' : 'text-red-500'

  // ── Loading state — wait for session to hydrate ───────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Team Members"
          value={teamCount}
          sub="Active on this project"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Database className="w-5 h-5" />}
          label="Database Connections"
          value={dbConnections}
          sub="Live connections"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Last Request"
          value={lastRequest.time}
          sub={`${lastRequest.user} — ${lastRequest.action}`}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Query Error Rate"
          value={`${errorRate}%`}
          sub={`${errorStats.failed} failed / ${errorStats.total} total · last 24h`}
          iconBg={errorIconBg}
          iconColor={errorIconColor}
          valueColor={errorRateColor}
        />
      </div>

      {/* Realtime Chart */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">
          Real-Time Database Activity
        </h2>
        <div className="h-[280px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="queries"           stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="activeConnections" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failedQueries"     stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}