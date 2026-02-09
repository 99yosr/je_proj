'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as React from 'react'

type SortColumn = 'name' | 'email' | 'role'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function UsersSortControls({ 
  currentSort, 
  currentDirection, 
  onSort 
}: SortControlsProps) {
  
  const renderSortIcon = (column: SortColumn) => {
    if (currentSort !== column) {
      return <ArrowUpDown className="inline-block ml-1 h-4 w-4 text-gray-500" />
    }
    
    if (currentDirection === 'asc') {
      return <ArrowUp className="inline-block ml-1 h-4 w-4 text-blue-400" />
    } else {
      return <ArrowDown className="inline-block ml-1 h-4 w-4 text-blue-400" />
    }
  }

  return (
    <>
      <th className="table-header">
        <button 
          onClick={() => onSort('name')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Name
          {renderSortIcon('name')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('email')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Email
          {renderSortIcon('email')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('role')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Role
          {renderSortIcon('role')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortUsers<T extends { 
  name: string | null
  email: string
  role?: string
}>(data: T[]) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return data
    }

    return [...data].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortColumn) {
        case 'name':
          aVal = (a.name || '').toLowerCase()
          bVal = (b.name || '').toLowerCase()
          break
        case 'email':
          aVal = a.email.toLowerCase()
          bVal = b.email.toLowerCase()
          break
        case 'role':
          aVal = (a.role || 'USER').toLowerCase()
          bVal = (b.role || 'USER').toLowerCase()
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortColumn, sortDirection])

  return {
    sortedData,
    sortColumn,
    sortDirection,
    handleSort
  }
}
