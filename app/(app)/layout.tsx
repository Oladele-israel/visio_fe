'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ table: string; id?: number }>>([])
  const [filters, setFilters] = useState<Record<string, any>>({})

  const handleSelectTable = (table: string) => {
    setSelectedTable(table)
    setBreadcrumb([{ table }])
    setFilters({})
  }

  const handleNavigate = (newBreadcrumb: Array<{ table: string; id?: number }>) => {
    if (newBreadcrumb.length === 0) {
      setSelectedTable(null)
      setBreadcrumb([])
      setFilters({})
    } else {
      const last = newBreadcrumb[newBreadcrumb.length - 1]
      setSelectedTable(last.table)
      setBreadcrumb(newBreadcrumb)
      setFilters({})
    }
  }

  return (
    <DashboardLayout
      selectedTable={selectedTable}
      onSelectTable={handleSelectTable}
      breadcrumb={breadcrumb}
      onNavigate={handleNavigate}
    >
      {children}
    </DashboardLayout>
  )
}