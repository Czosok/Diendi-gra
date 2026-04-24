import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore, apiCall } from '../store/gameStore';

interface Campaign {
  id: number;
  name: string;
  description: string;
  gm_id: number;
  gm_username: string;
  is_active: number;
  language: string;
  player_count: number;
}

export default function Campaigns() {
  const { t } = useTranslation();
  const { user, currentCampaign, setCurrentCampaign } = useGameStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', language: 'en' });

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    try {
      const data = await apiCall<Campaign[]>(`/campaigns/user/${user.id}`);
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim() || !user) return;
    
    try {
      const campaign = await apiCall<Campaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: newCampaign.name,
          description: newCampaign.description,
          gmId: user.id,
          language: newCampaign.language
        })
      });
      
      setCampaigns([...campaigns, campaign]);
      setShowCreate(false);
      setNewCampaign({ name: '', description: '', language: 'en' });
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const joinCampaign = async (campaignId: number) => {
    if (!user) return;
    try {
      await apiCall(`/campaigns/${campaignId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      setCurrentCampaign(campaignId);
      loadCampaigns();
    } catch (err) {
      console.error('Failed to join campaign:', err);
    }
  };

  const leaveCampaign = async (campaignId: number) => {
    if (!user) return;
    try {
      await apiCall(`/campaigns/${campaignId}/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      if (currentCampaign === campaignId) {
        setCurrentCampaign(null);
      }
      loadCampaigns();
    } catch (err) {
      console.error('Failed to leave campaign:', err);
    }
  };

  const selectCampaign = (campaignId: number) => {
    setCurrentCampaign(campaignId === currentCampaign ? null : campaignId);
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('nav.campaigns')}</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t('button.cancel') : t('campaign.new')}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">{t('campaign.name')}</label>
            <input
              type="text"
              className="form-input"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="Enter campaign name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('campaign.description')}</label>
            <textarea
              className="form-input"
              value={newCampaign.description}
              onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              placeholder="Describe your campaign"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              className="form-select"
              value={newCampaign.language}
              onChange={(e) => setNewCampaign({ ...newCampaign, language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={createCampaign}>
            {t('button.create')}
          </button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>{t('noCampaigns')}</p>
        </div>
      ) : (
        <div className="card-grid">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="card"
              style={{ 
                borderColor: currentCampaign === campaign.id ? 'var(--gb-white)' : 'var(--gb-light)',
                cursor: 'pointer'
              }}
              onClick={() => selectCampaign(campaign.id)}
            >
              <div className="card-header">{campaign.name}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--gb-light)' }}>
                GM: {campaign.gm_username}
              </p>
              {campaign.description && (
                <p style={{ fontSize: '0.75rem', marginTop: '10px' }}>
                  {campaign.description.substring(0, 100)}...
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontSize: '0.8rem' }}>
                  {campaign.player_count} players
                </span>
                {currentCampaign === campaign.id ? (
                  <span style={{ color: 'var(--gb-light)' }}>Active</span>
                ) : (
                  <button 
                    className="btn" 
                    onClick={(e) => { e.stopPropagation(); joinCampaign(campaign.id); }}
                  >
                    {t('button.join')}
                  </button>
                )}
              </div>
              {currentCampaign === campaign.id && (
                <div style={{ marginTop: '10px' }}>
                  <button 
                    className="btn btn-danger" 
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); leaveCampaign(campaign.id); }}
                  >
                    {t('button.leave')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}