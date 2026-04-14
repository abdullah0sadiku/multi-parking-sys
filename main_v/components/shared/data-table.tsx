"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  InboxIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  title: string
  description?: string
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: {
    key: string
    label: string
    options: { value: string; label: string }[]
    value?: string
    onChange?: (value: string) => void
  }[]
  onAdd?: () => void
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  addButtonLabel?: string
}

const SKELETON_ROWS = 6

export function DataTable<T extends { id: string | number }>({
  title,
  description,
  columns,
  data,
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  onAdd,
  onView,
  onEdit,
  onDelete,
  addButtonLabel = "Add New",
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("")
  const searchVal = searchValue ?? internalSearch

  const totalPages = total ? Math.ceil(total / pageSize) : 1
  const displayTotal = total ?? data.length
  const startRow = (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, displayTotal)

  const hasActions = !!(onView || onEdit || onDelete)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="pl-10 bg-secondary border-0"
            value={searchVal}
            onChange={(e) => {
              const v = e.target.value
              setInternalSearch(v)
              onSearchChange?.(v)
            }}
          />
        </div>
        {filters?.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    "font-semibold text-muted-foreground",
                    column.sortable && "cursor-pointer hover:text-foreground"
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading skeletons */}
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-8 rounded" />
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {/* Empty state */}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No records found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading &&
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item)
                        : String(
                            (item as Record<string, unknown>)[column.key as string] ?? ""
                          )}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : displayTotal === 0
              ? "No results"
              : `Showing ${startRow}–${endRow} of ${displayTotal} results`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
