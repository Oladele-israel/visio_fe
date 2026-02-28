'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { TableExplorer } from '@/components/table-explorer'
import { sampleDatabase } from '@/lib/mock-data'
import { useAuth } from '@/lib/auth-context'
import type { Table as TableType } from '@/lib/mock-data'
import { DashboardOverview } from '@/components/dashboardOverview'

/* 🔥 Recharts Imports */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface MetricPoint {
  time: string
  queries: number
  activeConnections: number
  failedQueries: number
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  /* ===============================
     🔥 REALTIME METRICS STATE
  ================================*/

  const [metrics, setMetrics] = useState<MetricPoint[]>([])

  useEffect(() => {
    // Simulate live metric streaming
    const interval = setInterval(() => {
      const newMetric: MetricPoint = {
        time: new Date().toLocaleTimeString(),
        queries: Math.floor(Math.random() * 100),
        activeConnections: Math.floor(Math.random() * 10),
        failedQueries: Math.floor(Math.random() * 5),
      }

      setMetrics(prev => {
        const updated = [...prev, newMetric]
        // Keep only last 20 points
        return updated.slice(-20)
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  /* ===============================
     🔐 AUTH REDIRECT
  ================================*/

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ table: string; id?: number }>>([])
  const [filters, setFilters] = useState<Record<string, any>>({})

  const currentTable = useMemo(() => {
    if (!selectedTable) return null

    const baseTable = sampleDatabase[selectedTable as keyof typeof sampleDatabase]
    if (!baseTable) return null

    if (filters.relationKey && filters.relationValue) {
      return {
        ...baseTable,
        rows: baseTable.rows.filter(
          row => row[filters.relationKey] === filters.relationValue
        ),
      }
    }

    return baseTable
  }, [selectedTable, filters])

  /* ===============================
     TABLE HANDLERS
  ================================*/

  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName)
    setBreadcrumb([{ table: tableName }])
    setFilters({})
  }

  const handleTraverseRelation = (relationTable: string, foreignKeyValue: number) => {
    setSelectedTable(relationTable)
    setFilters({
      relationKey: 'id',
      relationValue: foreignKeyValue,
    })
    setBreadcrumb([...breadcrumb, { table: relationTable, id: foreignKeyValue }])
  }

  const handleBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1)
      setBreadcrumb(newBreadcrumb)
      const lastCrumb = newBreadcrumb[newBreadcrumb.length - 1]
      setSelectedTable(lastCrumb.table)
      setFilters({})
    }
  }

  /* ===============================
     AUTH LOADING
  ================================*/

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  /* ===============================
     DASHBOARD UI
  ================================*/

  return (
    <DashboardLayout
      selectedTable={selectedTable}
      onSelectTable={handleSelectTable}
      breadcrumb={breadcrumb}
      onNavigate={(newBreadcrumb) => {
        if (newBreadcrumb.length === 0) {
          setSelectedTable(null)
          setBreadcrumb([])
          setFilters({})
        } else {
          const lastCrumb = newBreadcrumb[newBreadcrumb.length - 1]
          setSelectedTable(lastCrumb.table)
          setBreadcrumb(newBreadcrumb)
          setFilters({})
        }
      }}
    >
      {/* ===============================
          🔥 IF TABLE SELECTED
      ================================*/}

      {selectedTable && currentTable ? (
        <TableExplorer
          table={currentTable}
          tableName={selectedTable}
          onBack={handleBack}
          breadcrumb={breadcrumb}
          onBreadcrumbClick={(index: number) => {
            const newBreadcrumb = breadcrumb.slice(0, index + 1)
            setBreadcrumb(newBreadcrumb)
            setSelectedTable(newBreadcrumb[newBreadcrumb.length - 1].table)
            setFilters({})
          }}
          onTraverseRelation={handleTraverseRelation}
        />
      ) : (
        /* ===============================
           🚀 DASHBOARD OVERVIEW + CHARTS
        ================================*/

        <div className="p-6 space-y-8">

          <DashboardOverview />

          {/* 🔥 REALTIME CHART */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Real-Time Database Activity
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
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
          </div>

        </div>
      )}
    </DashboardLayout>
  )
}