const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Get all items
router.get('/', (req, res) => {
  try {
    const { type, rarity, isMagic } = req.query;
    
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (rarity) {
      query += ' AND rarity = ?';
      params.push(rarity);
    }
    if (isMagic !== undefined) {
      query += ' AND is_magic = ?';
      params.push(isMagic === 'true' ? 1 : 0);
    }

    query += ' ORDER BY name';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single item
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create item (admin)
router.post('/', (req, res) => {
  try {
    const {
      name, type, rarity, weight, cost, damage, damageType,
      armorClass, armorType, minStrength, stealthDisadvantage,
      description, properties, isMagic, isVersatile, twoHandedDamage
    } = req.body;

    const result = db.prepare(`
      INSERT INTO items (
        name, type, rarity, weight, cost, damage, damage_type,
        armor_class, armor_type, min_strength, stealth_disadvantage,
        description, properties, is_magic, is_versatile, two_handed_damage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, type, rarity, weight || 0, cost, damage, damageType,
      armorClass, armorType, minStrength, stealthDisadvantage ? 1 : 0,
      description, properties, isMagic ? 1 : 0, isVersatile ? 1 : 0, twoHandedDamage
    );

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get items by type
router.get('/type/:type', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items WHERE type = ? ORDER BY name').all(req.params.type);
    res.json(items);
  } catch (error) {
    console.error('Get items by type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search items
router.get('/search/:query', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT * FROM items 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name
    `).all(`%${req.params.query}%`, `%${req.params.query}%`);
    res.json(items);
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;