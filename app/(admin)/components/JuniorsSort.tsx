'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as React from 'react'

type SortColumn = 'name' | 'role' | 'city' | 'contact_email' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function JuniorsSortControls({ 
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
          onClick={() => onSort('role')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Role
          {renderSortIcon('role')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('city')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          City
          {renderSortIcon('city')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('contact_email')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Contact
          {renderSortIcon('contact_email')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('created_at')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Date Added
          {renderSortIcon('created_at')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortJuniors<T extends { 
  name: string
  role: string
  city: string
  contact_email: string | null
  created_at: string 
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
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'role':
          aVal = a.role.toLowerCase()
          bVal = b.role.toLowerCase()
          break
        case 'city':
          aVal = a.city.toLowerCase()
          bVal = b.city.toLowerCase()
          break
        case 'contact_email':
          aVal = (a.contact_email || '').toLowerCase()
          bVal = (b.contact_email || '').toLowerCase()
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
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
