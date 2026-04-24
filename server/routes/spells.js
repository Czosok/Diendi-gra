const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Get all spells
router.get('/', (req, res) => {
  try {
    const { level, school, classes, concentration } = req.query;
    
    let query = 'SELECT * FROM spells WHERE 1=1';
    const params = [];

    if (level !== undefined) {
      query += ' AND level = ?';
      params.push(parseInt(level));
    }
    if (school) {
      query += ' AND school = ?';
      params.push(school);
    }
    if (classes) {
      query += ' AND classes LIKE ?';
      params.push(`%${classes}%`);
    }
    if (concentration !== undefined) {
      query += ' AND concentration = ?';
      params.push(concentration === 'true' ? 1 : 0);
    }

    query += ' ORDER BY level, name';
    const spells = db.prepare(query).all(...params);
    res.json(spells);
  } catch (error) {
    console.error('Get spells error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single spell
router.get('/:id', (req, res) => {
  try {
    const spell = db.prepare('SELECT * FROM spells WHERE id = ?').get(req.params.id);
    if (!spell) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    // Get associated blocks
    const blocks = db.prepare(`
      SELECT b.* FROM spell_blocks sb
      JOIN blocks b ON sb.block_id = b.id
      WHERE sb.spell_id = ?
    `).all(spell.id);

    res.json({ ...spell, blocks });
  } catch (error) {
    console.error('Get spell error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create spell (admin)
router.post('/', (req, res) => {
  try {
    const {
      name, level, school, castingTime, range, components,
      duration, concentration, ritual, description, higherLevel,
      savingThrow, damageType, damageAtSlot, healing, classes, subclasses
    } = req.body;

    const result = db.prepare(`
      INSERT INTO spells (
        name, level, school, casting_time, range, components,
        duration, concentration, ritual, description, higher_level,
        saving_throw, damage_type, damage_at_slot, healing, classes, subclasses
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, level, school, castingTime, range, components,
      duration, concentration ? 1 : 0, ritual ? 1 : 0, description, higherLevel,
      savingThrow, damageType, damageAtSlot, healing, classes, subclasses
    );

    const spell = db.prepare('SELECT * FROM spells WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(spell);
  } catch (error) {
    console.error('Create spell error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get spells by class
router.get('/class/:charClass', (req, res) => {
  try {
    const spells = db.prepare(`
      SELECT * FROM spells 
      WHERE classes LIKE ?
      ORDER BY level, name
    `).all(`%${req.params.charClass}%`);
    res.json(spells);
  } catch (error) {
    console.error('Get spells by class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cantrips
router.get('/cantrips/:charClass', (req, res) => {
  try {
    const spells = db.prepare(`
      SELECT * FROM spells 
      WHERE level = 0 AND classes LIKE ?
      ORDER BY name
    `).all(`%${req.params.charClass}%`);
    res.json(spells);
  } catch (error) {
    console.error('Get cantrips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;