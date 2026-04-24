# D&D 5e Tabletop RPG Application

A full-featured D&D 5e tabletop RPG application with:

- **Character Creation**: Multi-step wizard with race, class, background, and point-buy stats
- **Character Sheet**: Real-time computed stats using the block-based modifier system
- **Combat System**: Turn-based battle with initiative, attacks, spells, and damage
- **World Map**: Procedural tile-based exploration with Gameboy-style graphics
- **AI Integration**: Ollama-powered NPCs and Game Master
- **Multiplayer**: LAN campaign system with real-time sync via Socket.io
- **Internationalization**: English and Polish language support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (better-sqlite3)
- **AI**: Ollama (local LLM)
- **State**: Zustand
- **i18n**: i18next

## Quick Start

### Prerequisites
- Node.js 18+
- (Optional) Ollama for AI features

### Running the Server

```bash
cd server
npm install
npm start
```

The server runs on port 3001. Database is seeded automatically.

### Running the Client

```bash
cd client
npm install
npm run dev
```

The client runs on port 5173.

### Running with Ollama (AI Features)

```bash
# Start Ollama
ollama serve

# Pull a model (7B recommended for 8GB VRAM)
ollama pull llama3.2:7b
```

## Features

### Block-Based Modifier System

The core innovation is the block-based modifier system. Characters have base stats plus attached modifier blocks computed via operations:
- **add**: value += modifier.value
- **subtract**: value -= modifier.value  
- **changeBase**: value = modifier.value
- **grant**: add to list/feature
- **remove**: remove from list

Blocks have:
- **Triggers**: onTurnStart, onTurnEnd, onHit, onHitReceived, onDeath, onRoll
- **Durations**: permanent, rounds(N), untilEndOfTurn, untilRemoved
- **Scopes**: self, target, aura, allAllies, allEnemies

### Gameboy Aesthetic

The UI uses a 4-color Gameboy palette:
- Darkest: #0f380f
- Dark: #306230
- Light: #8bac0f
- Lightest: #9bbc0f

## Project Structure

```
/server
  /db
    database.js    # SQLite schema
    seed.js        # Initial data
  /routes
    auth.js        # Authentication
    characters.js  # Character CRUD
    items.js       # Items
    spells.js      # Spells
    monsters.js    # Monsters
    combat.js      # Combat system
    campaigns.js   # Campaigns
    ai.js          # AI integration
    maps.js        # World maps
  /services
    modifierEngine.js  # Stat computation
  index.js         # Main server

/client
  /src
    /components    # React components
    /store         # Zustand state
    /context       # React context
    App.tsx        # Main app
    i18n.ts        # Translations
```

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET/POST /api/characters` - Character CRUD
- `GET /api/items` - Get items
- `GET /api/spells` - Get spells
- `GET /api/monsters` - Get monsters
- `POST /api/combat/start` - Start combat
- `POST /api/combat/:id/action` - Combat action
- `GET/POST /api/campaigns` - Campaign management
- `POST /api/ai/gm` - AI Game Master
- `POST /api/ai/npc` - AI NPC conversation

## Socket Events

- `join-campaign` - Join campaign room
- `player-move` - Player position update
- `combat-action` - Combat action broadcast
- `dice-roll` - Shared dice rolling
- `chat-message` - In-game chat