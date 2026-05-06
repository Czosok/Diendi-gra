import React, { useState, useEffect } from 'react'

function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchEquipment()
  }, [searchTerm, filterType, filterCategory])

  const fetchEquipment = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType) params.append('type', filterType)
      if (filterCategory) params.append('category', filterCategory)

      const response = await fetch(`/api/equipment?${params}`)
      if (!response.ok) throw new Error('Failed to fetch equipment')
      const data = await response.json()
      setEquipment(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const categories = ['Weapon', 'Armor', 'Tool', 'Gear', 'Potion']
  const types = ['Simple Melee', 'Simple Ranged', 'Martial Melee', 'Martial Ranged', 'Light', 'Medium', 'Heavy', 'Shield', 'Adventuring Gear', 'Potion']

  if (loading) {
    return (
      <div className="loading">
        <span className="loading-spinner">🛡️</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        Error: {error}
      </div>
    )
  }

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">🛡️ Equipment Browser</h1>
        <p className="page-subtitle">Gear up for adventure</p>
      </header>

      <div className="browser-controls">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-select filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="form-select filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {equipment.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <h2 className="empty-title">No Equipment Found</h2>
          <p className="empty-text">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="equipment-list">
          {equipment.map(item => (
            <div key={item.id} className="equipment-card">
              <div className="equipment-header">
                <h3 className="equipment-name">{item.name}</h3>
                <span className="equipment-cost">{item.cost}</span>
              </div>
              <div className="spell-meta">
                <span>{item.category}</span>
                {item.type && (
                  <>
                    <span> • </span>
                    <span>{item.type}</span>
                  </>
                )}
                {item.weight !== undefined && item.weight > 0 && (
                  <>
                    <span> • </span>
                    <span>{item.weight} lb</span>
                  </>
                )}
              </div>
              
              {(item.ac || item.damage) && (
                <div style={{ marginTop: '8px' }}>
                  {item.ac && (
                    <div className="card-stat">
                      <span className="stat-label">AC:</span>
                      <span className="stat-value">{item.ac}</span>
                    </div>
                  )}
                  {item.damage && (
                    <div className="card-stat">
                      <span className="stat-label">Damage:</span>
                      <span className="stat-value">{item.damage} {item.damageType}</span>
                    </div>
                  )}
                  {item.properties && item.properties.length > 0 && (
                    <div className="card-stat">
                      <span className="stat-label">Properties:</span>
                      <span className="stat-value">{item.properties.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EquipmentPage