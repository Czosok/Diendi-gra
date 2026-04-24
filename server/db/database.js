const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dnd.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  gm_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  language TEXT DEFAULT 'en',
  FOREIGN KEY (gm_id) REFERENCES users(id)
);

-- Campaign Players
CREATE TABLE IF NOT EXISTS campaign_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(campaign_id, user_id)
);

-- Characters (Player Characters)
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  background TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 10,
  max_hp INTEGER DEFAULT 10,
  temp_hp INTEGER DEFAULT 0,
  ac INTEGER DEFAULT 10,
  speed INTEGER DEFAULT 30,
  proficiency_bonus INTEGER DEFAULT 2,
  -- Base Stats
  strength INTEGER DEFAULT 10,
  dexterity INTEGER DEFAULT 10,
  constitution INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,
  -- Death Saves
  death_save_successes INTEGER DEFAULT 0,
  death_save_failures INTEGER DEFAULT 0,
  is_alive INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- NPCs (Non-Player Characters)
CREATE TABLE IF NOT EXISTS npcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  race TEXT,
  class TEXT,
  description TEXT,
  personality TEXT,
  stats TEXT, -- JSON blob
  inventory TEXT, -- JSON blob
  dialogue_tree TEXT, -- JSON blob
  is_hostile INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Monsters
CREATE TABLE IF NOT EXISTS monsters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  alignment TEXT,
  armor_class INTEGER,
  armor_type TEXT,
  hit_points INTEGER,
  hit_dice TEXT,
  speed TEXT,
  strength INTEGER,
  dexterity INTEGER,
  constitution INTEGER,
  intelligence INTEGER,
  wisdom INTEGER,
  charisma INTEGER,
  saving_throws TEXT, -- JSON
  skills TEXT, -- JSON
  damage_resistances TEXT,
  damage_immunities TEXT,
  condition_immunities TEXT,
  senses TEXT,
  languages TEXT,
  challenge_rating TEXT,
  xp INTEGER,
  abilities TEXT, -- JSON - special abilities
  actions TEXT, -- JSON
  reactions TEXT, -- JSON
  legendary_actions TEXT, -- JSON
  description TEXT,
  image_url TEXT
);

-- Modifier Blocks (the core of the system)
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL, -- spell, item, condition, class, race, feat
  source_id TEXT, -- ID of the source item/spell
  unique_block INTEGER DEFAULT 0, -- Only one instance allowed
  description TEXT,
  modifiers TEXT NOT NULL, -- JSON: [{stat, operation, value}]
  conditions TEXT, -- JSON: [{stat, comparison, value}]
  trigger TEXT, -- onTurnStart, onTurnEnd, onHit, onHitReceived, onDeath, onRoll
  duration TEXT, -- permanent, rounds(N), untilEndOfTurn, untilRemoved, untilCondition
  duration_rounds INTEGER,
  requires_concentration INTEGER DEFAULT 0
);

-- Active Blocks on Characters/NPCs/Monsters
CREATE TABLE IF NOT EXISTS active_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL, -- character, npc, monster
  entity_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  rounds_remaining INTEGER,
  concentration_id INTEGER, -- For tracking concentration
  source_type TEXT, -- spell, item, etc
  source_name TEXT,
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- weapon, armor, potion, tool, adventuring_gear, treasure
  rarity TEXT, -- common, uncommon, rare, very_rare, legendary, artifact
  weight REAL DEFAULT 0,
  cost TEXT, -- e.g. "10 gp"
  damage TEXT, -- e.g. "1d8"
  damage_type TEXT,
  armor_class TEXT, -- for armor
  armor_type TEXT, -- light, medium, heavy
  min_strength TEXT,
  stealth_disadvantage INTEGER DEFAULT 0,
  description TEXT,
  properties TEXT, -- JSON
  is_magic INTEGER DEFAULT 0,
  is_versatile INTEGER DEFAULT 0,
  two_handed_damage TEXT
);

-- Spells
CREATE TABLE IF NOT EXISTS spells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components TEXT NOT NULL,
  duration TEXT NOT NULL,
  concentration INTEGER DEFAULT 0,
  ritual INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  higher_level TEXT, -- Description at higher levels
  saving_throw TEXT,
  damage_type TEXT,
  damage_at_slot TEXT, -- JSON by spell level
  healing TEXT,
  classes TEXT NOT NULL, -- JSON array
  subclasses TEXT, -- JSON array
  is_ritual INTEGER DEFAULT 0
);

-- Spell Blocks (predefined blocks for spells)
CREATE TABLE IF NOT EXISTS spell_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spell_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  FOREIGN KEY (spell_id) REFERENCES spells(id),
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- Features (Class Features, Racial Features, Feats)
CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL, -- class, race, feat
  source_name TEXT NOT NULL, -- e.g. "Fighter", "Elf", "Great Weapon Master"
  level_required INTEGER DEFAULT 1,
  description TEXT NOT NULL,
  blocks TEXT, -- JSON array of block IDs
  prerequisites TEXT -- JSON
);

-- Combat Encounters
CREATE TABLE IF NOT EXISTS combat_encounters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending', -- pending, active, completed
  current_round INTEGER DEFAULT 0,
  current_turn INTEGER DEFAULT 0,
  initiative_order TEXT, -- JSON array
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Combatants (entities in an encounter)
CREATE TABLE IF NOT EXISTS combatants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encounter_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL, -- character, npc, monster
  entity_id INTEGER NOT NULL,
  initiative INTEGER,
  current_hp INTEGER,
  max_hp INTEGER,
  temp_hp INTEGER DEFAULT 0,
  current_ac INTEGER,
  conditions TEXT, -- JSON array of conditions
  is_turn INTEGER DEFAULT 0,
  is_defeated INTEGER DEFAULT 0,
  FOREIGN KEY (encounter_id) REFERENCES combat_encounters(id)
);

-- Combat Log
CREATE TABLE IF NOT EXISTS combat_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encounter_id INTEGER NOT NULL,
  round INTEGER,
  turn INTEGER,
  actor_type TEXT,
  actor_id INTEGER,
  action_type TEXT NOT NULL, -- attack, spell, move, etc
  target_type TEXT,
  target_id INTEGER,
  roll_type TEXT, -- attack, save, damage, skill
  roll_result TEXT, -- JSON {die, total, modifier}
  success INTEGER, -- 1, 0, or null for non-binary
  damage INTEGER,
  damage_type TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES combat_encounters(id)
);

-- Map Regions
CREATE TABLE IF NOT EXISTS map_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  biome TEXT,
  danger_level INTEGER DEFAULT 1,
  grid_data TEXT, -- JSON for procedural generation seed
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Map Locations (Points of Interest)
CREATE TABLE IF NOT EXISTS map_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- city, town, village, dungeon, tower, cave, ruins, etc
  x REAL NOT NULL,
  y REAL NOT NULL,
  description TEXT,
  interior_map_id INTEGER,
  is_discovered INTEGER DEFAULT 0,
  FOREIGN KEY (region_id) REFERENCES map_regions(id)
);

-- Interiors (Indoor maps)
CREATE TABLE IF NOT EXISTS interiors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  width INTEGER DEFAULT 10,
  height INTEGER DEFAULT 10,
  floor TEXT DEFAULT 'stone',
  tiles TEXT NOT NULL, -- JSON grid
  FOREIGN KEY (location_id) REFERENCES map_locations(id)
);

-- Session History (for AI RAG)
CREATE TABLE IF NOT EXISTS session_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL, -- narrative, combat, exploration, social
  content TEXT NOT NULL,
  actors TEXT, -- JSON array
  location TEXT,
  importance INTEGER DEFAULT 1, -- 1-5 for RAG relevance
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Game Variables (session state)
CREATE TABLE IF NOT EXISTS game_variables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  UNIQUE(campaign_id, key)
);

-- Translations
CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(language, key)
);

-- Character Equipment
CREATE TABLE IF NOT EXISTS character_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  slot TEXT NOT NULL, -- head, chest, main_hand, off_hand, ring1, ring2, feet, back
  is_equipped INTEGER DEFAULT 1,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Character Inventory
CREATE TABLE IF NOT EXISTS character_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_equipped INTEGER DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Character Known Spells
CREATE TABLE IF NOT EXISTS character_spells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  spell_id INTEGER NOT NULL,
  prepared INTEGER DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (spell_id) REFERENCES spells(id),
  UNIQUE(character_id, spell_id)
);

-- Character Spell Slots
CREATE TABLE IF NOT EXISTS character_spell_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  total INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  UNIQUE(character_id, level)
);

-- Conditions
CREATE TABLE IF NOT EXISTS conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  blocks TEXT, -- JSON of condition effects
  source TEXT DEFAULT 'rule'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_active_blocks_entity ON active_blocks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_combatants_encounter ON combatants(encounter_id);
CREATE INDEX IF NOT EXISTS idx_combat_log_encounter ON combat_log(encounter_id);
CREATE INDEX IF NOT EXISTS idx_session_history_campaign ON session_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language);
`);

console.log('Database schema created successfully!');
module.exports = db;