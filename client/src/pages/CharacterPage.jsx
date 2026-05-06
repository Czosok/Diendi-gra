import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

function CharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hpEdit, setHpEdit] = useState(false)

  useEffect(() => {
    fetchCharacter()
  }, [id])

  const fetchCharacter = async () => {
    try {
      const response = await fetch(`/api/characters/${id}`)
      if (!response.ok) throw new Error('Failed to fetch character')
      const data = await response.json()
      setCharacter(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const updateHP = async (field, value) => {
    const newHP = { ...character.hp, [field]: parseInt(value) }
    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hp: newHP })
      })
      if (!response.ok) throw new Error('Failed to update HP')
      const updated = await response.json()
      setCharacter(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteCharacter = async () => {
    if (!window.confirm('Are you sure you want to delete this character?')) return
    
    try {
      const response = await fetch(`/api/characters/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete character')
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : mod
  }

  const getSavingThrow = (ability) => {
    if (!character.proficiency) return getModifier(ability)
    const prof = character.proficiency.includes(ability) ? 2 : 0
    return getModifier(ability + prof)
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

  if (!character) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❓</div>
        <h2 className="empty-title">Character Not Found</h2>
        <Link to="/" className="btn">Back to Library</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="character-header">
        <div>
          <h1 className="character-title">{character.name}</h1>
          <p className="character-subtitle">
            Level {character.level || 1} {character.raceName} {character.className}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/character/${id}/edit`} className="btn btn-secondary">
            ✏️ Edit
          </Link>
          <button onClick={deleteCharacter} className="btn btn-danger">
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* HP Block */}
        <div className="stat-block">
          <h3 className="stat-block-title">Hit Points</h3>
          <div className="hp-tracker">
            <div className="hp-current">
              <label className="form-label">Current</label>
              <input
                type="number"
                className="form-input hp-input"
                value={character.hp?.current || 0}
                onChange={(e) => updateHP('current', e.target.value)}
              />
            </div>
            <span style={{ fontSize: '1.5rem' }}>/</span>
            <div className="hp-current">
              <label className="form-label">Max</label>
              <input
                type="number"
                className="form-input hp-input"
                value={character.hp?.max || 0}
                onChange={(e) => updateHP('max', e.target.value)}
              />
            </div>
            <div className="hp-current">
              <label className="form-label">Temp</label>
              <input
                type="number"
                className="form-input hp-input"
                value={character.hp?.temp || 0}
                onChange={(e) => updateHP('temp', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* AC & Speed */}
        <div className="stat-block">
          <h3 className="stat-block-title">Defense</h3>
          <div className="stat-block-content">
            <div className="card-stat">
              <span className="stat-label">Armor Class</span>
              <span className="stat-value">{character.ac || 10}</span>
            </div>
            <div className="card-stat">
              <span className="stat-label">Speed</span>
              <span className="stat-value">{character.speed || 30} ft</span>
            </div>
            <div className="card-stat">
              <span className="stat-label">Initiative</span>
              <span className="stat-value">{character.initiative ? getModifier(character.initiative) : '+0'}</span>
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="stat-block" style={{ gridColumn: 'span 2' }}>
          <h3 className="stat-block-title">Ability Scores</h3>
          <div className="ability-scores">
            {character.abilities && Object.entries(character.abilities).map(([stat, value]) => (
              <div key={stat} className="ability-score">
                <div className="ability-name">{stat.toUpperCase()}</div>
                <div className="ability-value">{value}</div>
                <div className="ability-modifier">{getModifier(value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Saving Throws */}
        <div className="stat-block">
          <h3 className="stat-block-title">Saving Throws</h3>
          <div className="stat-block-content">
            {character.abilities && Object.entries(character.abilities).map(([stat, value]) => (
              <div key={stat} className="card-stat">
                <span className="stat-label">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                <span className="stat-value">{getSavingThrow(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="stat-block">
          <h3 className="stat-block-title">Proficiencies</h3>
          <div className="stat-block-content">
            <div className="card-stat">
              <span className="stat-label">Proficiency Bonus</span>
              <span className="stat-value">+{character.proficiencyBonus || 2}</span>
            </div>
            {character.skills && character.skills.slice(0, 6).map(skill => (
              <div key={skill} className="card-stat">
                <span className="stat-label">{skill}</span>
                <span className="stat-value">+{character.proficiencyBonus || 2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        {character.equipment && character.equipment.length > 0 && (
          <div className="stat-block">
            <h3 className="stat-block-title">Equipment</h3>
            <div className="stat-block-content">
              {character.equipment.map((item, idx) => (
                <div key={idx} className="card-stat">
                  <span className="stat-value">{item.name || item}</span>
                  {item.damage && <span className="stat-label">{item.damage}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spells */}
        {character.spells && character.spells.length > 0 && (
          <div className="stat-block">
            <h3 className="stat-block-title">Known Spells</h3>
            <div className="stat-block-content">
              {character.spells.map((spell, idx) => (
                <div key={idx} className="card-stat">
                  <span className="stat-value">{spell.name || spell}</span>
                  <span className="stat-label">{spell.level || '0'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CharacterPage