const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Get all campaigns for a user
router.get('/user/:userId', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT c.*, u.username as gm_username,
        (SELECT COUNT(*) FROM campaign_players WHERE campaign_id = c.id) as player_count
      FROM campaigns c
      JOIN users u ON c.gm_id = u.id
      WHERE c.id IN (
        SELECT campaign_id FROM campaign_players WHERE user_id = ?
      ) OR c.gm_id = ?
      ORDER BY c.is_active DESC, c.created_at DESC
    `).all(req.params.userId, req.params.userId);
    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single campaign
router.get('/:id', (req, res) => {
  try {
    const campaign = db.prepare(`
      SELECT c.*, u.username as gm_username
      FROM campaigns c
      JOIN users u ON c.gm_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const players = db.prepare(`
      SELECT cp.*, u.username, u.email
      FROM campaign_players cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.campaign_id = ?
    `).all(campaign.id);

    const characters = db.prepare(`
      SELECT * FROM characters WHERE campaign_id = ?
    `).all(campaign.id);

    // Get map regions
    const regions = db.prepare(`
      SELECT * FROM map_regions WHERE campaign_id = ?
    `).all(campaign.id);

    res.json({ ...campaign, players, characters, regions });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create campaign
router.post('/', (req, res) => {
  try {
    const { name, description, gmId, language } = req.body;

    if (!name || !gmId) {
      return res.status(400).json({ error: 'Name and GM required' });
    }

    const result = db.prepare(`
      INSERT INTO campaigns (name, description, gm_id, language)
      VALUES (?, ?, ?, ?)
    `).run(name, description || null, gmId, language || 'en');

    const campaignId = result.lastInsertRowid;

    // Add GM as first player
    db.prepare(`
      INSERT INTO campaign_players (campaign_id, user_id)
      VALUES (?, ?)
    `).run(campaignId, gmId);

    // Create initial world map region
    db.prepare(`
      INSERT INTO map_regions (campaign_id, name, description, biome, danger_level)
      VALUES (?, 'The Known World', 'A vast and dangerous land awaites exploration.', 'forest', 1)
    `).run(campaignId);

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update campaign
router.put('/:id', (req, res) => {
  try {
    const { name, description, isActive, language } = req.body;
    
    db.prepare(`
      UPDATE campaigns 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          is_active = COALESCE(?, is_active),
          language = COALESCE(?, language)
      WHERE id = ?
    `).run(name, description, isActive, language, req.params.id);

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    res.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join campaign
router.post('/:id/join', (req, res) => {
  try {
    const { userId } = req.body;
    const campaignId = req.params.id;

    // Check if already a player
    const existing = db.prepare(
      'SELECT * FROM campaign_players WHERE campaign_id = ? AND user_id = ?'
    ).get(campaignId, userId);

    if (existing) {
      return res.status(400).json({ error: 'Already in campaign' });
    }

    db.prepare(`
      INSERT INTO campaign_players (campaign_id, user_id)
      VALUES (?, ?)
    `).run(campaignId, userId);

    // Notify via socket
    const io = req.app.get('io');
    io.to(`campaign-${campaignId}`).emit('player-joined-campaign', {
      userId,
      campaignId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Join campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave campaign
router.post('/:id/leave', (req, res) => {
  try {
    const { userId } = req.body;
    const campaignId = req.params.id;

    db.prepare(
      'DELETE FROM campaign_players WHERE campaign_id = ? AND user_id = ?'
    ).run(campaignId, userId);

    // Notify via socket
    const io = req.app.get('io');
    io.to(`campaign-${campaignId}`).emit('player-left-campaign', {
      userId,
      campaignId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Leave campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Kick player (GM only)
router.delete('/:id/players/:playerId', (req, res) => {
  try {
    const campaignId = req.params.id;
    const playerId = req.params.playerId;

    // Get campaign to verify GM
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Can't kick GM
    if (campaign.gm_id === parseInt(playerId)) {
      return res.status(400).json({ error: 'Cannot kick GM' });
    }

    db.prepare(
      'DELETE FROM campaign_players WHERE campaign_id = ? AND user_id = ?'
    ).run(campaignId, playerId);

    // Notify via socket
    const io = req.app.get('io');
    io.to(`campaign-${campaignId}`).emit('player-kicked', {
      userId: playerId,
      campaignId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Kick player error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete campaign
router.delete('/:id', (req, res) => {
  try {
    const campaignId = req.params.id;

    // Delete related data
    db.prepare('DELETE FROM map_locations WHERE region_id IN (SELECT id FROM map_regions WHERE campaign_id = ?)').run(campaignId);
    db.prepare('DELETE FROM map_regions WHERE campaign_id = ?').run(campaignId);
    db.prepare('DELETE FROM combat_encounters WHERE campaign_id = ?').run(campaignId);
    db.prepare('DELETE FROM campaign_players WHERE campaign_id = ?').run(campaignId);
    db.prepare('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM campaign_players WHERE campaign_id = ?)').run(campaignId);
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;