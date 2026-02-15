'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as React from 'react'

type SortColumn = 'title' | 'author' | 'createdAt'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function NewsSortControls({ 
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
          onClick={() => onSort('author')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Author
          {renderSortIcon('author')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('createdAt')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Date
          {renderSortIcon('createdAt')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortNews<T extends { 
  title: string
  author: string | null
  createdAt: string 
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
        case 'author':
          aVal = (a.author || '').toLowerCase()
          bVal = (b.author || '').toLowerCase()
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
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
