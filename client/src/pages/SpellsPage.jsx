import React, { useState, useEffect } from 'react'

function SpellsPage() {
  const [spells, setSpells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterSchool, setFilterSchool] = useState('')

  useEffect(() => {
    fetchSpells()
  }, [])

  useEffect(() => {
    fetchSpells()
  }, [searchTerm, filterClass, filterLevel, filterSchool])

  const fetchSpells = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterClass) params.append('class', filterClass)
      if (filterLevel) params.append('level', filterLevel)
      if (filterSchool) params.append('school', filterSchool)

      const response = await fetch(`/api/spells?${params}`)
      if (!response.ok) throw new Error('Failed to fetch spells')
      const data = await response.json()
      setSpells(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const classes = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

  if (loading) {
    return (
      <div className="loading">
        <span className="loading-spinner">✨</span>
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
        <h1 className="page-title">✨ Spell Browser</h1>
        <p className="page-subtitle">Browse the arcane arts</p>
      </header>

      <div className="browser-controls">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search spells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-select filter-select"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="form-select filter-select"
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="0">Cantrip</option>
          {levels.slice(1).map(l => <option key={l} value={l}>Level {l}</option>)}
        </select>
        <select
          className="form-select filter-select"
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
        >
          <option value="">All Schools</option>
          {schools.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {spells.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h2 className="empty-title">No Spells Found</h2>
          <p className="empty-text">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="spell-list">
          {spells.map(spell => (
            <div key={spell.id} className="spell-card">
              <div className="spell-header">
                <h3 className="spell-name">{spell.name}</h3>
                <span className="spell-level">
                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                </span>
              </div>
              <div className="spell-meta">
                <span>{spell.school}</span>
                <span> • </span>
                <span>{spell.castingTime}</span>
                <span> • </span>
                <span>{spell.range}</span>
              </div>
              <p className="spell-description">{spell.description}</p>
              {spell.damage && (
                <div className="card-stat mt-sm">
                  <span className="stat-label">Damage:</span>
                  <span className="stat-value">{spell.damage} {spell.damageType}</span>
                </div>
              )}
              {spell.healing && (
                <div className="card-stat mt-sm">
                  <span className="stat-label">Healing:</span>
                  <span className="stat-value">{spell.healing}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SpellsPage