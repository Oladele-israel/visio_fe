"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { startMetricStream,subscribeToMetrics,MetricPoint } from "@/lib/mock-data"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function RealTimeMetricsChart() {
  const [data, setData] = useState<MetricPoint[]>([])

  useEffect(() => {
    // Start fake streaming
    startMetricStream()

    // Subscribe to stream
    const unsubscribe = subscribeToMetrics((newMetric) => {
      setData(prev => {
        const updated = [...prev, newMetric]

        // Keep last 20 points only
        return updated.slice(-20)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Real-Time Query Activity
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="queries"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="activeConnections"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="failedQueries"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}