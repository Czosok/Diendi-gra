import React from 'react'
import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">⚔️ HeroForge</h1>
        <p className="tagline">Character Manager</p>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📜</span>
          Library
        </NavLink>
        
        <NavLink to="/create" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">✨</span>
          Create Hero
        </NavLink>
        
        <NavLink to="/dice" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🎲</span>
          Dice Roller
        </NavLink>
        
        <NavLink to="/spells" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">✨</span>
          Spell Browser
        </NavLink>
        
        <NavLink to="/equipment" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🛡️</span>
          Equipment
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <p>Powered by D&D 5e</p>
      </div>
    </aside>
  )
}

export default Sidebar