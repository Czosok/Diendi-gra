import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LibraryPage from './pages/LibraryPage'
import CharacterBuilder from './components/CharacterBuilder'
import CharacterPage from './pages/CharacterPage'
import DiceRoller from './components/DiceRoller'
import SpellsPage from './pages/SpellsPage'
import EquipmentPage from './pages/EquipmentPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/create" element={<CharacterBuilder />} />
            <Route path="/character/:id" element={<CharacterPage />} />
            <Route path="/dice" element={<DiceRoller />} />
            <Route path="/spells" element={<SpellsPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App