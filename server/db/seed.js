const db = require('./database');

console.log('Seeding database...');

// Helper to seed items
function seedItems() {
  const items = [
    // Weapons
    { name: 'Club', type: 'weapon', weight: 2, cost: '1 gp', damage: '1d4', damage_type: 'bludgeoning', properties: JSON.stringify(['light']) },
    { name: 'Dagger', type: 'weapon', weight: 1, cost: '2 gp', damage: '1d4', damage_type: 'piercing', properties: JSON.stringify(['finesse', 'light', 'thrown']) },
    { name: 'Greatclub', type: 'weapon', weight: 10, cost: '2 gp', damage: '1d8', damage_type: 'bludgeoning', properties: JSON.stringify(['two-handed']) },
    { name: 'Handaxe', type: 'weapon', weight: 2, cost: '5 gp', damage: '1d6', damage_type: 'slashing', properties: JSON.stringify(['light', 'thrown']) },
    { name: 'Javelin', type: 'weapon', weight: 2, cost: '5 sp', damage: '1d6', damage_type: 'piercing', properties: JSON.stringify(['thrown']) },
    { name: 'Light Hammer', type: 'weapon', weight: 2, cost: '2 gp', damage: '1d4', damage_type: 'bludgeoning', properties: JSON.stringify(['light', 'thrown']) },
    { name: 'Mace', type: 'weapon', weight: 4, cost: '5 gp', damage: '1d6', damage_type: 'bludgeoning', properties: JSON.stringify([]) },
    { name: 'Quarterstaff', type: 'weapon', weight: 4, cost: '2 sp', damage: '1d6', damage_type: 'bludgeoning', properties: JSON.stringify(['versatile']) },
    { name: 'Spear', type: 'weapon', weight: 3, cost: '1 gp', damage: '1d6', damage_type: 'piercing', properties: JSON.stringify(['thrown', 'versatile']) },
    { name: 'Shortbow', type: 'weapon', weight: 2, cost: '25 gp', damage: '1d6', damage_type: 'piercing', properties: JSON.stringify(['ammunition', 'two-handed']) },
    { name: 'Longbow', type: 'weapon', weight: 2, cost: '50 gp', damage: '1d8', damage_type: 'piercing', properties: JSON.stringify(['ammunition', 'heavy', 'two-handed']) },
    { name: 'Battleaxe', type: 'weapon', weight: 4, cost: '10 gp', damage: '1d8', damage_type: 'slashing', properties: JSON.stringify(['versatile']) },
    { name: 'Flail', type: 'weapon', weight: 2, cost: '10 gp', damage: '1d8', damage_type: 'bludgeoning', properties: JSON.stringify([]) },
    { name: 'Glaive', type: 'weapon', weight: 6, cost: '20 gp', damage: '1d10', damage_type: 'slashing', properties: JSON.stringify(['heavy', 'reach']) },
    { name: 'Greataxe', type: 'weapon', weight: 7, cost: '30 gp', damage: '1d12', damage_type: 'slashing', properties: JSON.stringify(['heavy', 'two-handed']) },
    { name: 'Greatsword', type: 'weapon', weight: 6, cost: '50 gp', damage: '2d6', damage_type: 'slashing', properties: JSON.stringify(['heavy', 'two-handed']) },
    { name: 'Halberd', type: 'weapon', weight: 6, cost: '20 gp', damage: '1d10', damage_type: 'slashing', properties: JSON.stringify(['heavy', 'reach', 'two-handed']) },
    { name: 'Lance', type: 'weapon', weight: 6, cost: '10 gp', damage: '1d12', damage_type: 'piercing', properties: JSON.stringify(['reach']) },
    { name: 'Longsword', type: 'weapon', weight: 3, cost: '15 gp', damage: '1d8', damage_type: 'slashing', properties: JSON.stringify(['versatile']) },
    { name: 'Maul', type: 'weapon', weight: 10, cost: '10 gp', damage: '2d6', damage_type: 'bludgeoning', properties: JSON.stringify(['heavy', 'two-handed']) },
    { name: 'Morningstar', type: 'weapon', weight: 4, cost: '15 gp', damage: '1d8', damage_type: 'piercing', properties: JSON.stringify([]) },
    { name: 'Pike', type: 'weapon', weight: 18, cost: '5 gp', damage: '1d10', damage_type: 'piercing', properties: JSON.stringify(['heavy', 'reach', 'two-handed']) },
    { name: 'Rapier', type: 'weapon', weight: 2, cost: '25 gp', damage: '1d8', damage_type: 'piercing', properties: JSON.stringify(['finesse']) },
    { name: 'Scimitar', type: 'weapon', weight: 3, cost: '25 gp', damage: '1d6', damage_type: 'slashing', properties: JSON.stringify(['finesse', 'light']) },
    { name: 'Shortsword', type: 'weapon', weight: 2, cost: '10 gp', damage: '1d6', damage_type: 'piercing', properties: JSON.stringify(['finesse', 'light']) },
    { name: 'Trident', type: 'weapon', weight: 4, cost: '5 gp', damage: '1d6', damage_type: 'piercing', properties: JSON.stringify(['thrown', 'versatile']) },
    { name: 'War Pick', type: 'weapon', weight: 2, cost: '5 gp', damage: '1d8', damage_type: 'piercing', properties: JSON.stringify([]) },
    { name: 'Warhammer', type: 'weapon', weight: 2, cost: '15 gp', damage: '1d8', damage_type: 'bludgeoning', properties: JSON.stringify(['versatile']) },
    { name: 'Whip', type: 'weapon', weight: 3, cost: '2 gp', damage: '1d4', damage_type: 'slashing', properties: JSON.stringify(['finesse', 'reach']) },

    // Armor - Light
    { name: 'Padded Armor', type: 'armor', rarity: 'common', weight: 8, cost: '5 gp', armor_class: '11', armor_type: 'light', stealth_disadvantage: 1, description: 'Leather armor padded with quilted layers of cloth and batting.' },
    { name: 'Leather Armor', type: 'armor', rarity: 'common', weight: 10, cost: '10 gp', armor_class: '11', armor_type: 'light', description: 'Breastplate and shoulder guards made of leather.' },
    { name: 'Studded Leather Armor', type: 'armor', rarity: 'uncommon', weight: 13, cost: '45 gp', armor_class: '12', armor_type: 'light', description: 'Leather armor reinforced with rivets or spikes.' },

    // Armor - Medium
    { name: 'Hide Armor', type: 'armor', rarity: 'common', weight: 12, cost: '10 gp', armor_class: '12', armor_type: 'medium', description: 'Crude armor made of thick furs and pelts.' },
    { name: 'Chain Shirt', type: 'armor', rarity: 'common', weight: 20, cost: '50 gp', armor_class: '13', armor_type: 'medium', description: 'Interlocking metal rings组成的盔甲。' },
    { name: 'Scale Mail', type: 'armor', rarity: 'common', weight: 45, cost: '50 gp', armor_class: '14', armor_type: 'medium', stealth_disadvantage: 1, description: 'Coat and leggings of leather covered with overlapping metal scales.' },
    { name: 'Breastplate', type: 'armor', rarity: 'common', weight: 20, cost: '400 gp', armor_class: '14', armor_type: 'medium', description: 'A fitted metal chest piece.' },
    { name: 'Half Plate', type: 'armor', rarity: 'uncommon', weight: 40, cost: '750 gp', armor_class: '15', armor_type: 'medium', stealth_disadvantage: 1, description: 'Metal plates covering most of the body.' },

    // Armor - Heavy
    { name: 'Ring Mail', type: 'armor', rarity: 'common', weight: 40, cost: '30 gp', armor_class: '14', armor_type: 'heavy', stealth_disadvantage: 1, description: 'Leather armor with heavy rings sewn into it.' },
    { name: 'Chain Mail', type: 'armor', rarity: 'common', weight: 55, cost: '75 gp', armor_class: '16', armor_type: 'heavy', stealth_disadvantage: 1, description: 'Interlocking metal rings covering the body.' },
    { name: 'Splint Armor', type: 'armor', rarity: 'uncommon', weight: 60, cost: '200 gp', armor_class: '17', armor_type: 'heavy', stealth_disadvantage: 1, description: 'Narrow vertical strips of metal riveted to a leather backing.' },
    { name: 'Plate Armor', type: 'armor', rarity: 'rare', weight: 65, cost: '1500 gp', armor_class: '18', armor_type: 'heavy', stealth_disadvantage: 1, description: 'Full body armor of shaped, interlocking metal plates.' },

    // Shields
    { name: 'Shield', type: 'armor', rarity: 'common', weight: 6, cost: '10 gp', armor_class: '+2', armor_type: 'shield', description: 'A wooden or metal shield carried on one arm.' },

    // Potions
    { name: 'Potion of Healing', type: 'potion', rarity: 'common', weight: 0.5, cost: '50 gp', description: 'Heals 2d4+2 hit points.', properties: JSON.stringify({ heal: '2d4+2' }) },
    { name: 'Potion of Greater Healing', type: 'potion', rarity: 'uncommon', weight: 0.5, cost: '150 gp', description: 'Heals 4d4+4 hit points.', properties: JSON.stringify({ heal: '4d4+4' }) },
    { name: 'Potion of Superior Healing', type: 'potion', rarity: 'rare', weight: 0.5, cost: '450 gp', description: 'Heals 8d4+8 hit points.', properties: JSON.stringify({ heal: '8d4+8' }) },
    { name: 'Potion of Supreme Healing', type: 'potion', rarity: 'very_rare', weight: 0.5, cost: '1350 gp', description: 'Heals 10d4+20 hit points.', properties: JSON.stringify({ heal: '10d4+20' }) },
    { name: 'Antitoxin', type: 'potion', rarity: 'common', weight: 0.5, cost: '50 gp', description: 'Advantage on saving throws against poison for 1 hour.' },

    // Tools
    { name: 'Thieves\' Tools', type: 'tool', weight: 1, cost: '25 gp', description: 'Tools for picking locks and disabling traps.' },
    { name: 'Holy Symbol', type: 'tool', weight: 1, cost: '5 gp', description: 'Symbol of divine faith.' },
    { name: 'Arcane Focus (Crystal)', type: 'tool', weight: 1, cost: '10 gp', description: 'A crystal used to focus arcane energy.' },
    { name: 'Arcane Focus (Orb)', type: 'tool', weight: 3, cost: '20 gp', description: 'An orb used to focus arcane energy.' },
    { name: 'Arcane Focus (Rod)', type: 'tool', weight: 2, cost: '10 gp', description: 'A rod used to focus arcane energy.' },
    { name: 'Arcane Focus (Staff)', type: 'tool', weight: 4, cost: '5 gp', description: 'A staff used to focus arcane energy.' },
    { name: 'Arcane Focus (Wand)', type: 'tool', weight: 1, cost: '10 gp', description: 'A wand used to focus arcane energy.' },

    // Adventuring Gear
    { name: 'Rope (50 ft)', type: 'adventuring_gear', weight: 10, cost: '1 gp', description: 'Hempen rope, 50 feet.' },
    { name: 'Torch', type: 'adventuring_gear', weight: 1, cost: '1 cp', description: 'Burns for 1 hour, bright light 20 ft, dim light 20 ft more.' },
    { name: 'Lantern (Hooded)', type: 'adventuring_gear', weight: 2, cost: '5 gp', description: 'Bright light 30 ft, dim 30 ft more. Burns 6 hours per pint of oil.' },
    { name: 'Bedroll', type: 'adventuring_gear', weight: 7, cost: '1 gp', description: 'Blankets and padding for sleeping.' },
    { name: 'Rations (1 day)', type: 'adventuring_gear', weight: 2, cost: '5 sp', description: 'Dry food for one day.' },
    { name: 'Waterskin', type: 'adventuring_gear', weight: 5, cost: '2 sp', description: 'Holds 4 pints of water.' },
    { name: 'Crowbar', type: 'adventuring_gear', weight: 5, cost: '2 gp', description: 'Advantage on Strength checks where leverage can be applied.' },
    { name: 'Grappling Hook', type: 'adventuring_gear', weight: 4, cost: '2 gp', description: 'Iron hook for climbing.' },
    { name: 'Ladder (10 ft)', type: 'adventuring_gear', weight: 25, cost: '1 sp', description: 'Wooden ladder, 10 feet.' },
    { name: 'Mirror', type: 'adventuring_gear', weight: 0.5, cost: '5 gp', description: 'Steel hand mirror.' },
    { name: 'Silver Wire', type: 'adventuring_gear', weight: 0.5, cost: '5 gp', description: '10 feet of silver wire for use with triggers and locks.' },
    { name: 'Tinderbox', type: 'adventuring_gear', weight: 1, cost: '5 sp', description: 'Flint, steel, and tinder for starting fires.' },
    { name: 'Common Clothes', type: 'adventuring_gear', weight: 3, cost: '5 sp', description: 'Simple clothing.' },
    { name: 'Traveler\'s Clothes', type: 'adventuring_gear', weight: 4, cost: '2 gp', description: 'Sturdy traveling clothes.' },
    { name: 'Coin Purse', type: 'adventuring_gear', weight: 0, cost: '5 sp', description: 'Leather pouch for carrying coins.' },

    // Magic Items
    { name: 'Ring of Protection', type: 'weapon', rarity: 'rare', weight: 0, cost: '3500 gp', is_magic: 1, description: '+1 to AC and saving throws.', properties: JSON.stringify({ ac: 1, save: 1 }) },
    { name: 'Cloak of Protection', type: 'armor', rarity: 'rare', weight: 1, cost: '4000 gp', is_magic: 1, description: '+1 to AC and saving throws.', properties: JSON.stringify({ ac: 1, save: 1 }) },
    { name: 'Gloves of Thievery', type: 'tool', rarity: 'uncommon', weight: 0, cost: '2500 gp', is_magic: 1, description: '+5 to Dexterity (Sleight of Hand) checks.' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items (
      name, type, rarity, weight, cost, damage, damage_type,
      armor_class, armor_type, stealth_disadvantage, description, properties, is_magic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  items.forEach(item => {
    stmt.run(
      item.name, item.type, item.rarity, item.weight, item.cost,
      item.damage || null, item.damage_type || null,
      item.armor_class || null, item.armor_type || null,
      item.stealth_disadvantage || 0, item.description,
      item.properties || null, item.is_magic || 0
    );
  });

  console.log(`Seeded ${items.length} items`);
}

// Helper to seed spells
function seedSpells() {
  const spells = [
    // Cantrips
    { name: 'Fire Bolt', level: 0, school: 'Evocation', casting_time: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On hit: 1d10 fire damage.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Light', level: 0, school: 'Evocation', casting_time: '1 action', range: 'Touch', components: 'V, M', duration: '1 hour', concentration: 0, description: 'You touch one object that is no larger than 10 feet in any dimension. The object sheds bright light in a 20-foot radius.', classes: '["Wizard", "Sorcerer", "Cleric"]' },
    { name: 'Mage Hand', level: 0, school: 'Conjuration', casting_time: '1 action', range: '30 feet', components: 'V, S', duration: '1 minute', concentration: 0, description: 'A spectral, floating hand appears at a point you choose within range. You can use your action to control the hand.', classes: '["Wizard", "Bard", "Warlock"]' },
    { name: 'Prestidigitation', level: 0, school: 'Transmutation', casting_time: '1 action', range: '10 feet', components: 'V, S', duration: 'Up to 1 hour', concentration: 0, description: 'A minor magical trick that novice spellcasters use for practice. Create one of several minor effects.', classes: '["Wizard", "Bard", "Sorcerer", "Warlock"]' },
    { name: 'Ray of Frost', level: 0, school: 'Evocation', casting_time: '1 action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, description: 'A frigid beam of blue-white light streaks toward a creature. On hit: 1d10 cold damage and speed reduced by 10 feet until start of your next turn.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Sacred Flame', level: 0, school: 'Evocation', casting_time: '1 action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, description: 'Flame-like radiance descends on a creature. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage.', classes: '["Cleric"]' },
    { name: 'Shocking Grasp', level: 0, school: 'Evocation', casting_time: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', concentration: 0, description: 'Lightning springs from your hand to deliver a shock. Advantage on attack roll if target is wearing metal armor. On hit: 1d8 lightning damage.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Thaumaturgy', level: 0, school: 'Transmutation', casting_time: '1 action', range: '30 feet', components: 'V', duration: 'Up to 1 minute', concentration: 0, description: 'You manifest a minor wonder, a sign of supernatural power, within range.', classes: '["Cleric"]' },
    { name: 'Vicious Mockery', level: 0, school: 'Enchantment', casting_time: '1 action', range: '60 feet', components: 'V', duration: 'Instantaneous', concentration: 0, description: 'You unleash a string of insults laced with subtle enchantments. Target must succeed on Wisdom save or take 1d4 psychic damage and have disadvantage on next attack roll.', classes: '["Bard"]' },
    { name: 'Eldritch Blast', level: 0, school: 'Evocation', casting_time: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack. On hit: 1d10 force damage.', classes: '["Warlock"]' },

    // 1st Level
    { name: 'Burning Hands', level: 1, school: 'Evocation', casting_time: '1 action', range: 'Self (15-foot cone)', components: 'V, S', duration: 'Instantaneous', concentration: 0, saving_throw: 'Dexterity', damage_type: 'fire', damage_at_slot: '{"1":"3d6","2":"4d6","3":"5d6","4":"6d6","5":"7d6","6":"8d6","7":"9d6","8":"10d6","9":"11d6"}', description: 'As you hold your hands together, a thin sheet of flames shoots forth. Each creature in a 15-foot cone must make a Dexterity saving throw. Takes 3d6 fire damage on failed save, half on success.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Charm Person', level: 1, school: 'Enchantment', casting_time: '1 action', range: '30 feet', components: 'V, S', duration: '1 hour', concentration: 0, saving_throw: 'Wisdom', description: 'You attempt to charm a humanoid. It must make a Wisdom saving throw with advantage if you or your companions are fighting it. On fail, it regards you as a friendly acquaintance.', classes: '["Wizard", "Bard", "Druid", "Warlock", "Sorcerer"]' },
    { name: 'Cure Wounds', level: 1, school: 'Evocation', casting_time: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', concentration: 0, healing: '1d8 + modifier', description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.', classes: '["Cleric", "Bard", "Druid", "Paladin", "Ranger"]' },
    { name: 'Detect Magic', level: 1, school: 'Divination', casting_time: '1 action', range: 'Self', components: 'V, S', duration: 'Concentration, up to 10 minutes', concentration: 1, description: 'For the duration, you sense the presence of magic within 30 feet of you.', classes: '["Wizard", "Cleric", "Druid", "Paladin", "Ranger", "Bard", "Sorcerer"]' },
    { name: 'Guiding Bolt', level: 1, school: 'Evocation', casting_time: '1 action', range: '120 feet', components: 'V, S', duration: '1 round', concentration: 0, saving_throw: 'Dexterity', damage_type: 'radiant', damage_at_slot: '{"1":"4d6"}', description: 'A flash of light streaks toward a creature. Make a ranged spell attack. On hit: 4d6 radiant damage. Next attack roll against the target has advantage.', classes: '["Cleric"]' },
    { name: 'Healing Word', level: 1, school: 'Evocation', casting_time: '1 bonus action', range: '60 feet', components: 'V', duration: 'Instantaneous', concentration: 0, healing: '1d4 + modifier', description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier.', classes: '["Cleric", "Bard", "Druid"]' },
    { name: 'Magic Missile', level: 1, school: 'Evocation', casting_time: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, damage_type: 'force', damage_at_slot: '{"1":"1d4+1","2":"1d4+1","3":"1d4+1"}', description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4+1 force damage.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Shield', level: 1, school: 'Abjuration', casting_time: '1 reaction', range: 'Self', components: 'V, S', duration: '1 round', concentration: 0, description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Sleep', level: 1, school: 'Enchantment', casting_time: '1 action', range: '90 feet', components: 'V, S, M', duration: '1 minute', concentration: 1, description: 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect.', classes: '["Wizard", "Bard", "Sorcerer"]' },
    { name: 'Thunderwave', level: 1, school: 'Evocation', casting_time: '1 action', range: 'Self (15-foot cube)', components: 'V, S', duration: 'Instantaneous', concentration: 0, saving_throw: 'Constitution', damage_type: 'thunder', damage_at_slot: '{"1":"2d8"}', description: 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube must make a Constitution save. On fail: 2d8 thunder damage and pushed 10 feet away.', classes: '["Wizard", "Bard", "Druid", "Sorcerer"]' },

    // 2nd Level
    { name: 'Hold Person', level: 2, school: 'Enchantment', casting_time: '1 action', range: '60 feet', components: 'V, S, M', duration: 'Concentration, up to 1 minute', concentration: 1, saving_throw: 'Wisdom', description: 'Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration.', classes: '["Wizard", "Bard", "Cleric", "Druid", "Warlock", "Sorcerer"]' },
    { name: 'Invisibility', level: 2, school: 'Illusion', casting_time: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, up to 1 hour', concentration: 1, description: 'A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target\'s person.', classes: '["Wizard", "Bard", "Sorcerer", "Warlock"]' },
    { name: 'Misty Step', level: 2, school: 'Conjuration', casting_time: '1 bonus action', range: 'Self', components: 'V', duration: 'Instantaneous', concentration: 0, description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.', classes: '["Wizard", "Sorcerer", "Warlock"]' },
    { name: 'Scorching Ray', level: 2, school: 'Evocation', casting_time: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, saving_throw: 'Dexterity', damage_type: 'fire', damage_at_slot: '{"2":"2d6","3":"2d6","4":"2d6"}', description: 'You create three rays of fire and hurl them at targets within range. Make a ranged spell attack for each ray. On hit: 2d6 fire damage.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Spiritual Weapon', level: 2, school: 'Evocation', casting_time: '1 bonus action', range: '60 feet', components: 'V, S', duration: '1 minute', concentration: 0, damage_type: 'force', description: 'You create a floating, spectral weapon within range. When you cast the spell, make a melee spell attack against a creature within 5 feet of the weapon. On hit: 1d8 + spellcasting modifier force damage.', classes: '["Cleric"]' },

    // 3rd Level
    { name: 'Fireball', level: 3, school: 'Evocation', casting_time: '1 action', range: '150 feet', components: 'V, S, M', duration: 'Instantaneous', concentration: 0, saving_throw: 'Dexterity', damage_type: 'fire', damage_at_slot: '{"3":"8d6","4":"9d6","5":"10d6","6":"11d6","7":"12d6","8":"13d6","9":"14d6"}', description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot radius must make a Dexterity saving throw. Takes 8d6 fire damage on fail, half on success.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Fly', level: 3, school: 'Transmutation', casting_time: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, up to 10 minutes', concentration: 1, description: 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration.', classes: '["Wizard", "Sorcerer", "Warlock"]' },
    { name: 'Haste', level: 3, school: 'Transmutation', casting_time: '1 action', range: '30 feet', components: 'V, S, M', duration: 'Concentration, up to 1 minute', concentration: 1, description: 'Choose a willing creature. It gains double speed, +2 bonus to AC, advantage on Dexterity saves, and an additional action each turn.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Lightning Bolt', level: 3, school: 'Evocation', casting_time: '1 action', range: 'Self (100-foot line)', components: 'V, S, M', duration: 'Instantaneous', concentration: 0, saving_throw: 'Dexterity', damage_type: 'lightning', damage_at_slot: '{"3":"8d6"}', description: 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you. Each creature in the line must make a Dexterity save. Takes 8d6 lightning damage on fail, half on success.', classes: '["Wizard", "Sorcerer"]' },
    { name: 'Revivify', level: 3, school: 'Necromancy', casting_time: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Instantaneous', concentration: 0, description: 'You touch a creature that has died within the last minute. That creature returns to life with 1 hit point.', classes: '["Cleric", "Paladin"]' },

    // 4th Level
    { name: 'Banishment', level: 4, school: 'Abjuration', casting_time: '1 action', range: '60 feet', components: 'V, S, M', duration: 'Concentration, up to 1 minute', concentration: 1, saving_throw: 'Charisma', description: 'You attempt to send one creature to another plane of existence. Target must succeed on a Charisma saving throw or be banished.', classes: '["Wizard", "Cleric", "Paladin", "Sorcerer", "Warlock"]' },
    { name: 'Dimension Door', level: 4, school: 'Conjuration', casting_time: '1 action', range: '500 feet', components: 'V', duration: 'Instantaneous', concentration: 0, description: 'You teleport yourself from your current location to any other spot within range. You arrive at exactly the spot desired.', classes: '["Wizard", "Bard", "Sorcerer", "Warlock"]' },
    { name: 'Greater Invisibility', level: 4, school: 'Illusion', casting_time: '1 action', range: 'Touch', components: 'V, S', duration: 'Concentration, up to 1 minute', concentration: 1, description: 'You or a creature you touch becomes invisible until the spell ends. This invisibility doesn\'t end when the target attacks or casts a spell.', classes: '["Wizard", "Bard", "Sorcerer"]' },
    { name: 'Polymorph', level: 4, school: 'Transmutation', casting_time: '1 action', range: '60 feet', components: 'V, S, M', duration: 'Concentration, up to 1 hour', concentration: 1, saving_throw: 'Wisdom', description: 'This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom save to avoid the effect.', classes: '["Wizard", "Bard", "Druid", "Sorcerer"]' },

    // 5th Level
    { name: 'Cone of Cold', level: 5, school: 'Evocation', casting_time: '1 action', range: 'Self (60-foot cone)', components: 'V, S, M', duration: 'Instantaneous', concentration: 0, saving_throw: 'Constitution', damage_type: 'cold', damage_at_slot: '{"5":"8d8"}', description: 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution save. Takes 8d8 cold damage on fail, half on success.', classes: '["Wizard", "Sorcerer", "Wizard"]' },
    { name: 'Hold Monster', level: 5, school: 'Enchantment', casting_time: '1 action', range: '90 feet', components: 'V, S, M', duration: 'Concentration, up to 1 minute', concentration: 1, saving_throw: 'Wisdom', description: 'Choose a creature that you can see within range. The target must succeed on a Wisdom save or be paralyzed for the duration.', classes: '["Wizard", "Bard", "Sorcerer", "Warlock"]' },
    { name: 'Mass Cure Wounds', level: 5, school: 'Evocation', casting_time: '1 action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', concentration: 0, healing: '3d8 + modifier', description: 'A wave of healing energy washes out from a point of your choice within range. Choose up to six creatures in a 30-foot-radius sphere. Each target regains hit points equal to 3d8 + your spellcasting ability modifier.', classes: '["Cleric", "Bard", "Druid"]' },
    { name: 'Raise Dead', level: 5, school: 'Necromancy', casting_time: '1 hour', range: 'Touch', components: 'V, S, M', duration: 'Instantaneous', concentration: 0, description: 'You return a dead creature you touch to life, provided that it has been dead no longer than 10 days.', classes: '["Cleric", "Paladin"]' },
    { name: 'Teleport', level: 5, school: 'Conjuration', casting_time: '1 action', range: '10 feet', components: 'V', duration: 'Instantaneous', concentration: 0, description: 'This spell instantly transports you and up to eight other creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select.', classes: '["Wizard", "Bard", "Sorcerer"]' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO spells (
      name, level, school, casting_time, range, components, duration,
      concentration, ritual, description, higher_level, saving_throw,
      damage_type, damage_at_slot, healing, classes, subclasses
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  spells.forEach(spell => {
    stmt.run(
      spell.name, spell.level, spell.school, spell.casting_time, spell.range,
      spell.components, spell.duration, spell.concentration || 0, spell.ritual || 0,
      spell.description, spell.higher_level || null, spell.saving_throw || null,
      spell.damage_type || null, spell.damage_at_slot || null, spell.healing || null,
      spell.classes, spell.subclasses || null
    );
  });

  console.log(`Seeded ${spells.length} spells`);
}

// Helper to seed monsters
function seedMonsters() {
  const monsters = [
    { name: 'Goblin', size: 'Small', type: 'humanoid', alignment: 'Neutral Evil', armor_class: 15, armor_type: 'leather', hit_points: 7, hit_dice: '2d6', speed: '30 ft.', strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8, challenge_rating: '1/4', xp: 50, actions: '[{"name":"Scimitar","attack":"+4 to hit","damage":"1d6+2 slashing"},{"name":"Shortbow","attack":"+4 to hit","damage":"1d6+2 piercing"}]', description: 'Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings.' },
    { name: 'Kobold', size: 'Small', type: 'humanoid', alignment: 'Lawful Evil', armor_class: 12, armor_type: 'leather', hit_points: 5, hit_dice: '1d6+2', speed: '30 ft.', strength: 7, dexterity: 15, constitution: 12, intelligence: 8, wisdom: 7, charisma: 8, challenge_rating: '1/8', xp: 25, actions: '[{"name":"Dagger","attack":"+4 to hit","damage":"1d4+2 piercing"}]', description: 'Kobolds are reptilian humanoids that worship dragons as gods.' },
    { name: 'Skeleton', size: 'Medium', type: 'undead', alignment: 'Lawful Evil', armor_class: 13, armor_type: 'armor', hit_points: 13, hit_dice: '2d8+4', speed: '30 ft.', strength: 10, dexterity: 14, constitution: 15, intelligence: 6, wisdom: 8, charisma: 5, challenge_rating: '1/4', xp: 50, actions: '[{"name":"Shortsword","attack":"+4 to hit","damage":"1d6+2 piercing"},{"name":"Shortbow","attack":"+4 to hit","damage":"1d6+2 piercing"}]', description: 'Skeletons are the animated bones of the dead.' },
    { name: 'Zombie', size: 'Medium', type: 'undead', alignment: 'Neutral Evil', armor_class: 8, armor_type: '', hit_points: 22, hit_dice: '3d8+9', speed: '20 ft.', strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5, challenge_rating: '1/4', xp: 50, actions: '[{"name":"Slam","attack":"+3 to hit","damage":"1d6+1 bludgeoning"}]', description: 'Zombies are mindless undead that shamble endlessly.' },
    { name: 'Bandit', size: 'Medium', type: 'humanoid', alignment: 'Any non-lawful', armor_class: 12, armor_type: 'leather', hit_points: 11, hit_dice: '2d8+2', speed: '30 ft.', strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10, challenge_rating: '1/8', xp: 25, actions: '[{"name":"Scimitar","attack":"+3 to hit","damage":"1d6+1 slashing"}]', description: 'Bandits are outlaws who live by plunder.' },
    { name: 'Guard', size: 'Medium', type: 'humanoid', alignment: 'Any alignment', armor_class: 16, armor_type: 'chain shirt', hit_points: 11, hit_dice: '2d8+2', speed: '30 ft.', strength: 13, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 11, charisma: 10, challenge_rating: '1/8', xp: 25, actions: '[{"name":"Spear","attack":"+3 to hit","damage":"1d6+1 piercing"}]', description: 'Guards are professional soldiers who protect settlements.' },
    { name: 'Wolf', size: 'Medium', type: 'beast', alignment: 'Unaligned', armor_class: 13, armor_type: 'natural', hit_points: 11, hit_dice: '2d8+2', speed: '40 ft.', strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6, challenge_rating: '1/4', xp: 50, skills: '{"Perception":3,"Stealth":4}', actions: '[{"name":"Bite","attack":"+4 to hit","damage":"2d4+2 piercing"},{"name":"Pack Tactics":"Advantage on attack roll if an ally is within 5 ft of target"}]', description: 'Wolves are pack hunters that pursue prey to the death.' },
    { name: 'Dire Wolf', size: 'Large', type: 'beast', alignment: 'Unaligned', armor_class: 14, armor_type: 'natural', hit_points: 37, hit_dice: '5d10+10', speed: '50 ft.', strength: 17, dexterity: 15, constitution: 15, intelligence: 3, wisdom: 12, charisma: 7, challenge_rating: '1', xp: 200, skills: '{"Perception":3,"Stealth":4}', actions: '[{"name":"Bite","attack":"+5 to hit","damage":"2d6+3 piercing"}]', description: 'Dire wolves are monstrous, fearsome predators.' },
    { name: 'Giant Spider', size: 'Large', type: 'beast', alignment: 'Unaligned', armor_class: 14, armor_type: 'natural', hit_points: 26, hit_dice: '4d10+4', speed: '30 ft., climb 30 ft.', strength: 14, dexterity: 16, constitution: 12, intelligence: 2, wisdom: 11, charisma: 4, challenge_rating: '1', xp: 200, senses: 'Blindsight 10 ft., Web Sense 60 ft.', actions: '[{"name":"Bite","attack":"+5 to hit","damage":"1d8+3 piercing plus 2d6 poison"},{"name":"Web","attack":"Ranged","damage":"Restrains"}]', description: 'Giant spiders are monstrous arachnids that hunt prey with deadly poison.' },
    { name: 'Ogre', size: 'Large', type: 'giant', alignment: 'Chaotic Evil', armor_class: 11, armor_type: 'hide', hit_points: 59, hit_dice: '7d10+21', speed: '40 ft.', strength: 19, dexterity: 8, constitution: 16, intelligence: 5, wisdom: 7, charisma: 7, challenge_rating: '2', xp: 450, actions: '[{"name":"Greatclub","attack":"+7 to hit","damage":"2d8+4 bludgeoning"},{"name":"Javelin","attack":"+7 to hit","damage":"2d6+4 piercing"}]', description: 'Ogres are brutal giants that smash everything in their path.' },
    { name: 'Orc', size: 'Medium', type: 'humanoid', alignment: 'Chaotic Evil', armor_class: 13, armor_type: 'hide', hit_points: 15, hit_dice: '2d8+6', speed: '30 ft.', strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10, challenge_rating: '1/2', xp: 100, actions: '[{"name":"Greataxe","attack":"+5 to hit","damage":"1d12+3 slashing"},{"name":"Javelin","attack":"+5 to hit","damage":"1d6+3 piercing"}]', description: 'Orcs are savage raiders and pillagers with stooped postures and low foreheads.' },
    { name: 'Bugbear', size: 'Medium', type: 'humanoid', alignment: 'Chaotic Evil', armor_class: 16, armor_type: 'hide', hit_points: 27, hit_dice: '5d8+5', speed: '30 ft., climb 30 ft.', strength: 15, dexterity: 14, constitution: 13, intelligence: 8, wisdom: 11, charisma: 9, challenge_rating: '1', xp: 200, skills: '{"Stealth":6,"Survival":2}', actions: '[{"name":"Morningstar","attack":"+4 to hit","damage":"1d8+2 piercing"},{"name":"Javelin","attack":"+4 to hit","damage":"1d6+2 piercing"}]', description: 'Bugbears are brutal goblinoids that enjoy violence and treasure.' },
    { name: 'Owlbear', size: 'Large', type: 'monstrosity', alignment: 'Unaligned', armor_class: 13, armor_type: 'natural', hit_points: 59, hit_dice: '7d10+21', speed: '40 ft.', strength: 20, dexterity: 12, constitution: 17, intelligence: 3, wisdom: 12, charisma: 7, challenge_rating: '3', xp: 700, skills: '{"Perception":3}', actions: '[{"name":"Beak","attack":"+7 to hit","damage":"1d10+5 piercing"},{"name":"Claw","attack":"+7 to hit","damage":"2d6+5 slashing"}]', description: 'The owlbear is a magical cross between an owl and a bear.' },
    { name: 'Troll', size: 'Large', type: 'giant', alignment: 'Chaotic Evil', armor_class: 15, armor_type: 'natural', hit_points: 84, hit_dice: '8d10+40', speed: '40 ft.', strength: 18, dexterity: 13, constitution: 20, intelligence: 7, wisdom: 9, charisma: 7, challenge_rating: '5', xp: 1800, regen: 'Regeneration 5', actions: '[{"name":"Bite","attack":"+7 to hit","damage":"1d10+4 piercing"},{"name":"Claw","attack":"+7 to hit","damage":"1d6+4 slashing"}]', description: 'Trolls are terrifying predators that can regenerate from wounds.' },
    { name: 'Dragon, Wyrmling (Red)', size: 'Medium', type: 'dragon', alignment: 'Chaotic Evil', armor_class: 17, armor_type: 'scale', hit_points: 45, hit_dice: '7d8+14', speed: '30 ft., climb 30 ft., fly 60 ft.', strength: 19, dexterity: 14, constitution: 18, intelligence: 10, wisdom: 11, charisma: 15, challenge_rating: '4', xp: 1100, senses: 'Blindsight 30 ft., Darkvision 60 ft.', damage_immunities: 'fire', actions: '[{"name":"Bite","attack":"+6 to hit","damage":"1d10+4 piercing plus 2d6 fire"},{"name":"Fire Breath","attack":"DC 13","damage":"3d6 fire"}]', description: 'Red dragons are the most covetous of the true dragons.' },
    { name: 'Beholder', size: 'Large', type: 'aberration', alignment: 'Lawful Evil', armor_class: 18, armor_type: 'natural', hit_points: 180, hit_dice: '19d10+76', speed: '0 ft., fly 20 ft. (hover)', strength: 10, dexterity: 14, constitution: 18, intelligence: 17, wisdom: 15, charisma: 17, challenge_rating: '13', xp: 10000, senses: 'Darkvision 120 ft., Truesight 120 ft.', actions: '[{"name":"Eye Rays","attack":"+7 to hit","damage":"Various"},{"name":"Eye of the Beholder","attack":"Central eye"}]', description: 'The beholder is a terrifying spherical aberration with a massive central eye.' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO monsters (
      name, size, type, alignment, armor_class, armor_type, hit_points, hit_dice,
      speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
      challenge_rating, xp, actions, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  monsters.forEach(monster => {
    stmt.run(
      monster.name, monster.size, monster.type, monster.alignment,
      monster.armor_class, monster.armor_type, monster.hit_points, monster.hit_dice,
      monster.speed, monster.strength, monster.dexterity, monster.constitution,
      monster.intelligence, monster.wisdom, monster.charisma,
      monster.challenge_rating, monster.xp, monster.actions, monster.description
    );
  });

  console.log(`Seeded ${monsters.length} monsters`);
}

// Helper to seed conditions
function seedConditions() {
  const conditions = [
    { name: 'Blinded', description: 'A blinded creature can\'t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.', blocks: null },
    { name: 'Charmed', description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.', blocks: null },
    { name: 'Deafened', description: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.', blocks: null },
    { name: 'Exhaustion', description: 'Some special abilities and environmental hazards, such as starvation and the long-term effects of freezing or scorching temperatures, can lead to a condition called exhaustion. Exhaustion is measured in six levels.', blocks: null },
    { name: 'Frightened', description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can\'t willingly move closer to the source of its fear.', blocks: null },
    { name: 'Grappled', description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if the creature is pulled out of the grappler\'s reach.', blocks: null },
    { name: 'Incapacitated', description: 'An incapacitated creature can\'t take actions or reactions.', blocks: null },
    { name: 'Invisible', description: 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.', blocks: null },
    { name: 'Paralyzed', description: 'A paralyzed creature is incapacitated (see the condition) and can\'t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', blocks: null },
    { name: 'Petrified', description: 'A petrified creature is transformed, along with any nonmagical objects it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.', blocks: null },
    { name: 'Poisoned', description: 'A poisoned creature has disadvantage on attack rolls and ability checks.', blocks: null },
    { name: 'Prone', description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.', blocks: null },
    { name: 'Restrained', description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage. Dexterity saving throws have disadvantage.', blocks: null },
    { name: 'Stunned', description: 'A stunned creature is incapacitated (see the condition), can\'t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.', blocks: null },
    { name: 'Unconscious', description: 'An unconscious creature is incapacitated (see the condition), can\'t move or speak, and is unaware of its surroundings. The creature drops whatever it\'s holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', blocks: null },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO conditions (name, description, source)
    VALUES (?, ?, 'rule')
  `);

  conditions.forEach(cond => {
    stmt.run(cond.name, cond.description);
  });

  console.log(`Seeded ${conditions.length} conditions`);
}

// Helper to seed translations
function seedTranslations() {
  const translations = [
    // English translations
    { language: 'en', key: 'app.title', value: 'D&D 5e Tabletop RPG' },
    { language: 'en', key: 'nav.characters', value: 'Characters' },
    { language: 'en', key: 'nav.combat', value: 'Combat' },
    { language: 'en', key: 'nav.map', value: 'World Map' },
    { language: 'en', key: 'nav.campaigns', value: 'Campaigns' },
    { language: 'en', key: 'nav.ai', value: 'AI Game Master' },
    { language: 'en', key: 'auth.login', value: 'Login' },
    { language: 'en', key: 'auth.register', value: 'Register' },
    { language: 'en', key: 'auth.logout', value: 'Logout' },
    { language: 'en', key: 'character.create', value: 'Create Character' },
    { language: 'en', key: 'character.name', value: 'Name' },
    { language: 'en', key: 'character.race', value: 'Race' },
    { language: 'en', key: 'character.class', value: 'Class' },
    { language: 'en', key: 'character.level', value: 'Level' },
    { language: 'en', key: 'character.hp', value: 'Hit Points' },
    { language: 'en', key: 'character.ac', value: 'Armor Class' },
    { language: 'en', key: 'stats.strength', value: 'Strength' },
    { language: 'en', key: 'stats.dexterity', value: 'Dexterity' },
    { language: 'en', key: 'stats.constitution', value: 'Constitution' },
    { language: 'en', key: 'stats.intelligence', value: 'Intelligence' },
    { language: 'en', key: 'stats.wisdom', value: 'Wisdom' },
    { language: 'en', key: 'stats.charisma', value: 'Charisma' },
    { language: 'en', key: 'combat.start', value: 'Start Combat' },
    { language: 'en', key: 'combat.attack', value: 'Attack' },
    { language: 'en', key: 'combat.spell', value: 'Cast Spell' },
    { language: 'en', key: 'combat.end', value: 'End Combat' },
    { language: 'en', key: 'map.explore', value: 'Explore' },
    { language: 'en', key: 'map.travel', value: 'Travel' },
    { language: 'en', key: 'dice.roll', value: 'Roll Dice' },
    { language: 'en', key: 'button.save', value: 'Save' },
    { language: 'en', key: 'button.cancel', value: 'Cancel' },
    { language: 'en', key: 'button.delete', value: 'Delete' },
    { language: 'en', key: 'button.edit', value: 'Edit' },

    // Polish translations
    { language: 'pl', key: 'app.title', value: 'D&D 5e Tabletop RPG' },
    { language: 'pl', key: 'nav.characters', value: 'Postacie' },
    { language: 'pl', key: 'nav.combat', value: 'Walka' },
    { language: 'pl', key: 'nav.map', value: 'Mapa Świata' },
    { language: 'pl', key: 'nav.campaigns', value: 'Kampanie' },
    { language: 'pl', key: 'nav.ai', value: 'AI Mistrz Gry' },
    { language: 'pl', key: 'auth.login', value: 'Zaloguj' },
    { language: 'pl', key: 'auth.register', value: 'Zarejestruj' },
    { language: 'pl', key: 'auth.logout', value: 'Wyloguj' },
    { language: 'pl', key: 'character.create', value: 'Stwórz Postać' },
    { language: 'pl', key: 'character.name', value: 'Imię' },
    { language: 'pl', key: 'character.race', value: 'Rasa' },
    { language: 'pl', key: 'character.class', value: 'Klasa' },
    { language: 'pl', key: 'character.level', value: 'Poziom' },
    { language: 'pl', key: 'character.hp', value: 'Punkty Życia' },
    { language: 'pl', key: 'character.ac', value: 'Klasa Pancerza' },
    { language: 'pl', key: 'stats.strength', value: 'Siła' },
    { language: 'pl', key: 'stats.dexterity', value: 'Zręczność' },
    { language: 'pl', key: 'stats.constitution', value: 'Kondycja' },
    { language: 'pl', key: 'stats.intelligence', value: 'Inteligencja' },
    { language: 'pl', key: 'stats.wisdom', value: 'Mądrość' },
    { language: 'pl', key: 'stats.charisma', value: 'Charyzma' },
    { language: 'pl', key: 'combat.start', value: 'Rozpocznij Walkę' },
    { language: 'pl', key: 'combat.attack', value: 'Atak' },
    { language: 'pl', key: 'combat.spell', value: 'Rzuc Zaklęcie' },
    { language: 'pl', key: 'combat.end', value: 'Zakończ Walkę' },
    { language: 'pl', key: 'map.explore', value: 'Eksploruj' },
    { language: 'pl', key: 'map.travel', value: 'Podróżuj' },
    { language: 'pl', key: 'dice.roll', value: 'Rzuć Kośćmi' },
    { language: 'pl', key: 'button.save', value: 'Zapisz' },
    { language: 'pl', key: 'button.cancel', value: 'Anuluj' },
    { language: 'pl', key: 'button.delete', value: 'Usuń' },
    { language: 'pl', key: 'button.edit', value: 'Edytuj' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO translations (language, key, value)
    VALUES (?, ?, ?)
  `);

  translations.forEach(trans => {
    stmt.run(trans.language, trans.key, trans.value);
  });

  console.log(`Seeded ${translations.length} translations`);
}

// Run seeding
seedItems();
seedSpells();
seedMonsters();
seedConditions();
seedTranslations();

console.log('Database seeding complete!');