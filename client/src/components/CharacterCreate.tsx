import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore, apiCall } from '../store/gameStore';

const RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
];

const CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
];

const BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'
];

export default function CharacterCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useGameStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    race: 'Human',
    class: 'Fighter',
    background: 'Soldier',
    level: 1,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });

  const updateStat = (stat: string, value: number) => {
    setFormData(prev => ({ ...prev, [stat]: Math.max(8, Math.min(18, value)) }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const character = await apiCall<{ id: number }>('/characters', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          name: formData.name,
          race: formData.race,
          class: formData.class,
          background: formData.background,
          level: formData.level,
          ...formData
        })
      });

      navigate(`/characters/${character.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    return true;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>{t('character.create')}</h2>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            style={{
              flex: 1,
              padding: '10px',
              textAlign: 'center',
              background: step >= s ? 'var(--gb-light)' : 'var(--gb-dark)',
              color: step >= s ? 'var(--gb-darkest)' : 'var(--gb-lightest)'
            }}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Basic Info</h3>
            <div className="form-group">
              <label className="form-label">{t('character.name')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter character name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('character.race')}</label>
              <select
                className="form-select"
                value={formData.race}
                onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
              >
                {RACES.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('character.class')}</label>
              <select
                className="form-select"
                value={formData.class}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
              >
                {CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('character.background')}</label>
              <select
                className="form-select"
                value={formData.background}
                onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
              >
                {BACKGROUNDS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Ability Scores</h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '20px', color: 'var(--gb-light)' }}>
              Use point buy or standard array. Minimum 8, maximum 18.
            </p>
            
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => (
              <div key={stat} className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, width: '120px' }}>
                  {t(`stats.${stat}`)}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    className="btn"
                    onClick={() => updateStat(stat, formData[stat as keyof typeof formData] as number - 1)}
                    disabled={formData[stat as keyof typeof formData] <= 8}
                  >
                    -
                  </button>
                  <span style={{ width: '30px', textAlign: 'center' }}>{formData[stat as keyof typeof formData]}</span>
                  <button 
                    className="btn"
                    onClick={() => updateStat(stat, formData[stat as keyof typeof formData] as number + 1)}
                    disabled={formData[stat as keyof typeof formData] >= 18}
                  >
                    +
                  </button>
                  <span style={{ width: '40px', textAlign: 'center', color: 'var(--gb-light)' }}>
                    {Math.floor(((formData[stat as keyof typeof formData] as number) - 10) / 2) >= 0 ? '+' : ''}
                    {Math.floor(((formData[stat as keyof typeof formData] as number) - 10) / 2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Review</h3>
            <div style={{ background: 'var(--gb-darkest)', padding: '15px', marginBottom: '15px' }}>
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Race:</strong> {formData.race}</p>
              <p><strong>Class:</strong> {formData.class}</p>
              <p><strong>Background:</strong> {formData.background}</p>
            </div>
            
            <h4 style={{ marginBottom: '10px' }}>Ability Scores</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => (
                <div key={stat} style={{ textAlign: 'center', background: 'var(--gb-darkest)', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{stat.slice(0, 3)}</div>
                  <div>{formData[stat as keyof typeof formData]}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gb-light)' }}>
                    {Math.floor(((formData[stat as keyof typeof formData] as number) - 10) / 2) >= 0 ? '+' : ''}
                    {Math.floor(((formData[stat as keyof typeof formData] as number) - 10) / 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          {step > 1 && (
            <button className="btn" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button 
              className="btn btn-primary" 
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? t('loading') : t('button.create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}