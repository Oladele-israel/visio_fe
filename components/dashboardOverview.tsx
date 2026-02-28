"use client"

import { dashboardStats, activeConnections, activityLogs } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Timer, AlertTriangle } from "lucide-react"

export function DashboardOverview() {
  return (
    <div className="p-6 space-y-8">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tables"
          value={dashboardStats.totalTables}
          icon={<Database className="w-5 h-5" />}
        />

        <StatCard
          title="Total Rows"
          value={dashboardStats.totalRows.toLocaleString()}
          icon={<Database className="w-5 h-5" />}
        />

        <StatCard
          title="Queries / Min"
          value={dashboardStats.queriesLastMinute}
          icon={<Activity className="w-5 h-5" />}
        />

        <StatCard
          title="Active Connections"
          value={dashboardStats.activeConnections}
          icon={<Timer className="w-5 h-5" />}
        />
      </div>

      {/* Activity Logs */}
      <div className="grid md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLogs.map(log => (
              <div
                key={log.id}
                className="flex justify-between text-sm border-b pb-2"
              >
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.table}</p>
                </div>
                <Badge variant="outline">{log.time}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeConnections.map(conn => (
              <div
                key={conn.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="text-sm font-medium">{conn.user}</p>
                  <p className="text-xs text-muted-foreground">
                    {conn.ip}
                  </p>
                </div>

                <Badge
                  variant={conn.status === "active" ? "default" : "secondary"}
                >
                  {conn.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        <div className="text-primary">{icon}</div>
      </CardContent>
    </Card>
  )
}