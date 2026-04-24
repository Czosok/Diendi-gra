import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useGameStore, apiCall } from '../store/gameStore';

interface Character {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  max_hp: number;
}

export default function CharacterList() {
  const { t } = useTranslation();
  const { user } = useGameStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  const loadCharacters = async () => {
    try {
      const data = await apiCall<Character[]>(`/characters?userId=${user?.id}`);
      setCharacters(data);
    } catch (err) {
      console.error('Failed to load characters:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('nav.characters')}</h2>
        <Link to="/characters/new" className="btn btn-primary">
          {t('character.create')}
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>{t('noCharacters')}</p>
        </div>
      ) : (
        <div className="card-grid">
          {characters.map((char) => (
            <Link 
              to={`/characters/${char.id}`} 
              key={char.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card">
                <div className="card-header">{char.name}</div>
                <div>
                  <p>Level {char.level} {char.race} {char.class}</p>
                  <div style={{ marginTop: '10px' }}>
                    <span>{t('character.hp')}: </span>
                    <span style={{ color: char.hp <= char.max_hp / 4 ? '#ff6b6b' : 'inherit' }}>
                      {char.hp}/{char.max_hp}
                    </span>
                  </div>
                  <div className="hp-bar" style={{ marginTop: '5px' }}>
                    <div 
                      className="hp-fill" 
                      style={{ width: `${(char.hp / char.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}