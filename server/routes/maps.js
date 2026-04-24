const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Get all regions for a campaign
router.get('/regions/:campaignId', (req, res) => {
  try {
    const regions = db.prepare(`
      SELECT mr.*, 
        (SELECT COUNT(*) FROM map_locations WHERE region_id = mr.id) as location_count
      FROM map_regions mr
      WHERE mr.campaign_id = ?
    `).all(req.params.campaignId);
    res.json(regions);
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single region with locations
router.get('/regions/:campaignId/:regionId', (req, res) => {
  try {
    const region = db.prepare('SELECT * FROM map_regions WHERE id = ?').get(req.params.regionId);
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    const locations = db.prepare(`
      SELECT ml.*, i.name as interior_name
      FROM map_locations ml
      LEFT JOIN interiors i ON ml.interior_map_id = i.id
      WHERE ml.region_id = ?
    `).all(region.id);

    res.json({ ...region, locations });
  } catch (error) {
    console.error('Get region error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create region
router.post('/regions', (req, res) => {
  try {
    const { campaignId, name, description, biome, dangerLevel, gridData } = req.body;

    const result = db.prepare(`
      INSERT INTO map_regions (campaign_id, name, description, biome, danger_level, grid_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(campaignId, name, description, biome || 'forest', dangerLevel || 1, gridData);

    const region = db.prepare('SELECT * FROM map_regions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(region);
  } catch (error) {
    console.error('Create region error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create location
router.post('/locations', (req, res) => {
  try {
    const { regionId, name, type, x, y, description, interiorMapId } = req.body;

    const result = db.prepare(`
      INSERT INTO map_locations (region_id, name, type, x, y, description, interior_map_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(regionId, name, type, x, y, description, interiorMapId);

    const location = db.prepare('SELECT * FROM map_locations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get location
router.get('/locations/:id', (req, res) => {
  try {
    const location = db.prepare(`
      SELECT ml.*, mr.name as region_name
      FROM map_locations ml
      JOIN map_regions mr ON ml.region_id = mr.id
      WHERE ml.id = ?
    `).get(req.params.id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Get interior if exists
    if (location.interior_map_id) {
      const interior = db.prepare('SELECT * FROM interiors WHERE id = ?').get(location.interior_map_id);
      location.interior = interior;
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Discover location
router.put('/locations/:id/discover', (req, res) => {
  try {
    db.prepare('UPDATE map_locations SET is_discovered = 1 WHERE id = ?').run(req.params.id);
    const location = db.prepare('SELECT * FROM map_locations WHERE id = ?').get(req.params.id);
    res.json(location);
  } catch (error) {
    console.error('Discover location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create interior
router.post('/interiors', (req, res) => {
  try {
    const { locationId, name, width, height, floor, tiles } = req.body;

    const result = db.prepare(`
      INSERT INTO interiors (location_id, name, width, height, floor, tiles)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(locationId, name, width || 10, height || 10, floor || 'stone', tiles);

    const interior = db.prepare('SELECT * FROM interiors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(interior);
  } catch (error) {
    console.error('Create interior error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate procedural map
router.post('/generate', (req, res) => {
  try {
    const { type, seed, width, height, biome } = req.params;

    const mapWidth = parseInt(width) || 32;
    const mapHeight = parseInt(height) || 32;
    const mapSeed = seed || Math.random();

    // Simple procedural generation
    const tiles = [];
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        // Simple noise-like generation
        const noise = Math.sin(x * 0.1 + mapSeed) * Math.cos(y * 0.1 + mapSeed);
        
        let tileType = 'grass';
        
        if (type === 'dungeon') {
          if (noise > 0.5) tileType = 'wall';
          else if (noise > 0.3) tileType = 'floor';
          else tileType = 'floor';
        } else {
          // Overworld
          if (noise > 0.6) tileType = 'mountain';
          else if (noise > 0.4) tileType = 'forest';
          else if (noise > 0.2) tileType = 'water';
          else tileType = 'grass';
        }

        tiles.push({
          x,
          y,
          type: tileType,
          explored: false,
          fog: true
        });
      }
    }

    res.json({
      width: mapWidth,
      height: mapHeight,
      seed: mapSeed,
      type,
      tiles
    });
  } catch (error) {
    console.error('Generate map error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;