const express = require('express');
const db = require('../db/database');

const router = express.Router();

// LM Studio uses OpenAI-compatible API on port 1234
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1';
const DEFAULT_MODEL = process.env.LLM_MODEL || 'llama3.2:7b';

// Helper: Get recent session history for RAG context
function getSessionContext(campaignId, limit = 10) {
  const history = db.prepare(`
    SELECT * FROM session_history 
    WHERE campaign_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(campaignId, limit);

  return history.reverse().map(h => ({
    type: h.event_type,
    content: h.content,
    timestamp: h.timestamp
  }));
}

// Helper: Get relevant NPCs for context
function getNPCContext(campaignId) {
  return db.prepare(`
    SELECT name, description, personality, is_hostile
    FROM npcs
    WHERE campaign_id = ?
    LIMIT 5
  `).all(campaignId);
}

// Helper: Get game variables
function getGameVariables(campaignId) {
  const vars = db.prepare(`
    SELECT key, value FROM game_variables WHERE campaign_id = ?
  `).all(campaignId);
  
  return vars.reduce((acc, v) => {
    acc[v.key] = v.value;
    return acc;
  }, {});
}

// Helper: Get campaign characters (heroes)
function getCampaignCharacters(campaignId) {
  return db.prepare(`
    SELECT c.name, c.race, c.class, c.level, c.hp, c.max_hp, c.ac, c.x, c.y
    FROM characters c
    WHERE c.campaign_id = ?
  `).all(campaignId);
}

// Helper: Get current map location
function getCurrentLocation(campaignId) {
  const loc = db.prepare(`
    SELECT ml.name, ml.type, ml.description
    FROM map_locations ml
    JOIN campaign_players cp ON cp.campaign_id = ?
    WHERE ml.x = COALESCE((SELECT value FROM game_variables WHERE campaign_id = ? AND key = 'player_x'), 16)
      AND ml.y = COALESCE((SELECT value FROM game_variables WHERE campaign_id = ? AND key = 'player_y'), 16)
    LIMIT 1
  `).get(campaignId, campaignId, campaignId);
  
  if (loc) return loc;
  
  // Return default region if no specific location
  return db.prepare(`
    SELECT name, 'region' as type, description
    FROM map_regions WHERE campaign_id = ?
    LIMIT 1
  `).get(campaignId);
}

// Helper: Get active encounters
function getActiveEncounters(campaignId) {
  return db.prepare(`
    SELECT ce.id, ce.name, ce.status, ce.current_round
    FROM combat_encounters ce
    WHERE ce.campaign_id = ? AND ce.status = 'active'
  `).all(campaignId);
}

// LM Studio API call (OpenAI-compatible)
async function callLMStudio(prompt, model = DEFAULT_MODEL, system = null) {
  try {
    const messages = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${LM_STUDIO_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('LM Studio call error:', error);
    return null;
  }
}

// Check LM Studio status
router.get('/status', async (req, res) => {
  try {
    const response = await fetch(`${LM_STUDIO_URL}/models`);
    if (response.ok) {
      const data = await response.json();
      res.json({ 
        status: 'online', 
        models: data.data,
        defaultModel: DEFAULT_MODEL 
      });
    } else {
      res.json({ status: 'offline' });
    }
  } catch (error) {
    res.json({ status: 'offline', error: error.message });
  }
});

// Generate AI response for NPC
router.post('/npc', async (req, res) => {
  try {
    const { npcId, message, campaignId, conversationHistory } = req.body;

    const npc = db.prepare('SELECT * FROM npcs WHERE id = ?').get(npcId);
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // Build context
    let context = `You are playing the character of ${npc.name}.`;
    if (npc.description) {
      context += `\n\nAppearance: ${npc.description}`;
    }
    if (npc.personality) {
      context += `\n\nPersonality: ${npc.personality}`;
    }
    context += `\n\nRespond in character as this NPC. Keep responses relatively brief (1-3 sentences).`;

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      context += '\n\nRecent conversation:\n';
      conversationHistory.slice(-5).forEach(msg => {
        context += `${msg.speaker}: ${msg.text}\n`;
      });
    }

    context += `\n\nPlayer: ${message}\n\n${npc.name}:`;

    const response = await callLMStudio(context);

    // Save to session history
    if (campaignId) {
      db.prepare(`
        INSERT INTO session_history (campaign_id, event_type, content, actors, importance)
        VALUES (?, 'social', ?, ?, 2)
      `).run(campaignId, `${npc.name}: ${response}`, JSON.stringify([npc.name]));
    }

    res.json({ 
      npc: npc.name, 
      response,
      personality: npc.personality
    });
  } catch (error) {
    console.error('NPC AI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// AI Game Master
router.post('/gm', async (req, res) => {
  try {
    const { campaignId, action, context: customContext } = req.body;

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all context data
    const sessionHistory = getSessionContext(campaignId, 15);
    const npcs = getNPCContext(campaignId);
    const gameVars = getGameVariables(campaignId);
    const heroes = getCampaignCharacters(campaignId);
    const currentLocation = getCurrentLocation(campaignId);
    const activeEncounters = getActiveEncounters(campaignId);

    // Build system prompt
    let systemPrompt = `You are the Game Master for a D&D 5e campaign.
Campaign: ${campaign.name}
${campaign.description ? `Description: ${campaign.description}` : ''}

Language: ${campaign.language === 'pl' ? 'Polish' : 'English'}

Your role is to:
1. Narrate the world and describe what happens
2. Play NPCs and monsters
3. Run combat encounters fairly
4. Track game state and remember important details
5. Be creative, descriptive, and engaging

Keep responses appropriate to the situation - brief for combat, detailed for exploration, characterful for social encounters.`;

    // Add heroes (party members)
    if (heroes.length > 0) {
      systemPrompt += '\n\nParty Heroes:\n';
      heroes.forEach(h => {
        systemPrompt += `- ${h.name}: Level ${h.level} ${h.race} ${h.class} (HP: ${h.hp}/${h.max_hp}, AC: ${h.ac})\n`;
      });
    }

    // Add current location
    if (currentLocation) {
      systemPrompt += `\nCurrent Location: ${currentLocation.name} (${currentLocation.type || 'area'})\n`;
      if (currentLocation.description) {
        systemPrompt += `Description: ${currentLocation.description}\n`;
      }
    }

    // Add active encounters
    if (activeEncounters.length > 0) {
      systemPrompt += '\nActive Encounters:\n';
      activeEncounters.forEach(e => {
        systemPrompt += `- ${e.name} (Round ${e.current_round}, Status: ${e.status})\n`;
      });
    }

    // Add recent history context
    if (sessionHistory.length > 0) {
      systemPrompt += '\n\nRecent events:\n';
      sessionHistory.forEach(h => {
        systemPrompt += `[${h.type}] ${h.content.substring(0, 200)}\n`;
      });
    }

    // Add NPCs
    if (npcs.length > 0) {
      systemPrompt += '\n\nNPCs in this campaign:\n';
      npcs.forEach(npc => {
        systemPrompt += `- ${npc.name}: ${npc.description || 'Unknown'} (${npc.is_hostile ? 'hostile' : 'friendly'})\n`;
      });
    }

    // Add game state
    if (Object.keys(gameVars).length > 0) {
      systemPrompt += '\n\nCurrent game state:\n';
      Object.entries(gameVars).forEach(([key, value]) => {
        systemPrompt += `- ${key}: ${value}\n`;
      });
    }

    // Build user prompt
    let userPrompt = '';
    
    if (customContext) {
      userPrompt = customContext;
    } else {
      userPrompt = `Player action: ${action}\n\nProvide your response as the Game Master:`;
    }

    const response = await callLMStudio(userPrompt, DEFAULT_MODEL, systemPrompt);

    // Save to session history
    db.prepare(`
      INSERT INTO session_history (campaign_id, event_type, content, importance)
      VALUES (?, 'narrative', ?, 3)
    `).run(campaignId, response.substring(0, 500));

    res.json({
      gm: response,
      context: { 
        sessionLength: sessionHistory.length, 
        npcs: npcs.length,
        heroes: heroes.length,
        location: currentLocation?.name || 'Unknown',
        activeEncounters: activeEncounters.length
      }
    });
  } catch (error) {
    console.error('GM AI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Generate encounter
router.post('/encounter', async (req, res) => {
  try {
    const { partyLevel, difficulty, partySize, environment } = req.body;

    const systemPrompt = `You are a D&D 5e encounter generator. Generate an appropriate combat encounter based on the parameters provided.
Output a JSON array of monsters with name, CR, and quantity.
Consider:
- Party size and level for XP calculations
- Difficulty: easy, medium, hard, deadly
- Environment hints creature selection`;

    const userPrompt = `Generate a ${difficulty || 'medium'} encounter for:
- Party Level: ${partyLevel || 5}
- Party Size: ${partySize || 4}
- Environment: ${environment || 'dungeon'}

Output format (JSON array):
[{"name": "Goblin", "cr": "1/4", "quantity": 3}, ...]`;

    const response = await callLMStudio(userPrompt, DEFAULT_MODEL, systemPrompt);

    try {
      const monsters = JSON.parse(response);
      res.json({ monsters });
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      res.json({ 
        monsters: [
          { name: 'Goblin', cr: '1/4', quantity: 3 },
          { name: 'Wolf', cr: '1/4', quantity: 2 }
        ],
        raw: response
      });
    }
  } catch (error) {
    console.error('Encounter generation error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Save session event
router.post('/history', (req, res) => {
  try {
    const { campaignId, eventType, content, actors, location, importance } = req.body;

    db.prepare(`
      INSERT INTO session_history (campaign_id, event_type, content, actors, location, importance)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(campaignId, eventType, content, actors, location, importance || 1);

    res.json({ success: true });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get session history
router.get('/history/:campaignId', (req, res) => {
  try {
    const { eventType, limit } = req.query;
    
    let query = 'SELECT * FROM session_history WHERE campaign_id = ?';
    const params = [req.params.campaignId];

    if (eventType) {
      query += ' AND event_type = ?';
      params.push(eventType);
    }

    query += ' ORDER BY timestamp DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const history = db.prepare(query).all(...params);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;