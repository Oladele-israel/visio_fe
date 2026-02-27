'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { TableExplorer } from '@/components/table-explorer'
import { sampleDatabase } from '@/lib/mock-data'
import { useAuth } from '@/lib/auth-context'
import type { Table as TableType } from '@/lib/mock-data'

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

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

    // If we have a filter (relation traversal), filter rows
    if (filters.relationKey && filters.relationValue) {
      const filtered = {
        ...baseTable,
        rows: baseTable.rows.filter(row => row[filters.relationKey] === filters.relationValue),
      }
      return filtered
    }

    return baseTable
  }, [selectedTable, filters])

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

  if (!user) {
    return null
  }

  return (
    <DashboardLayout
      selectedTable={selectedTable}
      onSelectTable={handleSelectTable}
      breadcrumb={breadcrumb}
      onNavigate={(newBreadcrumb: Array<{ table: string; id?: number }>) => {
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
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Welcome to DBViz</h2>
            <p className="text-muted-foreground">Select a table from the sidebar to start exploring</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
