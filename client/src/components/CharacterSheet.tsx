import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiCall } from '../store/gameStore';

interface Character {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  equipment?: Equipment[];
  inventory?: InventoryItem[];
  spells?: CharacterSpell[];
  computedStats?: ComputedStats;
}

interface Equipment {
  id: number;
  slot: string;
  name: string;
  type: string;
  damage?: string;
  damage_type?: string;
  armor_class?: string;
}

interface InventoryItem {
  id: number;
  quantity: number;
  name: string;
  type: string;
  weight: number;
  cost: string;
}

interface CharacterSpell {
  id: number;
  prepared: number;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  description: string;
}

interface ComputedStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  ac: number;
  maxHp: number;
  proficiencyBonus: number;
}

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'spells'>('stats');

  useEffect(() => {
    if (id) {
      loadCharacter();
    }
  }, [id]);

  const loadCharacter = async () => {
    try {
      const data = await apiCall<Character>(`/characters/${id}`);
      setCharacter(data);
    } catch (err) {
      console.error('Failed to load character:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  if (!character) {
    return <div className="card">{t('error')}</div>;
  }

  const stats = character.computedStats || {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
    ac: character.ac,
    maxHp: character.max_hp,
    proficiencyBonus: character.proficiency_bonus
  };

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ fontSize: '1.2rem' }}>
          {character.name}
        </div>
        <p>Level {character.level} {character.race} {character.class}</p>
        <p>XP: {character.experience}</p>
      </div>

      {/* Stats Grid */}
      <div className="character-sheet">
        {[
          { name: 'strength', value: stats.strength },
          { name: 'dexterity', value: stats.dexterity },
          { name: 'constitution', value: stats.constitution },
          { name: 'intelligence', value: stats.intelligence },
          { name: 'wisdom', value: stats.wisdom },
          { name: 'charisma', value: stats.charisma }
        ].map((stat) => (
          <div key={stat.name} className="stat-box">
            <div className="stat-name">{t(`stats.${stat.name}`)}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-modifier">
              {getModifier(stat.value) >= 0 ? '+' : ''}{getModifier(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Combat Stats */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-name">{t('character.hp')}</div>
          <div className="stat-value">{character.hp}</div>
          <div className="stat-modifier">/ {character.max_hp}</div>
          {character.temp_hp > 0 && (
            <div style={{ color: '#9bbc0f', marginTop: '5px' }}>+{character.temp_hp} temp</div>
          )}
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-name">{t('character.ac')}</div>
          <div className="stat-value">{stats.ac}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-name">Speed</div>
          <div className="stat-value">{character.speed}</div>
          <div className="stat-modifier">ft</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-name">Proficiency</div>
          <div className="stat-value">+{stats.proficiencyBonus}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          {t('character.equipment')}
        </button>
        <button 
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          {t('character.inventory')}
        </button>
        <button 
          className={`btn ${activeTab === 'spells' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('spells')}
        >
          {t('character.spells')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="card">
          <div className="card-header">{t('character.equipment')}</div>
          {character.equipment && character.equipment.length > 0 ? (
            <div>
              {character.equipment.map((item) => (
                <div key={item.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--gb-darkest)' }}>
                  <strong>{item.name}</strong> ({item.slot})
                  {item.damage && <div>Damage: {item.damage} {item.damage_type}</div>}
                  {item.armor_class && <div>AC: {item.armor_class}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p>No equipment</p>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="card">
          <div className="card-header">{t('character.inventory')}</div>
          {character.inventory && character.inventory.length > 0 ? (
            <div>
              {character.inventory.map((item) => (
                <div key={item.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--gb-darkest)' }}>
                  <strong>{item.name}</strong> x{item.quantity}
                  <div style={{ fontSize: '0.8rem', color: 'var(--gb-light)' }}>
                    {item.cost} | {item.weight} lbs
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No items in inventory</p>
          )}
        </div>
      )}

      {activeTab === 'spells' && (
        <div className="card">
          <div className="card-header">{t('character.spells')}</div>
          {character.spells && character.spells.length > 0 ? (
            <div>
              {character.spells.map((spell) => (
                <div key={spell.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--gb-darkest)' }}>
                  <strong>{spell.name}</strong> (Level {spell.level})
                  <div style={{ fontSize: '0.8rem', color: 'var(--gb-light)' }}>
                    {spell.school} | {spell.casting_time} | {spell.range}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                    {spell.description.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No spells known</p>
          )}
        </div>
      )}
    </div>
  );
}