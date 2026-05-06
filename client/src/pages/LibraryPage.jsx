import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function LibraryPage() {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters')
      if (!response.ok) throw new Error('Failed to fetch characters')
      const data = await response.json()
      setCharacters(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = !searchTerm || 
      char.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !filterClass || char.classId === filterClass
    return matchesSearch && matchesClass
  })

  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : mod
  }

  if (loading) {
    return (
      <div className="loading">
        <span className="loading-spinner">⚔️</span>
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
        <h1 className="page-title">⚔️ Character Library</h1>
        <p className="page-subtitle">Your heroes await their adventure</p>
      </header>

      <div className="browser-controls">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search heroes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-select filter-select"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          <option value="fighter">Fighter</option>
          <option value="wizard">Wizard</option>
          <option value="rogue">Rogue</option>
          <option value="cleric">Cleric</option>
          <option value="paladin">Paladin</option>
          <option value="ranger">Ranger</option>
          <option value="bard">Bard</option>
          <option value="barbarian">Barbarian</option>
          <option value="druid">Druid</option>
          <option value="monk">Monk</option>
          <option value="sorcerer">Sorcerer</option>
          <option value="warlock">Warlock</option>
        </select>
      </div>

      {filteredCharacters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2 className="empty-title">No Heroes Yet</h2>
          <p className="empty-text">Create your first hero to begin the adventure!</p>
          <Link to="/create" className="btn">
            ✨ Create Hero
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCharacters.map(character => (
            <Link 
              to={`/character/${character.id}`} 
              key={character.id} 
              className="card"
            >
              <div className="card-header">
                <h3 className="card-title">{character.name}</h3>
                <span className="card-level">Lv. {character.level || 1}</span>
              </div>
              <p className="card-subtitle">
                {character.raceName} {character.className}
              </p>
              
              {character.abilities && (
                <div className="ability-scores mt-md">
                  {Object.entries(character.abilities).slice(0, 6).map(([stat, value]) => (
                    <div key={stat} className="ability-score" style={{ padding: '8px' }}>
                      <div className="ability-name">{stat.toUpperCase()}</div>
                      <div className="ability-value" style={{ fontSize: '1.25rem' }}>{value}</div>
                      <div className="ability-modifier">{getModifier(value)}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {character.hp && (
                <div className="card-stat mt-md">
                  <span className="stat-label">HP</span>
                  <span className="stat-value">{character.hp.current}/{character.hp.max}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryPage