const express = require('express');
const db = require('../db/database');
const { calculateCharacterStats } = require('../services/modifierEngine');

const router = express.Router();

// Get all characters for user
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const characters = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM character_inventory ci WHERE ci.character_id = c.id) as item_count,
        (SELECT COUNT(*) FROM character_spells cs WHERE cs.character_id = c.id) as spell_count
      FROM characters c 
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(userId);

    res.json(characters);
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single character
router.get('/:id', (req, res) => {
  try {
    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get equipment
    const equipment = db.prepare(`
      SELECT ce.*, i.name, i.type, i.damage, i.damage_type, i.armor_class, i.properties
      FROM character_equipment ce
      JOIN items i ON ce.item_id = i.id
      WHERE ce.character_id = ?
    `).all(character.id);

    // Get inventory
    const inventory = db.prepare(`
      SELECT ci.*, i.name, i.type, i.weight, i.cost, i.description
      FROM character_inventory ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ?
    `).all(character.id);

    // Get spells
    const spells = db.prepare(`
      SELECT cs.*, s.name, s.level, s.school, s.casting_time, s.range, s.duration, s.description
      FROM character_spells cs
      JOIN spells s ON cs.spell_id = s.id
      WHERE cs.character_id = ?
    `).all(character.id);

    // Get spell slots
    const spellSlots = db.prepare('SELECT * FROM character_spell_slots WHERE character_id = ?').all(character.id);

    // Get active blocks
    const activeBlocks = db.prepare(`
      SELECT ab.*, b.name, b.source, b.modifiers, b.trigger, b.duration
      FROM active_blocks ab
      JOIN blocks b ON ab.block_id = b.id
      WHERE ab.entity_type = 'character' AND ab.entity_id = ?
    `).all(character.id);

    // Calculate computed stats
    const stats = calculateCharacterStats(character, activeBlocks);

    res.json({
      ...character,
      equipment,
      inventory,
      spells,
      spellSlots,
      activeBlocks,
      computedStats: stats
    });
  } catch (error) {
    console.error('Get character error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create character
router.post('/', (req, res) => {
  try {
    const {
      userId,
      name,
      race,
      class: charClass,
      background,
      level,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma
    } = req.body;

    if (!name || !race || !charClass) {
      return res.status(400).json({ error: 'Name, race, and class are required' });
    }

    // Calculate HP based on class
    const classHP = {
      'Barbarian': 12,
      'Fighter': 10,
      'Paladin': 10,
      'Ranger': 10,
      'Rogue': 8,
      'Bard': 8,
      'Cleric': 8,
      'Druid': 8,
      'Monk': 8,
      'Sorcerer': 6,
      'Warlock': 8,
      'Wizard': 6
    };

    const baseHP = classHP[charClass] || 8;
    const conMod = Math.floor((constitution - 10) / 2);
    const maxHP = baseHP + conMod;

    // Calculate AC
    let ac = 10;
    if (charClass === 'Monk') {
      ac = 10 + conMod + Math.floor((dexterity - 10) / 2);
    } else if (charClass === 'Barbarian') {
      ac = 10 + conMod + Math.floor((dexterity - 10) / 2);
    }

    const result = db.prepare(`
      INSERT INTO characters (
        user_id, name, race, class, background, level,
        strength, dexterity, constitution, intelligence, wisdom, charisma,
        hp, max_hp, ac
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, name, race, charClass, background || null, level || 1,
      strength || 10, dexterity || 10, constitution || 10, 
      intelligence || 10, wisdom || 10, charisma || 10,
      maxHP, maxHP, ac
    );

    // Add spell slots based on class
    if (['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'].includes(charClass)) {
      const spellLevels = charClass === 'Ranger' || charClass === 'Paladin' ? 2 :
                          charClass === 'Sorcerer' ? 2 :
                          charClass === 'Bard' || charClass === 'Cleric' || charClass === 'Druid' || charClass === 'Warlock' ? 3 :
                          charClass === 'Wizard' ? 3 : 1;

      for (let i = 1; i <= Math.min(spellLevels, 9); i++) {
        const total = i === 1 ? (['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'].includes(charClass) ? 4 : 2) :
                      i === 2 ? (['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Warlock', 'Wizard'].includes(charClass) ? 3 : 2) :
                      i === 3 ? (['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Warlock', 'Wizard'].includes(charClass) ? 3 : 1) : 0;
        
        if (total > 0) {
          db.prepare('INSERT INTO character_spell_slots (character_id, level, total) VALUES (?, ?, ?)').run(
            result.lastInsertRowid, i, total
          );
        }
      }
    }

    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(character);
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update character
router.put('/:id', (req, res) => {
  try {
    const { name, race, class: charClass, background, level, experience } = req.body;
    
    db.prepare(`
      UPDATE characters 
      SET name = COALESCE(?, name),
          race = COALESCE(?, race),
          class = COALESCE(?, class),
          background = COALESCE(?, background),
          level = COALESCE(?, level),
          experience = COALESCE(?, experience),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, race, charClass, background, level, experience, req.params.id);

    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    res.json(character);
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update character stats
router.put('/:id/stats', (req, res) => {
  try {
    const { strength, dexterity, constitution, intelligence, wisdom, charisma } = req.body;
    
    db.prepare(`
      UPDATE characters 
      SET strength = COALESCE(?, strength),
          dexterity = COALESCE(?, dexterity),
          constitution = COALESCE(?, constitution),
          intelligence = COALESCE(?, intelligence),
          wisdom = COALESCE(?, wisdom),
          charisma = COALESCE(?, charisma),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(strength, dexterity, constitution, intelligence, wisdom, charisma, req.params.id);

    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    res.json(character);
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update HP
router.put('/:id/hp', (req, res) => {
  try {
    const { hp, maxHp, tempHp } = req.body;
    
    db.prepare(`
      UPDATE characters 
      SET hp = COALESCE(?, hp),
          max_hp = COALESCE(?, max_hp),
          temp_hp = COALESCE(?, temp_hp),
          is_alive = CASE WHEN ? = 0 THEN 0 ELSE is_alive END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(hp, maxHp, tempHp, hp, req.params.id);

    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    res.json(character);
  } catch (error) {
    console.error('Update HP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to inventory
router.post('/:id/inventory', (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    // Check if already in inventory
    const existing = db.prepare(
      'SELECT * FROM character_inventory WHERE character_id = ? AND item_id = ?'
    ).get(req.params.id, itemId);

    if (existing) {
      db.prepare(
        'UPDATE character_inventory SET quantity = quantity + ? WHERE id = ?'
      ).run(quantity || 1, existing.id);
    } else {
      db.prepare(
        'INSERT INTO character_inventory (character_id, item_id, quantity) VALUES (?, ?, ?)'
      ).run(req.params.id, itemId, quantity || 1);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Equip item
router.post('/:id/equip', (req, res) => {
  try {
    const { itemId, slot } = req.body;
    
    // Unequip current item in slot if any
    db.prepare(
      'UPDATE character_equipment SET is_equipped = 0 WHERE character_id = ? AND slot = ?'
    ).run(req.params.id, slot);

    // Check if already equipped
    const existing = db.prepare(
      'SELECT * FROM character_equipment WHERE character_id = ? AND item_id = ?'
    ).get(req.params.id, itemId);

    if (existing) {
      db.prepare(
        'UPDATE character_equipment SET slot = ?, is_equipped = 1 WHERE id = ?'
      ).run(slot, existing.id);
    } else {
      db.prepare(
        'INSERT INTO character_equipment (character_id, item_id, slot, is_equipped) VALUES (?, ?, ?, 1)'
      ).run(req.params.id, itemId, slot);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Equip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Learn spell
router.post('/:id/spells', (req, res) => {
  try {
    const { spellId } = req.body;
    
    db.prepare(
      'INSERT OR IGNORE INTO character_spells (character_id, spell_id) VALUES (?, ?)'
    ).run(req.params.id, spellId);

    res.json({ success: true });
  } catch (error) {
    console.error('Learn spell error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Prepare spell
router.put('/:id/spells/:spellId/prepare', (req, res) => {
  try {
    const { prepared } = req.body;
    
    db.prepare(
      'UPDATE character_spells SET prepared = ? WHERE character_id = ? AND spell_id = ?'
    ).run(prepared ? 1 : 0, req.params.id, req.params.spellId);

    res.json({ success: true });
  } catch (error) {
    console.error('Prepare spell error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Use spell slot
router.post('/:id/spell-slots/use', (req, res) => {
  try {
    const { level } = req.body;
    
    db.prepare(
      'UPDATE character_spell_slots SET used = used + 1 WHERE character_id = ? AND level = ? AND used < total'
    ).run(req.params.id, level);

    const slots = db.prepare('SELECT * FROM character_spell_slots WHERE character_id = ?').all(req.params.id);
    res.json(slots);
  } catch (error) {
    console.error('Use spell slot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete character
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete character error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;