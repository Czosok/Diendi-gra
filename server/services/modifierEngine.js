/**
 * Block-Based Modifier Engine
 * 
 * This is the core of the D&D 5e stat computation system.
 * Characters have base stats plus modifier "blocks" that can add, subtract,
 * or modify stats through various operations.
 */

// Base stat names
const STATS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

// Modifier operations
const OPERATIONS = {
  ADD: 'add',           // value += modifier.value
  SUBTRACT: 'subtract', // value -= modifier.value
  CHANGE_BASE: 'changeBase', // value = modifier.value
  GRANT: 'grant',       // Add to list/feature
  REMOVE: 'remove'      // Remove from list
};

// Trigger types
const TRIGGERS = {
  ON_TURN_START: 'onTurnStart',
  ON_TURN_END: 'onTurnEnd',
  ON_HIT: 'onHit',
  ON_HIT_RECEIVED: 'onHitReceived',
  ON_DEATH: 'onDeath',
  ON_ROLL: 'onRoll'
};

// Duration types
const DURATIONS = {
  PERMANENT: 'permanent',
  ROUNDS: 'rounds',
  UNTIL_END_OF_TURN: 'untilEndOfTurn',
  UNTIL_REMOVED: 'untilRemoved',
  UNTIL_CONDITION: 'untilCondition'
};

/**
 * Calculate stat modifier from raw stat value
 */
function getStatModifier(stat) {
  return Math.floor((stat - 10) / 2);
}

/**
 * Apply a single modifier to a value
 */
function applyModifier(currentValue, modifier) {
  switch (modifier.operation) {
    case OPERATIONS.ADD:
      return currentValue + modifier.value;
    case OPERATIONS.SUBTRACT:
      return currentValue - modifier.value;
    case OPERATIONS.CHANGE_BASE:
      return modifier.value;
    default:
      return currentValue;
  }
}

/**
 * Evaluate a condition for a modifier
 */
function evaluateCondition(condition, stats) {
  if (!condition) return true;

  const { stat, comparison, value } = condition;
  const statValue = stats[stat] || 0;

  switch (comparison) {
    case 'higherThan':
      return statValue > value;
    case 'lowerThan':
      return statValue < value;
    case 'exact':
      return statValue === value;
    case 'isPresent':
      return stats[stat] !== undefined;
    default:
      return true;
  }
}

/**
 * Parse active blocks and calculate final stats
 */
function calculateCharacterStats(character, activeBlocks = []) {
  // Start with base stats
  const baseStats = {
    strength: character.strength || 10,
    dexterity: character.dexterity || 10,
    constitution: character.constitution || 10,
    intelligence: character.intelligence || 10,
    wisdom: character.wisdom || 10,
    charisma: character.charisma || 10,
    level: character.level || 1,
    proficiencyBonus: Math.ceil((character.level || 1) / 4) + 1
  };

  // Compute stat modifiers
  const statModifiers = {};
  STATS.forEach(stat => {
    statModifiers[stat] = getStatModifier(baseStats[stat]);
  });

  // Apply active blocks to stats
  let computedStats = { ...baseStats, ...statModifiers };

  // Base AC calculation (10 + dex mod)
  computedStats.ac = 10 + statModifiers.dexterity;

  // Base HP from constitution
  computedStats.maxHp = character.max_hp || 10;

  // Process each active block
  activeBlocks.forEach(activeBlock => {
    try {
      const modifiers = JSON.parse(activeBlock.modifiers || '[]');
      const conditions = JSON.parse(activeBlock.conditions || '[]');

      // Check conditions
      const conditionsMet = conditions.every(cond => evaluateCondition(cond, computedStats));
      if (!conditionsMet) return;

      // Apply modifiers
      modifiers.forEach(mod => {
        if (mod.stat) {
          if (STATS.includes(mod.stat)) {
            // Apply to stat
            computedStats[mod.stat] = applyModifier(
              computedStats[mod.stat] || baseStats[mod.stat],
              mod
            );
            // Update stat modifier
            statModifiers[mod.stat] = getStatModifier(computedStats[mod.stat]);
          } else if (mod.stat === 'ac') {
            computedStats.ac = applyModifier(computedStats.ac, mod);
          } else if (mod.stat === 'hp' || mod.stat === 'maxHp') {
            computedStats.maxHp = applyModifier(computedStats.maxHp, mod);
          } else if (mod.stat === 'speed') {
            computedStats.speed = applyModifier(computedStats.speed || 30, mod);
          } else if (mod.stat === 'proficiencyBonus') {
            computedStats.proficiencyBonus = applyModifier(computedStats.proficiencyBonus, mod);
          }
        }

        // Handle skill bonuses
        if (mod.skill) {
          if (!computedStats.skillBonuses) computedStats.skillBonuses = {};
          computedStats.skillBonuses[mod.skill] = applyModifier(
            computedStats.skillBonuses[mod.skill] || 0,
            mod
          );
        }

        // Handle saving throw bonuses
        if (mod.save) {
          if (!computedStats.saveBonuses) computedStats.saveBonuses = {};
          computedStats.saveBonuses[mod.save] = applyModifier(
            computedStats.saveBonuses[mod.save] || 0,
            mod
          );
        }

        // Handle damage bonuses
        if (mod.damage) {
          if (!computedStats.damageBonuses) computedStats.damageBonuses = {};
          computedStats.damageBonuses[mod.damage] = applyModifier(
            computedStats.damageBonuses[mod.damage] || 0,
            mod
          );
        }
      });
    } catch (e) {
      console.error('Error parsing block modifiers:', e);
    }
  });

  // Recalculate derived stats after all modifications
  computedStats.ac = 10 + statModifiers.dexterity;
  
  // Apply AC modifiers from blocks again
  activeBlocks.forEach(activeBlock => {
    try {
      const modifiers = JSON.parse(activeBlock.modifiers || '[]');
      modifiers.forEach(mod => {
        if (mod.stat === 'ac') {
          computedStats.ac = applyModifier(computedStats.ac, mod);
        }
      });
    } catch (e) {
      // Ignore parse errors
    }
  });

  return computedStats;
}

/**
 * Apply a block to an entity (character, npc, monster)
 */
function applyBlock(entityType, entityId, blockId, db) {
  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId);
  if (!block) throw new Error('Block not found');

  // Check if block is unique and already active
  if (block.unique_block) {
    const existing = db.prepare(`
      SELECT * FROM active_blocks 
      WHERE entity_type = ? AND entity_id = ? AND block_id = ?
    `).get(entityType, entityId, blockId);

    if (existing) {
      throw new Error('Unique block already active');
    }
  }

  // Handle concentration
  if (block.requires_concentration) {
    // Remove any existing concentration blocks
    db.prepare(`
      DELETE FROM active_blocks 
      WHERE entity_type = ? AND entity_id = ? AND concentration_id IS NOT NULL
    `).run(entityType, entityId);
  }

  // Calculate expiry
  let expiresAt = null;
  let roundsRemaining = null;

  if (block.duration === DURATIONS.ROUNDS) {
    roundsRemaining = block.duration_rounds || 1;
    expiresAt = new Date(Date.now() + roundsRemaining * 6 * 1000).toISOString(); // 6s per round
  } else if (block.duration === DURATIONS.UNTIL_END_OF_TURN) {
    expiresAt = new Date(Date.now() + 60000).toISOString(); // 1 minute
  }

  // Insert active block
  const result = db.prepare(`
    INSERT INTO active_blocks (
      entity_type, entity_id, block_id, expires_at, rounds_remaining,
      concentration_id, source_type, source_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entityType,
    entityId,
    blockId,
    expiresAt,
    roundsRemaining,
    block.requires_concentration ? blockId : null,
    block.source,
    block.name
  );

  return result.lastInsertRowid;
}

/**
 * Remove a block from an entity
 */
function removeBlock(activeBlockId, db) {
  db.prepare('DELETE FROM active_blocks WHERE id = ?').run(activeBlockId);
}

/**
 * Process triggers for combat events
 */
function processTrigger(entityType, entityId, triggerType, context, db) {
  const activeBlocks = db.prepare(`
    SELECT ab.*, b.modifiers, b.conditions, b.trigger
    FROM active_blocks ab
    JOIN blocks b ON ab.block_id = b.id
    WHERE ab.entity_type = ? AND ab.entity_id = ? AND b.trigger = ?
  `).all(entityType, entityId, triggerType);

  const results = [];

  activeBlocks.forEach(block => {
    try {
      const modifiers = JSON.parse(block.modifiers || '[]');
      const conditions = JSON.parse(block.conditions || '[]');
      
      // Check conditions
      const conditionsMet = conditions.every(cond => evaluateCondition(cond, context));
      if (!conditionsMet) return;

      // Apply modifiers based on trigger type
      modifiers.forEach(mod => {
        // Handle different trigger effects
        if (triggerType === TRIGGERS.ON_TURN_START && mod.heal) {
          results.push({ type: 'heal', value: mod.heal });
        } else if (triggerType === TRIGGERS.ON_TURN_END && mod.damage) {
          results.push({ type: 'damage', value: mod.damage, damageType: mod.damageType });
        } else if (triggerType === TRIGGERS.ON_HIT_RECEIVED && mod.ac) {
          results.push({ type: 'acBonus', value: mod.ac });
        }
      });
    } catch (e) {
      console.error('Error processing trigger:', e);
    }
  });

  return results;
}

/**
 * Update block durations (call this on each round)
 */
function updateBlockDurations(entityType, entityId, db) {
  const now = new Date().toISOString();

  // Remove expired blocks
  const expired = db.prepare(`
    SELECT ab.* FROM active_blocks ab
    WHERE ab.entity_type = ? AND ab.entity_id = ? 
    AND ab.expires_at IS NOT NULL AND ab.expires_at <= ?
  `).all(entityType, entityId, now);

  expired.forEach(block => {
    db.prepare('DELETE FROM active_blocks WHERE id = ?').run(block.id);
  });

  // Decrement rounds for round-based blocks
  db.prepare(`
    UPDATE active_blocks 
    SET rounds_remaining = rounds_remaining - 1
    WHERE entity_type = ? AND entity_id = ? 
    AND rounds_remaining IS NOT NULL AND rounds_remaining > 0
  `).run(entityType, entityId);

  // Remove blocks that have exhausted their rounds
  db.prepare(`
    DELETE FROM active_blocks 
    WHERE entity_type = ? AND entity_id = ? 
    AND rounds_remaining IS NOT NULL AND rounds_remaining <= 0
  `).run(entityType, entityId);

  return expired.length;
}

module.exports = {
  calculateCharacterStats,
  applyBlock,
  removeBlock,
  processTrigger,
  updateBlockDurations,
  getStatModifier,
  STATS,
  OPERATIONS,
  TRIGGERS,
  DURATIONS
};