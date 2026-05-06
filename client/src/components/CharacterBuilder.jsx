import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function CharacterBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Reference data
  const [races, setRaces] = useState([])
  const [classes, setClasses] = useState([])
  const [backgrounds, setBackgrounds] = useState([])

  // Character form data
  const [character, setCharacter] = useState({
    name: '',
    raceId: '',
    subclassId: '',
    classId: '',
    backgroundId: '',
    level: 1,
    abilities: {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
    },
    hp: { current: 10, max: 10, temp: 0 },
    equipment: [],
    spells: [],
    skills: [],
    proficiency: [],
    backstory: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [racesRes, classesRes, backgroundsRes] = await Promise.all([
        fetch('/api/races'),
        fetch('/api/classes'),
        fetch('/api/backgrounds')
      ])
      
      const [racesData, classesData, backgroundsData] = await Promise.all([
        racesRes.json(),
        classesRes.json(),
        backgroundsRes.json()
      ])
      
      setRaces(racesData)
      setClasses(classesData)
      setBackgrounds(backgroundsData)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const updateCharacter = (field, value) => {
    setCharacter(prev => ({ ...prev, [field]: value }))
  }

  const updateAbility = (ability, value) => {
    setCharacter(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: parseInt(value) }
    }))
  }

  const toggleArrayItem = (field, item) => {
    setCharacter(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  const calculateHP = () => {
    const cls = classes.find(c => c.id === character.classId)
    if (!cls) return 10
    const die = parseInt(cls.hitDie?.replace('d', '')) || 8
    return die + Math.floor((character.abilities.con - 10) / 2)
  }

  const calculateAC = () => {
    let ac = 10
    // Check armor
    if (character.equipment.some(e => e.id === 'leather')) ac = 11
    if (character.equipment.some(e => e.id === 'studded-leather')) ac = 12
    if (character.equipment.some(e => e.id === 'chain-shirt')) ac = 13
    if (character.equipment.some(e => e.id === 'scale-mail')) ac = 14
    if (character.equipment.some(e => e.id === 'breastplate')) ac = 14
    if (character.equipment.some(e => e.id === 'half-plate')) ac = 15
    if (character.equipment.some(e => e.id === 'ring-mail')) ac = 14
    if (character.equipment.some(e => e.id === 'chain-mail')) ac = 16
    if (character.equipment.some(e => e.id === 'splint-armor')) ac = 17
    if (character.equipment.some(e => e.id === 'plate-armor')) ac = 18
    // Add dex mod for light/medium armor
    const dexMod = Math.floor((character.abilities.dex - 10) / 2)
    if (character.equipment.some(e => ['leather', 'studded-leather'].includes(e.id))) {
      ac += dexMod
    }
    return ac
  }

  const getRace = () => races.find(r => r.id === character.raceId)

  const getClass = () => classes.find(c => c.id === character.classId)

  const getBackground = () => backgrounds.find(b => b.id === character.backgroundId)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const race = getRace()
      const cls = getClass()
      const bg = getBackground()

      const newCharacter = {
        name: character.name,
        raceName: race?.name || 'Human',
        className: cls?.name || 'Fighter',
        backgroundName: bg?.name || 'Soldier',
        raceId: character.raceId,
        classId: character.classId,
        backgroundId: character.backgroundId,
        background: character.backgroundId,
        level: 1,
        abilities: character.abilities,
        hp: {
          current: calculateHP(),
          max: calculateHP(),
          temp: 0
        },
        ac: calculateAC(),
        speed: race?.speed || 30,
        proficiency: character.proficiency,
        skills: character.skills,
        equipment: character.equipment,
        spells: character.spells,
        backstory: character.backstory,
        initiative: character.abilities.dex,
        proficiencyBonus: 2
      }

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharacter)
      })

      if (!response.ok) throw new Error('Failed to create character')
      const saved = await response.json()
      navigate(`/character/${saved.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <span className="loading-spinner">✨</span>
      </div>
    )
  }

  const steps = [
    { num: 1, name: 'Basic Info' },
    { num: 2, name: 'Race' },
    { num: 3, name: 'Class' },
    { num: 4, name: 'Abilities' },
    { num: 5, name: 'Background' },
    { num: 6, name: 'Equipment' }
  ]

  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : mod
  }

  return (
    <div className="builder-container">
      <header className="page-header">
        <h1 className="page-title">✨ Create Your Hero</h1>
        <p className="page-subtitle">The adventure begins here</p>
      </header>

      {error && <div className="error">{error}</div>}

      {/* Step Indicators */}
      <div className="builder-steps">
        {steps.map(s => (
          <div 
            key={s.num} 
            className={`builder-step ${step === s.num ? 'active' : ''} ${s.num < step ? 'completed' : ''}`}
            onClick={() => s.num < step && setStep(s.num)}
          >
            {s.num}. {s.name}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="builder-content">
          <h2 className="mb-lg">Basic Information</h2>
          
          <div className="form-group">
            <label className="form-label">Hero Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your hero's name"
              value={character.name}
              onChange={(e) => updateCharacter('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Character Concept</label>
            <textarea
              className="form-input"
              placeholder="Brief description of your hero"
              rows={3}
              value={character.backstory}
              onChange={(e) => updateCharacter('backstory', e.target.value)}
            />
          </div>

          <div className="builder-actions">
            <div></div>
            <button 
              className="btn" 
              onClick={() => character.name && setStep(2)}
              disabled={!character.name}
            >
              Next: Choose Race →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Race Selection */}
      {step === 2 && (
        <div className="builder-content">
          <h2 className="mb-lg">Choose Your Race</h2>
          
          <div className="selection-grid">
            {races.map(race => (
              <div 
                key={race.id}
                className={`selection-item ${character.raceId === race.id ? 'selected' : ''}`}
                onClick={() => {
                  updateCharacter('raceId', race.id)
                  // Apply ability bonuses
                  const newAbilities = { ...character.abilities }
                  if (race.abilityBonuses) {
                    Object.entries(race.abilityBonuses).forEach(([ability, bonus]) => {
                      newAbilities[ability] = (newAbilities[ability] || 10) + bonus
                    })
                  }
                  updateCharacter('abilities', newAbilities)
                }}
              >
                <h3>{race.name}</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{race.description?.slice(0, 80)}...</p>
              </div>
            ))}
          </div>

          <div className="builder-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button 
              className="btn" 
              onClick={() => character.raceId && setStep(3)}
              disabled={!character.raceId}
            >
              Next: Choose Class →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Class Selection */}
      {step === 3 && (
        <div className="builder-content">
          <h2 className="mb-lg">Choose Your Class</h2>
          
          <div className="selection-grid">
            {classes.map(cls => (
              <div 
                key={cls.id}
                className={`selection-item ${character.classId === cls.id ? 'selected' : ''}`}
                onClick={() => {
                  updateCharacter('classId', cls.id)
                  // Apply HP based on class
                  const die = parseInt(cls.hitDie?.replace('d', '')) || 8
                  const conMod = Math.floor((character.abilities.con - 10) / 2)
                  const hp = die + conMod
                  updateCharacter('hp', { current: hp, max: hp, temp: 0 })
                }}
              >
                <h3>{cls.name}</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Hit Die: {cls.hitDie} • {cls.primaryAbility?.toUpperCase()} focused
                </p>
              </div>
            ))}
          </div>

          <div className="builder-actions">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button 
              className="btn" 
              onClick={() => character.classId && setStep(4)}
              disabled={!character.classId}
            >
              Next: Ability Scores →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Abilities */}
      {step === 4 && (
        <div className="builder-content">
          <h2 className="mb-lg">Ability Scores</h2>
          <p className="mb-md">Assign your ability scores. Click to change values.</p>
          
          <div className="ability-scores">
            {Object.entries(character.abilities).map(([ability, value]) => (
              <div key={ability} className="ability-score">
                <div className="ability-name">{ability.toUpperCase()}</div>
                <div className="ability-value">{value}</div>
                <div className="ability-modifier">{getModifier(value)}</div>
                <button 
                  className="btn btn-small btn-secondary mt-sm"
                  onClick={() => updateAbility(ability, Math.max(1, Math.min(30, value - 1)))}
                >
                  -
                </button>
                <button 
                  className="btn btn-small btn-secondary mt-sm"
                  onClick={() => updateAbility(ability, Math.max(1, Math.min(30, value + 1)))}
                >
                  +
                </button>
              </div>
            ))}
          </div>

          <div className="builder-actions">
            <button className="btn btn-secondary" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button className="btn" onClick={() => setStep(5)}>
              Next: Background →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Background */}
      {step === 5 && (
        <div className="builder-content">
          <h2 className="mb-lg">Choose Your Background</h2>
          
          <div className="selection-grid">
            {backgrounds.map(bg => (
              <div 
                key={bg.id}
                className={`selection-item ${character.backgroundId === bg.id ? 'selected' : ''}`}
                onClick={() => {
                  updateCharacter('backgroundId', bg.id)
                  // Add skill proficiencies
                  if (bg.skillProficiencies) {
                    setCharacter(prev => ({
                      ...prev,
                      backgroundId: bg.id,
                      skills: [...new Set([...prev.skills, ...bg.skillProficiencies])]
                    }))
                  }
                }}
              >
                <h3>{bg.name}</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{bg.description?.slice(0, 60)}...</p>
              </div>
            ))}
          </div>

          <div className="builder-actions">
            <button className="btn btn-secondary" onClick={() => setStep(4)}>
              ← Back
            </button>
            <button className="btn" onClick={() => setStep(6)}>
              Next: Equipment →
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Review & Submit */}
      {step === 6 && (
        <div className="builder-content">
          <h2 className="mb-lg">Review Your Hero</h2>
          
          <div className="stats-grid">
            <div className="stat-block">
              <h3 className="stat-block-title">Basic Info</h3>
              <div className="stat-block-content">
                <div className="card-stat">
                  <span className="stat-label">Name</span>
                  <span className="stat-value">{character.name}</span>
                </div>
                <div className="card-stat">
                  <span className="stat-label">Race</span>
                  <span className="stat-value">{getRace()?.name}</span>
                </div>
                <div className="card-stat">
                  <span className="stat-label">Class</span>
                  <span className="stat-value">{getClass()?.name}</span>
                </div>
                <div className="card-stat">
                  <span className="stat-label">Background</span>
                  <span className="stat-value">{getBackground()?.name}</span>
                </div>
              </div>
            </div>

            <div className="stat-block">
              <h3 className="stat-block-title">Combat Stats</h3>
              <div className="stat-block-content">
                <div className="card-stat">
                  <span className="stat-label">Hit Points</span>
                  <span className="stat-value">{calculateHP()} HP</span>
                </div>
                <div className="card-stat">
                  <span className="stat-label">Armor Class</span>
                  <span className="stat-value">{calculateAC()}</span>
                </div>
                <div className="card-stat">
                  <span className="stat-label">Speed</span>
                  <span className="stat-value">{getRace()?.speed || 30} ft</span>
                </div>
              </div>
            </div>

            <div className="stat-block">
              <h3 className="stat-block-title">Ability Scores</h3>
              <div className="ability-scores">
                {Object.entries(character.abilities).map(([ability, value]) => (
                  <div key={ability} className="ability-score" style={{ padding: '8px' }}>
                    <div className="ability-name">{ability.toUpperCase()}</div>
                    <div className="ability-value" style={{ fontSize: '1.25rem' }}>{value}</div>
                    <div className="ability-modifier">{getModifier(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="builder-actions">
            <button className="btn btn-secondary" onClick={() => setStep(5)}>
              ← Back
            </button>
            <button 
              className="btn" 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Creating...' : '⚔️ Create Hero'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CharacterBuilder