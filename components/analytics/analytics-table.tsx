'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpDown, Search } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  sortable?: boolean
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  emptyLabel?: string
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyLabel = 'No data in this period',
  searchable = false,
  searchPlaceholder = 'Search',
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      columns.some((column) => String(column.render(row)).toLowerCase().includes(query)),
    )
  }, [rows, columns, search])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const column = columns.find((candidate) => candidate.key === sortKey)
    if (!column) return filtered

    const valueOf = column.sortValue ?? ((row: T) => String(column.render(row)))
    return [...filtered].sort((a, b) => {
      const left = valueOf(a)
      const right = valueOf(b)
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDir === 'asc' ? left - right : right - left
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left))
    })
  }, [filtered, columns, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
    setPage(1)
  }

  return (
    <div>
      {searchable && (
        <div className="relative w-full sm:w-72 mb-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
          />
        </div>
      )}

      <div className="bg-canvas border border-hairline overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-lg py-md text-caption text-charcoal font-600 whitespace-nowrap',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 text-inherit font-inherit"
                    >
                      {column.header}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-lg py-xxl text-center text-body-sm text-mute">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={rowKey(row)} className="border-b border-hairline hover:bg-surface-soft/50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-lg py-md text-body-sm text-ink whitespace-nowrap',
                        column.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mt-lg">
        <span className="text-caption text-mute">
          {sorted.length.toLocaleString()} row{sorted.length === 1 ? '' : 's'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="h-9 px-3 bg-canvas border border-hairline-strong text-body-sm text-ink rounded-[2px] hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-body-sm text-mute px-2">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
              className="h-9 px-3 bg-canvas border border-hairline-strong text-body-sm text-ink rounded-[2px] hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function formatTimestamp(value: string | Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function formatPercent(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 10) / 10}%`
}