'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Table as TableType } from '@/lib/mock-data'
import { ChevronDown, Link as LucideLink, Copy, ArrowUpRight } from 'lucide-react'
import { sampleDatabase } from '@/lib/mock-data'

interface TableExplorerProps {
  table: TableType
  tableName: string
  onBack: () => void
  breadcrumb: Array<{ table: string; id?: number }>
  onBreadcrumbClick: (index: number) => void
  onTraverseRelation?: (table: string, id: number) => void
}

export function TableExplorer({
  table,
  tableName,
  onBack,
  breadcrumb,
  onBreadcrumbClick,
  onTraverseRelation,
}: TableExplorerProps) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const rowsPerPage = 10

  // Filter rows based on search query
  const filteredRows = searchQuery.trim()
    ? table.rows.filter(row =>
        Object.values(row).some(
          val =>
            val &&
            String(val)
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      )
    : table.rows

  const startIdx = (currentPage - 1) * rowsPerPage
  const endIdx = startIdx + rowsPerPage
  const paginatedRows = filteredRows.slice(startIdx, endIdx)
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage)

  const handleCopyValue = (value: string | number | boolean) => {
    navigator.clipboard.writeText(String(value))
    setCopyFeedback('Copied!')
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  const selectedRowData = selectedRow !== null ? table.rows.find(r => r.id === selectedRow) : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground capitalize">{tableName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {startIdx + 1}–{Math.min(endIdx, filteredRows.length)} of {filteredRows.length} rows
              {searchQuery && ` (filtered from ${table.rows.length})`}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="h-9 max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                Filter <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Add Filter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                Columns <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {table.columns.map(col => (
                <DropdownMenuItem key={col.name}>{col.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              {table.columns.map(col => (
                <TableHead key={col.name} className="min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{col.name}</span>
                    <span className="text-xs text-muted-foreground">({col.type})</span>
                  </div>
                </TableHead>
              ))}
              {Object.keys(table.relations || {}).length > 0 && (
                <TableHead className="w-12 text-center">Relations</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow
                key={row.id}
                className="hover:bg-secondary/50 cursor-row group"
                onClick={() => {
                  setSelectedRow(row.id)
                  setShowDetail(true)
                }}
              >
                <TableCell className="font-medium text-xs">{row.id}</TableCell>
                {table.columns.map(col => (
                  <TableCell key={`${row.id}-${col.name}`} className="text-sm max-w-xs">
                    <div className="truncate group-hover:opacity-75 transition-opacity">
                      {String(row[col.name])}
                    </div>
                  </TableCell>
                ))}
                {Object.keys(table.relations || {}).length > 0 && (
                  <TableCell className="text-center">
                    <button className="opacity-50 hover:opacity-100 transition-opacity text-primary">
                      <LucideLink className="w-4 h-4" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Row Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Row {selectedRowData?.id} from {tableName}
            </DialogTitle>
          </DialogHeader>

          {selectedRowData && (
            <div className="space-y-6">
              {/* Column Details */}
              <div className="space-y-3">
                {table.columns.map(col => (
                  <div key={col.name} className="space-y-1 pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">{col.name}</label>
                      <span className="text-xs text-muted-foreground">({col.type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-secondary p-2 rounded text-sm text-foreground break-all">
                        {String(selectedRowData[col.name])}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyValue(selectedRowData[col.name])}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Relations Section */}
              {selectedRowData._relations && Object.keys(selectedRowData._relations).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Relations</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedRowData._relations).map(([relName, count]) => (
                      <button
                        key={relName}
                        onClick={() => {
                          if (onTraverseRelation) {
                            onTraverseRelation(relName, selectedRowData.id as number)
                            setShowDetail(false)
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 bg-secondary rounded hover:bg-secondary/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <LucideLink className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{relName}</p>
                            <p className="text-xs text-muted-foreground">{count} related records</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
