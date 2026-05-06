const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Data directory
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Characters storage file
const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');

// Initialize characters file if not exists
if (!fs.existsSync(CHARACTERS_FILE)) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify([]));
}

// Helper functions
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getCharacters() {
  return readJSON('characters.json');
}

function saveCharacters(characters) {
  writeJSON('characters.json', characters);
}

// API Routes

// Get all characters
app.get('/api/characters', (req, res) => {
  const characters = getCharacters();
  res.json(characters);
});

// Get single character
app.get('/api/characters/:id', (req, res) => {
  const characters = getCharacters();
  const character = characters.find(c => c.id === req.params.id);
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }
  res.json(character);
});

// Create character
app.post('/api/characters', (req, res) => {
  const characters = getCharacters();
  const newCharacter = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  characters.push(newCharacter);
  saveCharacters(characters);
  res.status(201).json(newCharacter);
});

// Update character
app.put('/api/characters/:id', (req, res) => {
  const characters = getCharacters();
  const index = characters.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }
  characters[index] = {
    ...characters[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveCharacters(characters);
  res.json(characters[index]);
});

// Delete character
app.delete('/api/characters/:id', (req, res) => {
  let characters = getCharacters();
  const index = characters.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }
  const deleted = characters.splice(index, 1)[0];
  saveCharacters(characters);
  res.json({ message: 'Character deleted', character: deleted });
});

// Reference data routes
app.get('/api/races', (req, res) => {
  const races = readJSON('races.json');
  res.json(races);
});

app.get('/api/classes', (req, res) => {
  const classes = readJSON('classes.json');
  res.json(classes);
});

app.get('/api/backgrounds', (req, res) => {
  const backgrounds = readJSON('backgrounds.json');
  res.json(backgrounds);
});

// Spells with optional filtering
app.get('/api/spells', (req, res) => {
  let spells = readJSON('spells.json');
  
  const { class: spellClass, school, level, search } = req.query;
  
  if (spellClass) {
    spells = spells.filter(s => s.classes && s.classes.includes(spellClass));
  }
  if (school) {
    spells = spells.filter(s => s.school === school);
  }
  if (level !== undefined) {
    spells = spells.filter(s => s.level === parseInt(level));
  }
  if (search) {
    const searchLower = search.toLowerCase();
    spells = spells.filter(s => 
      s.name.toLowerCase().includes(searchLower) || 
      (s.description && s.description.toLowerCase().includes(searchLower))
    );
  }
  
  res.json(spells);
});

// Equipment with optional filtering
app.get('/api/equipment', (req, res) => {
  let equipment = readJSON('equipment.json');
  
  const { type, search, category } = req.query;
  
  if (type) {
    equipment = equipment.filter(e => e.type === type);
  }
  if (category) {
    equipment = equipment.filter(e => e.category === category);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    equipment = equipment.filter(e => 
      e.name.toLowerCase().includes(searchLower) || 
      (e.description && e.description.toLowerCase().includes(searchLower))
    );
  }
  
  res.json(equipment);
});

// Start server
app.listen(PORT, () => {
  console.log(`HeroForge server running on port ${PORT}`);
});