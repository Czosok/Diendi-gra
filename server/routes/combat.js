const express = require('express');
const db = require('../db/database');
const { processTrigger, updateBlockDurations, getStatModifier } = require('../services/modifierEngine');

const router = express.Router();

// Get all encounters for a campaign
router.get('/campaign/:campaignId', (req, res) => {
  try {
    const encounters = db.prepare(`
      SELECT * FROM combat_encounters 
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `).all(req.params.campaignId);
    res.json(encounters);
  } catch (error) {
    console.error('Get encounters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single encounter
router.get('/:id', (req, res) => {
  try {
    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(req.params.id);
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const combatants = db.prepare(`
      SELECT c.*, 
        ch.name as character_name, ch.race, ch.class, ch.level,
        n.name as npc_name, n.description as npc_description,
        m.name as monster_name, m.size, m.type, m.armor_class, m.hit_points, m.damage_resistances
      FROM combatants c
      LEFT JOIN characters ch ON c.entity_type = 'character' AND c.entity_id = ch.id
      LEFT JOIN npcs n ON c.entity_type = 'npc' AND c.entity_id = n.id
      LEFT JOIN monsters m ON c.entity_type = 'monster' AND c.entity_id = m.id
      WHERE c.encounter_id = ?
      ORDER BY c.initiative DESC
    `).all(encounter.id);

    const combatLog = db.prepare(`
      SELECT * FROM combat_log 
      WHERE encounter_id = ?
      ORDER BY created_at ASC
    `).all(encounter.id);

    res.json({ ...encounter, combatants, combatLog });
  } catch (error) {
    console.error('Get encounter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start new encounter
router.post('/start', (req, res) => {
  try {
    const { campaignId, name, combatants } = req.body;

    // Create encounter
    const result = db.prepare(`
      INSERT INTO combat_encounters (campaign_id, name, status)
      VALUES (?, ?, 'active')
    `).run(campaignId, name || 'Combat');

    const encounterId = result.lastInsertRowid;

    // Add combatants
    const insertCombatant = db.prepare(`
      INSERT INTO combatants (
        encounter_id, entity_type, entity_id, initiative,
        current_hp, max_hp, temp_hp, current_ac
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    combatants.forEach(c => {
      // Roll initiative
      const initRoll = Math.floor(Math.random() * 20) + 1;
      const dexMod = getStatModifier(c.dexterity || 10);
      const initiative = initRoll + dexMod;

      insertCombatant.run(
        encounterId,
        c.entityType,
        c.entityId,
        initiative,
        c.currentHp || c.maxHp,
        c.maxHp,
        0,
        c.ac || 10
      );
    });

    // Update encounter with initiative order
    const updatedCombatants = db.prepare(`
      SELECT * FROM combatants WHERE encounter_id = ? ORDER BY initiative DESC
    `).all(encounterId);

    const initOrder = JSON.stringify(updatedCombatants.map(c => c.id));
    db.prepare('UPDATE combat_encounters SET initiative_order = ?, current_round = 1, started_at = ? WHERE id = ?')
      .run(initOrder, new Date().toISOString(), encounterId);

    // Log start
    db.prepare(`
      INSERT INTO combat_log (encounter_id, action_type, message)
      VALUES (?, 'system', 'Combat started!')
    `).run(encounterId);

    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);
    res.status(201).json({ ...encounter, combatants: updatedCombatants });
  } catch (error) {
    console.error('Start encounter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Take combat action
router.post('/:id/action', (req, res) => {
  try {
    const { actionType, actorId, targetId, roll, damage, damageType, message } = req.body;
    const encounterId = req.params.id;

    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);
    if (!encounter || encounter.status !== 'active') {
      return res.status(400).json({ error: 'Encounter not active' });
    }

    const actor = db.prepare('SELECT * FROM combatants WHERE id = ?').get(actorId);
    if (!actor) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    // Log the action
    db.prepare(`
      INSERT INTO combat_log (
        encounter_id, round, turn, actor_type, actor_id,
        action_type, target_type, target_id, roll_type, roll_result,
        success, damage, damage_type, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      encounterId,
      encounter.current_round,
      encounter.current_turn,
      actor.entity_type,
      actorId,
      actionType,
      targetId ? 'combatant' : null,
      targetId,
      roll?.type || null,
      roll ? JSON.stringify(roll) : null,
      roll?.success !== undefined ? (roll.success ? 1 : 0) : null,
      damage,
      damageType,
      message
    );

    // Apply damage if applicable
    if (damage && targetId) {
      const target = db.prepare('SELECT * FROM combatants WHERE id = ?').get(targetId);
      if (target) {
        let newHp = target.current_hp - damage;
        let newTemp = target.temp_hp;

        // Apply to temp HP first
        if (newTemp > 0) {
          newTemp = Math.max(0, newTemp - damage);
          newHp = target.current_hp;
        }

        const isDefeated = newHp <= 0 ? 1 : 0;
        
        db.prepare(`
          UPDATE combatants SET current_hp = ?, temp_hp = ?, is_defeated = ? WHERE id = ?
        `).run(newHp, newTemp, isDefeated, targetId);

        // Check if target is defeated and process death triggers
        if (isDefeated) {
          const deathEffects = processTrigger(
            target.entity_type,
            target.entity_id,
            'onDeath',
            { currentHp: 0 },
            db
          );
          // Handle death effects...
        }
      }
    }

    // Emit to all clients in campaign
    const io = req.app.get('io');
    const campaignId = encounter.campaign_id;
    io.to(`campaign-${campaignId}`).emit('combat-update', {
      encounterId,
      action: { actionType, actorId, targetId, roll, damage, damageType, message }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Combat action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Next turn
router.post('/:id/next-turn', (req, res) => {
  try {
    const encounterId = req.params.id;
    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);

    if (!encounter || encounter.status !== 'active') {
      return res.status(400).json({ error: 'Encounter not active' });
    }

    const combatants = JSON.parse(encounter.initiative_order || '[]');
    let currentTurn = encounter.current_turn;
    let currentRound = encounter.current_round;

    // Move to next combatant
    currentTurn++;
    if (currentTurn >= combatants.length) {
      currentTurn = 0;
      currentRound++;

      // Update block durations for all entities at round start
      combatants.forEach(cId => {
        const c = db.prepare('SELECT * FROM combatants WHERE id = ?').get(cId);
        if (c) {
          updateBlockDurations(c.entity_type, c.entity_id, db);
        }
      });
    }

    // Update turn
    db.prepare(`
      UPDATE combat_encounters SET current_turn = ?, current_round = ? WHERE id = ?
    `).run(currentTurn, currentRound, encounterId);

    // Update combatant turn status
    db.prepare('UPDATE combatants SET is_turn = 0 WHERE encounter_id = ?').run(encounterId);
    db.prepare('UPDATE combatants SET is_turn = 1 WHERE id = ?').get(combatants[currentTurn]);

    // Log turn change
    const currentCombatant = db.prepare(`
      SELECT c.*, ch.name, m.name as monster_name
      FROM combatants c
      LEFT JOIN characters ch ON c.entity_type = 'character' AND c.entity_id = ch.id
      LEFT JOIN monsters m ON c.entity_type = 'monster' AND c.entity_id = m.id
      WHERE c.id = ?
    `).get(combatants[currentTurn]);

    const name = currentCombatant.name || currentCombatant.monster_name;
    
    db.prepare(`
      INSERT INTO combat_log (encounter_id, round, turn, action_type, message)
      VALUES (?, ?, ?, 'system', ?)
    `).run(encounterId, currentRound, currentTurn, `Round ${currentRound}: ${name}'s turn`);

    const updatedEncounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);
    res.json(updatedEncounter);
  } catch (error) {
    console.error('Next turn error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// End encounter
router.post('/:id/end', (req, res) => {
  try {
    const encounterId = req.params.id;

    db.prepare(`
      UPDATE combat_encounters SET status = 'completed', ended_at = ? WHERE id = ?
    `).run(new Date().toISOString(), encounterId);

    db.prepare(`
      INSERT INTO combat_log (encounter_id, action_type, message)
      VALUES (?, 'system', 'Combat ended!')
    `).run(encounterId, 'Combat ended!');

    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);
    res.json(encounter);
  } catch (error) {
    console.error('End encounter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Roll dice helper
router.post('/roll', (req, res) => {
  try {
    const { dice, modifier } = req.body; // dice like "2d6+3"
    
    const match = dice.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid dice format' });
    }

    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const bonus = match[3] ? parseInt(match[3]) : 0;
    const modifierBonus = modifier || 0;

    const rolls = [];
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * dieSize) + 1;
      rolls.push(roll);
      total += roll;
    }
    total += bonus + modifierBonus;

    res.json({
      dice,
      rolls,
      total,
      modifier: modifierBonus + bonus,
      isCritical: rolls.length > 0 && rolls.every(r => r === dieSize),
      isFumble: rolls.length > 0 && rolls.every(r => r === 1)
    });
  } catch (error) {
    console.error('Roll error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;