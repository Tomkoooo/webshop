import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { adminTableWrap } from "@wse/core/lib/admin-ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wse/core/components/ui/table"

export type AdminDataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

type AdminDataTableProps<T> = {
  columns: AdminDataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
  className?: string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
}

export function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "Nincs megjeleníthető adat.",
  className,
  onRowClick,
  rowClassName,
}: AdminDataTableProps<T>) {
  return (
    <div className={cn(adminTableWrap, className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
