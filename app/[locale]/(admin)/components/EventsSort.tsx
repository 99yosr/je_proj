'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as React from 'react'

type SortColumn = 'title' | 'slug' | 'junior' | 'createdBy' | 'updatedAt' | 'isActive'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function EventsSortControls({ 
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
          onClick={() => onSort('title')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Title
          {renderSortIcon('title')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('slug')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Slug
          {renderSortIcon('slug')}
        </button>
      </th>
      <th className="table-header">Media</th>
      <th className="table-header">
        <button 
          onClick={() => onSort('junior')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Junior
          {renderSortIcon('junior')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('createdBy')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Created By
          {renderSortIcon('createdBy')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('updatedAt')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Last Updated
          {renderSortIcon('updatedAt')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('isActive')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Status
          {renderSortIcon('isActive')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortEvents<T extends { 
  title: string
  slug: string
  isActive: boolean
  updatedAt: string
  junior?: { name: string }
  createdBy?: { name?: string; email?: string }
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
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'slug':
          aVal = a.slug.toLowerCase()
          bVal = b.slug.toLowerCase()
          break
        case 'junior':
          aVal = (a.junior?.name || '').toLowerCase()
          bVal = (b.junior?.name || '').toLowerCase()
          break
        case 'createdBy':
          aVal = (a.createdBy?.name || a.createdBy?.email || '').toLowerCase()
          bVal = (b.createdBy?.name || b.createdBy?.email || '').toLowerCase()
          break
        case 'updatedAt':
          aVal = new Date(a.updatedAt).getTime()
          bVal = new Date(b.updatedAt).getTime()
          break
        case 'isActive':
          aVal = a.isActive ? 1 : 0
          bVal = b.isActive ? 1 : 0
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

