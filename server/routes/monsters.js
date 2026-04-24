const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Get all monsters
router.get('/', (req, res) => {
  try {
    const { cr, type, size } = req.query;
    
    let query = 'SELECT * FROM monsters WHERE 1=1';
    const params = [];

    if (cr) {
      query += ' AND challenge_rating = ?';
      params.push(cr);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (size) {
      query += ' AND size = ?';
      params.push(size);
    }

    query += ' ORDER BY name';
    const monsters = db.prepare(query).all(...params);
    res.json(monsters);
  } catch (error) {
    console.error('Get monsters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single monster
router.get('/:id', (req, res) => {
  try {
    const monster = db.prepare('SELECT * FROM monsters WHERE id = ?').get(req.params.id);
    if (!monster) {
      return res.status(404).json({ error: 'Monster not found' });
    }
    res.json(monster);
  } catch (error) {
    console.error('Get monster error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create monster (admin)
router.post('/', (req, res) => {
  try {
    const {
      name, size, type, alignment, armorClass, armorType, hitPoints, hitDice,
      speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
      savingThrows, skills, damageResistances, damageImmunities, conditionImmunities,
      senses, languages, challengeRating, xp, abilities, actions, reactions,
      legendaryActions, description, imageUrl
    } = req.body;

    const result = db.prepare(`
      INSERT INTO monsters (
        name, size, type, alignment, armor_class, armor_type, hit_points, hit_dice,
        speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
        saving_throws, skills, damage_resistances, damage_immunities, condition_immunities,
        senses, languages, challenge_rating, xp, abilities, actions, reactions,
        legendary_actions, description, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, size, type, alignment, armorClass, armorType, hitPoints, hitDice,
      speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
      savingThrows, skills, damageResistances, damageImmunities, conditionImmunities,
      senses, languages, challengeRating, xp, abilities, actions, reactions,
      legendaryActions, description, imageUrl
    );

    const monster = db.prepare('SELECT * FROM monsters WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(monster);
  } catch (error) {
    console.error('Create monster error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monsters by CR range
router.get('/cr/:min/:max', (req, res) => {
  try {
    const monsters = db.prepare(`
      SELECT * FROM monsters 
      WHERE CAST(challenge_rating AS REAL) >= ? AND CAST(challenge_rating AS REAL) <= ?
      ORDER BY CAST(challenge_rating AS REAL), name
    `).all(parseFloat(req.params.min), parseFloat(req.params.max));
    res.json(monsters);
  } catch (error) {
    console.error('Get monsters by CR error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search monsters
router.get('/search/:query', (req, res) => {
  try {
    const monsters = db.prepare(`
      SELECT * FROM monsters 
      WHERE name LIKE ? OR type LIKE ? OR description LIKE ?
      ORDER BY name
    `).all(`%${req.params.query}%`, `%${req.params.query}%`, `%${req.params.query}%`);
    res.json(monsters);
  } catch (error) {
    console.error('Search monsters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;