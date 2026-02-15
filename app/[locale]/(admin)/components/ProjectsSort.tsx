'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as React from 'react'

type SortColumn = 'titre' | 'junior' | 'statut' | 'dateDebut' | 'dateFin' | 'revenu'
type SortDirection = 'asc' | 'desc' | null

type SortControlsProps = {
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export default function ProjectsSortControls({ 
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
          onClick={() => onSort('titre')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Title
          {renderSortIcon('titre')}
        </button>
      </th>
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
          onClick={() => onSort('statut')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          Status
          {renderSortIcon('statut')}
        </button>
      </th>
      <th className="table-header">
        <button 
          onClick={() => onSort('dateFin')}
          className="flex items-center hover:text-blue-400 transition-colors"
        >
          End Date
          {renderSortIcon('dateFin')}
        </button>
      </th>
      <th className="table-header table-header-right">Actions</th>
    </>
  )
}

export function useSortProjects<T extends { 
  titre: string
  statut: string
  dateDebut: string | null
  dateFin: string
  revenu: number | null
  junior?: { name: string }
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
        case 'titre':
          aVal = a.titre.toLowerCase()
          bVal = b.titre.toLowerCase()
          break
        case 'junior':
          aVal = (a.junior?.name || '').toLowerCase()
          bVal = (b.junior?.name || '').toLowerCase()
          break
        case 'statut':
          aVal = a.statut.toLowerCase()
          bVal = b.statut.toLowerCase()
          break
        case 'dateDebut':
          aVal = a.dateDebut ? new Date(a.dateDebut).getTime() : 0
          bVal = b.dateDebut ? new Date(b.dateDebut).getTime() : 0
          break
        case 'dateFin':
          aVal = new Date(a.dateFin).getTime()
          bVal = new Date(b.dateFin).getTime()
          break
        case 'revenu':
          aVal = a.revenu || 0
          bVal = b.revenu || 0
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
