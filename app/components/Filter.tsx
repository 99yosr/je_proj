'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import './Filter.css'

type FilterItem = {
  id: number
  name: string
  userType: string
  city?: string
}

type FilterProps = {
  title: string
  items: FilterItem[]
  onSelect?: (id: number | null) => void
  selectedId?: number | null
  onClear?: () => void
  showClearButton?: boolean
}

export default function Filter({
  title,
  items,
  onSelect,
  selectedId,
  onClear,
  showClearButton = true
}: FilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les items selon la recherche
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.city && item.city.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelect = (id: number) => {
    if (onSelect) {
      onSelect(id === selectedId ? null : id)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    if (onSelect) {
      onSelect(null)
    }
    setSearchTerm('')
    if (onClear) {
      onClear()
    }
  }

  // Trouver l'item sélectionné
  const selectedItem = selectedId ? items.find(item => item.id === selectedId) : null

  return (
    <div className="filter-container">
      <div className="filter-header">
        <div className="filter-title-section">
          <h3 className="filter-title">{title}</h3>
          {selectedItem && (
            <div className="selected-indicator">
              <span className="selected-name">{selectedItem.name}</span>
              {selectedItem.city && (
                <span className="selected-city">{selectedItem.city}</span>
              )}
            </div>
          )}
        </div>

        <div className="filter-actions">
          {showClearButton && selectedId && (
            <button
              className="clear-button"
              onClick={handleClear}
              title="Clear filter"
            >
              <X size={16} />
            </button>
          )}
          <button
            className="toggle-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="filter-dropdown">
          {/* Barre de recherche */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          {/* Liste des items en grille */}
          <div className="items-grid">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`grid-item ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <div className="item-content">
                  <div className="item-name">{item.name}</div>
                  {item.city && (
                    <div className="item-city">{item.city}</div>
                  )}
                  <div className="item-type">{item.userType}</div>
                </div>
                {selectedId === item.id && (
                  <div className="selected-checkmark">
                    <div className="check-circle">✓</div>
                  </div>
                )}
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="no-results">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer avec statistiques */}
          <div className="filter-footer">
            <span className="total-items">
              Total: {items.length} juniors
            </span>
            {searchTerm && (
              <span className="filtered-items">
                Filtered: {filteredItems.length} juniors
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}