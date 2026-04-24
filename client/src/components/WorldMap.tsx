import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore, apiCall } from '../store/gameStore';

interface MapRegion {
  id: number;
  name: string;
  description: string;
  biome: string;
  danger_level: number;
  locations: MapLocation[];
}

interface MapLocation {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  description: string;
  is_discovered: number;
}

interface MapTile {
  x: number;
  y: number;
  type: string;
  explored: boolean;
  fog: boolean;
}

const TILE_SIZE = 16;
const MAP_WIDTH = 32;
const MAP_HEIGHT = 24;

export default function WorldMap() {
  const { t } = useTranslation();
  const { currentCampaign } = useGameStore();
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 16, y: 12 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCampaign) {
      loadMap();
    }
  }, [currentCampaign]);

  const loadMap = async () => {
    if (!currentCampaign) return;
    try {
      // Load regions
      const regions = await apiCall<MapRegion[]>(`/maps/regions/${currentCampaign}`);
      if (regions.length > 0) {
        setRegion(regions[0]);
        
        // Load locations
        const regionData = await apiCall<MapRegion>(`/maps/regions/${currentCampaign}/${regions[0].id}`);
        setRegion(regionData);
      }
      
      // Generate procedural tiles
      generateTiles();
    } catch (err) {
      console.error('Failed to load map:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTiles = () => {
    const newTiles: MapTile[] = [];
    const seed = Math.random();
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const noise = Math.sin(x * 0.15 + seed) * Math.cos(y * 0.15 + seed);
        let tileType = 'grass';
        
        if (noise > 0.5) tileType = 'mountain';
        else if (noise > 0.3) tileType = 'forest';
        else if (noise > 0.15) tileType = 'water';
        
        // Distance from center affects exploration
        const dist = Math.sqrt(Math.pow(x - MAP_WIDTH/2, 2) + Math.pow(y - MAP_HEIGHT/2, 2));
        const explored = dist < 8;
        
        newTiles.push({ x, y, type: tileType, explored, fog: !explored });
      }
    }
    setTiles(newTiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newX = playerPos.x;
    let newY = playerPos.y;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        newY = Math.max(0, playerPos.y - 1);
        break;
      case 'ArrowDown':
      case 's':
        newY = Math.min(MAP_HEIGHT - 1, playerPos.y + 1);
        break;
      case 'ArrowLeft':
      case 'a':
        newX = Math.max(0, playerPos.x - 1);
        break;
      case 'ArrowRight':
      case 'd':
        newX = Math.min(MAP_WIDTH - 1, playerPos.x + 1);
        break;
    }
    
    // Check for blocking terrain
    const targetTile = tiles.find(t => t.x === newX && t.y === newY);
    if (targetTile && targetTile.type !== 'water' && targetTile.type !== 'mountain') {
      setPlayerPos({ x: newX, y: newY });
      
      // Explore nearby tiles
      const updatedTiles = tiles.map(tile => {
        const dist = Math.sqrt(Math.pow(tile.x - newX, 2) + Math.pow(tile.y - newY, 2));
        if (dist < 4) {
          return { ...tile, explored: true, fog: false };
        }
        return tile;
      });
      setTiles(updatedTiles);
    }
  };

  const getTileColor = (tile: MapTile) => {
    if (tile.fog) return 'var(--gb-dark)';
    
    switch (tile.type) {
      case 'grass': return 'var(--gb-light)';
      case 'forest': return 'var(--gb-dark)';
      case 'water': return '#4a90d9';
      case 'mountain': return 'var(--gb-darkest)';
      default: return 'var(--gb-light)';
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  if (!currentCampaign) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p>Join or create a campaign first to explore the world map.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>{t('nav.map')}</h2>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Map */}
        <div 
          className="map-container" 
          style={{ 
            width: MAP_WIDTH * TILE_SIZE, 
            height: MAP_HEIGHT * TILE_SIZE,
            position: 'relative'
          }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {tiles.map((tile, i) => (
            <div
              key={i}
              className={`map-tile ${tile.type}`}
              style={{
                left: tile.x * TILE_SIZE,
                top: tile.y * TILE_SIZE,
                backgroundColor: getTileColor(tile),
                opacity: tile.fog ? 0.3 : 1
              }}
            />
          ))}
          
          {/* Player marker */}
          <div
            style={{
              position: 'absolute',
              left: playerPos.x * TILE_SIZE,
              top: playerPos.y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: '#ff6b6b',
              borderRadius: '50%',
              border: '2px solid white',
              zIndex: 10,
              transition: 'all 0.2s'
            }}
          />
        </div>

        {/* Info Panel */}
        <div style={{ flex: 1 }}>
          <div className="card">
            <div className="card-header">Exploration</div>
            <p>Use WASD or Arrow keys to move.</p>
            <p style={{ marginTop: '10px' }}>
              {tiles.filter(t => t.explored).length} / {tiles.length} tiles explored
            </p>
          </div>

          {region && region.locations && region.locations.length > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">Points of Interest</div>
              {region.locations.map(loc => (
                <div 
                  key={loc.id} 
                  style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid var(--gb-light)',
                    opacity: loc.is_discovered ? 1 : 0.5
                  }}
                >
                  <strong>{loc.name}</strong> ({loc.type})
                  {loc.is_discovered ? (
                    <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>{loc.description}</p>
                  ) : (
                    <p style={{ fontSize: '0.8rem', marginTop: '5px', color: 'var(--gb-light)' }}>
                      Undiscovered
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">Legend</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 16, height: 16, background: 'var(--gb-light)' }} />
                <span style={{ fontSize: '0.8rem' }}>Grass</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 16, height: 16, background: 'var(--gb-dark)' }} />
                <span style={{ fontSize: '0.8rem' }}>Forest</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 16, height: 16, background: '#4a90d9' }} />
                <span style={{ fontSize: '0.8rem' }}>Water</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 16, height: 16, background: 'var(--gb-darkest)' }} />
                <span style={{ fontSize: '0.8rem' }}>Mountain</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}