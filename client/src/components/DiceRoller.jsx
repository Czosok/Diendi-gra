import React, { useState } from 'react'

function DiceRoller() {
  const [selectedDie, setSelectedDie] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [modifier, setModifier] = useState(0)
  const [rollType, setRollType] = useState('normal')
  const [history, setHistory] = useState([])

  const dice = [
    { sides: 4, label: 'd4' },
    { sides: 6, label: 'd6' },
    { sides: 8, label: 'd8' },
    { sides: 10, label: 'd10' },
    { sides: 12, label: 'd12' },
    { sides: 20, label: 'd20' },
    { sides: 100, label: 'd100' }
  ]

  const roll = (numSides) => {
    setSelectedDie(numSides)
    setRolling(true)
    
    // Animation delay
    setTimeout(() => {
      const roll1 = Math.floor(Math.random() * numSides) + 1
      let rollResult = roll1
      
      // Apply roll type modifiers
      if (rollType === 'advantage') {
        const roll2 = Math.floor(Math.random() * numSides) + 1
        rollResult = Math.max(rollResult, roll2)
      } else if (rollType === 'disadvantage') {
        const roll2 = Math.floor(Math.random() * numSides) + 1
        rollResult = Math.min(rollResult, roll2)
      }
      
      const total = rollResult + parseInt(modifier)
      setResult(rollResult)
      setRolling(false)
      
      // Add to history
      setHistory(prev => [{
        die: `d${numSides}`,
        roll: rollResult,
        modifier: parseInt(modifier),
        total: total,
        type: rollType,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)])
    }, 500)
  }

  const clearHistory = () => setHistory([])

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">🎲 Dice Roller</h1>
        <p className="page-subtitle">Roll the dice for your adventure</p>
      </header>

      <div className="dice-container">
        {/* Dice Selection */}
        <div className="dice-grid">
          {dice.map(die => (
            <button
              key={die.sides}
              className={`die ${selectedDie === die.sides ? 'selected' : ''} ${rolling ? 'rolling' : ''}`}
              onClick={() => !rolling && roll(die.sides)}
              disabled={rolling}
            >
              {die.label}
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="form-group">
          <label className="form-label">Roll Type</label>
          <select
            className="form-select"
            value={rollType}
            onChange={(e) => setRollType(e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="advantage">Advantage</option>
            <option value="disadvantage">Disadvantage</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Modifier</label>
          <input
            type="number"
            className="form-input"
            value={modifier}
            onChange={(e) => setModifier(e.target.value)}
          />
        </div>

        {/* Result Display */}
        {result && !rolling && (
          <div className="dice-result">
            <div className="result-value">{result}</div>
            <div className="result-detail">
              d{selectedDie} = {result}
              {modifier != 0 && (
                <span> + {modifier} = {result + parseInt(modifier)}</span>
              )}
            </div>
          </div>
        )}

        {/* Roll History */}
        {history.length > 0 && (
          <div className="roll-history">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="history-title">Roll History</h3>
              <button className="btn btn-small btn-secondary" onClick={clearHistory}>
                Clear
              </button>
            </div>
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <span className="history-die">
                  {item.die} {item.type !== 'normal' && `(${item.type})`}
                </span>
                <span className="history-result">
                  {item.roll}
                  {item.modifier !== 0 && `+${item.modifier}`}
                  {' '}= {item.total}
                </span>
                <span className="history-time">{item.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DiceRoller