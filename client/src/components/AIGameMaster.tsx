import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore, apiCall } from '../store/gameStore';

interface OllamaStatus {
  status: 'online' | 'offline';
  models?: { name: string }[];
  defaultModel?: string;
}

interface NPC {
  id: number;
  name: string;
  description: string;
  personality: string;
  is_hostile: number;
}

interface Message {
  id: number;
  role: 'user' | 'gm' | 'npc';
  content: string;
  timestamp: Date;
}

export default function AIGameMaster() {
  const { t } = useTranslation();
  const { user, currentCampaign } = useGameStore();
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'gm' | 'npc'>('gm');
  const [selectedNpc, setSelectedNpc] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkOllamaStatus();
    if (currentCampaign) {
      loadNPCs();
    }
  }, [currentCampaign]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkOllamaStatus = async () => {
    try {
      const status = await apiCall<OllamaStatus>('/ai/status');
      setOllamaStatus(status);
    } catch (err) {
      setOllamaStatus({ status: 'offline' });
    }
  };

  const loadNPCs = async () => {
    if (!currentCampaign) return;
    try {
      // Would load from API in real implementation
      setNpcs([
        { id: 1, name: 'Elder Thorne', description: 'An elderly elven druid', personality: 'Wise and cautious', is_hostile: 0 },
        { id: 2, name: 'Captain Blackwood', description: 'A grizzled veteran', personality: 'Gruff but honorable', is_hostile: 0 }
      ]);
    } catch (err) {
      console.error('Failed to load NPCs:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentCampaign) return;
    
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response: { gm?: string; response?: string };
      
      if (mode === 'gm') {
        response = await apiCall<{ gm: string }>('/ai/gm', {
          method: 'POST',
          body: JSON.stringify({
            campaignId: currentCampaign,
            action: input
          })
        });
        
        const gmMessage: Message = {
          id: Date.now() + 1,
          role: 'gm',
          content: response.gm || '',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, gmMessage]);
      } else if (selectedNpc) {
        response = await apiCall<{ response: string }>('/ai/npc', {
          method: 'POST',
          body: JSON.stringify({
            npcId: selectedNpc,
            message: input,
            campaignId: currentCampaign,
            conversationHistory: messages.map(m => ({ speaker: m.role, text: m.content }))
          })
        });
        
        const npcMessage: Message = {
          id: Date.now() + 1,
          role: 'npc',
          content: response.response || '',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, npcMessage]);
      }
    } catch (err) {
      console.error('AI request failed:', err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'gm',
        content: 'The AI service is currently unavailable. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateEncounter = async () => {
    if (!currentCampaign) return;
    setLoading(true);
    
    try {
      const result = await apiCall<{ monsters: { name: string; cr: string; quantity: number }[] }>('/ai/encounter', {
        method: 'POST',
        body: JSON.stringify({
          partyLevel: 5,
          partySize: 4,
          difficulty: 'medium',
          environment: 'dungeon'
        })
      });

      const encounterMessage: Message = {
        id: Date.now(),
        role: 'gm',
        content: `I've generated a ${result.monsters.length}-monster encounter:\n\n${result.monsters.map(m => `• ${m.quantity}x ${m.name} (CR ${m.cr})`).join('\n')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, encounterMessage]);
    } catch (err) {
      console.error('Encounter generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p>Join or create a campaign first to use the AI Game Master.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>{t('nav.ai')}</h2>

      {/* Status */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>AI Status:</strong>{' '}
            <span style={{ color: ollamaStatus?.status === 'online' ? 'var(--gb-light)' : '#ff6b6b' }}>
              {ollamaStatus?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          {ollamaStatus?.status === 'online' && ollamaStatus.defaultModel && (
            <div style={{ fontSize: '0.8rem', color: 'var(--gb-light)' }}>
              Model: {ollamaStatus.defaultModel}
            </div>
          )}
        </div>
        {ollamaStatus?.status === 'offline' && (
          <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#ff6b6b' }}>
            Ollama is not running. Start it with: ollama serve
          </p>
        )}
      </div>

      {/* Mode Selection */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`btn ${mode === 'gm' ? 'btn-primary' : ''}`}
          onClick={() => setMode('gm')}
        >
          {t('ai.gm')}
        </button>
        <button 
          className={`btn ${mode === 'npc' ? 'btn-primary' : ''}`}
          onClick={() => setMode('npc')}
        >
          {t('ai.talk')}
        </button>
      </div>

      {/* NPC Selection */}
      {mode === 'npc' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">Select NPC</div>
          <select 
            className="form-select"
            value={selectedNpc || ''}
            onChange={(e) => setSelectedNpc(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Choose an NPC...</option>
            {npcs.map(npc => (
              <option key={npc.id} value={npc.id}>{npc.name}</option>
            ))}
          </select>
          {selectedNpc && npcs.find(n => n.id === selectedNpc) && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
              <p><strong>Description:</strong> {npcs.find(n => n.id === selectedNpc)?.description}</p>
              <p><strong>Personality:</strong> {npcs.find(n => n.id === selectedNpc)?.personality}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className="btn" 
          onClick={generateEncounter}
          disabled={loading || ollamaStatus?.status !== 'online'}
        >
          Generate Encounter
        </button>
      </div>

      {/* Chat */}
      <div className="card">
        <div className="card-header">Chat</div>
        
        {/* Messages */}
        <div style={{ height: '300px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: 'var(--gb-darkest)' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gb-light)', fontSize: '0.8rem' }}>
              Start a conversation with the AI Game Master...
            </p>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{ 
                  marginBottom: '15px',
                  padding: '10px',
                  background: msg.role === 'user' ? 'var(--gb-dark)' : 'transparent',
                  borderLeft: msg.role === 'user' ? '3px solid var(--gb-light)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--gb-light)', marginBottom: '5px' }}>
                  {msg.role === 'user' ? 'You' : msg.role === 'gm' ? 'Game Master' : 'NPC'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
            placeholder={mode === 'gm' ? 'Ask the GM anything...' : 'Talk to the NPC...'}
            disabled={loading || ollamaStatus?.status !== 'online' || (mode === 'npc' && !selectedNpc)}
          />
          <button 
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim() || ollamaStatus?.status !== 'online' || (mode === 'npc' && !selectedNpc)}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}