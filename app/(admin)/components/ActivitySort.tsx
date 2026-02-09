'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortColumn = 'nom' | 'description' | 'junior'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function ActivitySortControls({ 
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
          onClick={() => onSort('nom')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Activity Name
          {renderSortIcon('nom')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('description')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Description
          {renderSortIcon('description')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('junior')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Junior Enterprise
          {renderSortIcon('junior')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortActivity<T extends { nom: string; description: string; junior: { name: string } }>(data: T[]) {
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
        case 'nom':
          aVal = a.nom.toLowerCase()
          bVal = b.nom.toLowerCase()
          break
        case 'description':
          aVal = a.description.toLowerCase()
          bVal = b.description.toLowerCase()
          break
        case 'junior':
          aVal = a.junior.name.toLowerCase()
          bVal = b.junior.name.toLowerCase()
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

import * as React from 'react'
