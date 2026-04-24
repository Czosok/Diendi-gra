const express = require('express');
const db = require('../db/database');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:7b';

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

// Ollama API call
async function callOllama(prompt, model = DEFAULT_MODEL, system = null) {
  try {
    const body = {
      model,
      prompt,
      stream: false
    };
    
    if (system) {
      body.system = system;
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama call error:', error);
    return null;
  }
}

// Check Ollama status
router.get('/status', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      res.json({ 
        status: 'online', 
        models: data.models,
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

    const response = await callOllama(context);

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

    // Get session context
    const sessionHistory = getSessionContext(campaignId, 15);
    const npcs = getNPCContext(campaignId);
    const gameVars = getGameVariables(campaignId);

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

    const response = await callOllama(userPrompt, DEFAULT_MODEL, systemPrompt);

    // Save to session history
    db.prepare(`
      INSERT INTO session_history (campaign_id, event_type, content, importance)
      VALUES (?, 'narrative', ?, 3)
    `).run(campaignId, response.substring(0, 500));

    res.json({
      gm: response,
      context: { sessionLength: sessionHistory.length, npcs: npcs.length }
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

    const response = await callOllama(userPrompt, DEFAULT_MODEL, systemPrompt);

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