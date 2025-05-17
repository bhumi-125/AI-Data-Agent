"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface DataTableProps {
  data: {
    columns: string[]
    rows: any[]
  }
}

export function DataTable({ data }: DataTableProps) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  if (!data || !data.columns || !data.rows) {
    return null
  }

  const totalPages = Math.ceil(data.rows.length / rowsPerPage)
  const paginatedRows = data.rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  // Function to export data as CSV
  const exportToCsv = () => {
    try {
      // Create CSV header
      const header = data.columns.join(",")

      // Create CSV rows
      const csvRows = data.rows.map((row) => {
        return data.columns
          .map((col) => {
            // Handle values that might contain commas or quotes
            const value = row[col]
            if (value === null || value === undefined) return ""
            const stringValue = String(value)
            // Escape quotes and wrap in quotes if contains comma or quote
            if (stringValue.includes(",") || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(",")
      })

      // Combine header and rows
      const csvContent = [header, ...csvRows].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", "data_export.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `Exported ${data.rows.length} rows to CSV`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "Failed to export data to CSV",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((column, i) => (
                <TableHead key={i}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, i) => (
              <TableRow key={i}>
                {data.columns.map((column, j) => (
                  <TableCell key={j}>{row[column]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <select
            className="border rounded p-1 text-sm"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setPage(0) // Reset to first page when changing rows per page
            }}
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>

          <Button variant="outline" size="sm" onClick={exportToCsv} title="Export to CSV">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  )
}
