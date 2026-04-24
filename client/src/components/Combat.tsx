import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore, apiCall } from '../store/gameStore';
import { io, Socket } from 'socket.io-client';

interface Combatant {
  id: number;
  entity_type: string;
  entity_id: number;
  initiative: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  current_ac: number;
  is_turn: boolean;
  is_defeated: boolean;
  character_name?: string;
  monster_name?: string;
}

interface Encounter {
  id: number;
  name: string;
  status: string;
  current_round: number;
  current_turn: number;
  combatants: Combatant[];
  combatLog: LogEntry[];
}

interface LogEntry {
  id: number;
  action_type: string;
  message: string;
  roll_result?: string;
  created_at: string;
}

export default function Combat() {
  const { t } = useTranslation();
  const { user, currentCampaign } = useGameStore();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [diceResult, setDiceResult] = useState<{ dice: string; rolls: number[]; total: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadEncounters();
    }

    // Connect to socket
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, currentCampaign]);

  useEffect(() => {
    if (socket && currentCampaign) {
      socket.emit('join-campaign', {
        campaignId: currentCampaign,
        userId: user?.id,
        username: user?.username
      });

      socket.on('combat-update', (data: { action: any }) => {
        console.log('Combat update:', data);
        loadEncounters();
      });
    }
  }, [socket, currentCampaign, user]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [currentEncounter?.combatLog]);

  const loadEncounters = async () => {
    if (!currentCampaign) return;
    try {
      const data = await apiCall<Encounter[]>(`/combat/campaign/${currentCampaign}`);
      setEncounters(data);
      const active = data.find(e => e.status === 'active');
      if (active) {
        setCurrentEncounter(active);
      }
    } catch (err) {
      console.error('Failed to load encounters:', err);
    } finally {
      setLoading(false);
    }
  };

  const rollDice = async (dice: string) => {
    try {
      const result = await apiCall<{ dice: string; rolls: number[]; total: number }>('/combat/roll', {
        method: 'POST',
        body: JSON.stringify({ dice })
      });
      setDiceResult(result);
      
      // Broadcast to other players
      if (socket && currentCampaign) {
        socket.emit('dice-roll', { dice, reason: '' });
      }
    } catch (err) {
      console.error('Roll failed:', err);
    }
  };

  const takeAction = async (actionType: string, targetId?: number, roll?: any) => {
    if (!currentEncounter) return;

    const currentCombatant = currentEncounter.combatants.find(c => c.is_turn);
    if (!currentCombatant) return;

    try {
      await apiCall(`/combat/${currentEncounter.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          actionType,
          actorId: currentCombatant.id,
          targetId,
          roll
        })
      });

      loadEncounters();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const nextTurn = async () => {
    if (!currentEncounter) return;
    try {
      await apiCall(`/combat/${currentEncounter.id}/next-turn`, { method: 'POST' });
      loadEncounters();
    } catch (err) {
      console.error('Next turn failed:', err);
    }
  };

  const endCombat = async () => {
    if (!currentEncounter) return;
    try {
      await apiCall(`/combat/${currentEncounter.id}/end`, { method: 'POST' });
      setCurrentEncounter(null);
      loadEncounters();
    } catch (err) {
      console.error('End combat failed:', err);
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  if (!currentCampaign) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p>Join or create a campaign first to use combat.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>{t('nav.combat')}</h2>

      {/* Dice Roller */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">{t('dice.roll')}</div>
        <div className="dice-roller">
          {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
            <button key={die} className="dice-btn" onClick={() => rollDice(`1${die}`)}>
              {die}
            </button>
          ))}
        </div>
        {diceResult && (
          <div>
            <div className="dice-result">{diceResult.total}</div>
            <div className="dice-rolls">
              {diceResult.rolls.map((r, i) => (
                <div key={i} className="dice-roll">{r}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Combat */}
      {currentEncounter ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div className="card-header" style={{ margin: 0, border: 'none', padding: 0 }}>
              {currentEncounter.name} - {t('combat.round')} {currentEncounter.current_round}
            </div>
            <button className="btn btn-danger" onClick={endCombat}>
              {t('combat.end')}
            </button>
          </div>

          {/* Combatants */}
          <div className="combat-tracker">
            {currentEncounter.combatants.map((combatant) => (
              <div key={combatant.id} className={`combatant ${combatant.is_turn ? 'active' : ''}`}>
                <div className="combatant-info">
                  <span style={{ fontWeight: 'bold' }}>
                    {combatant.character_name || combatant.monster_name || 'Unknown'}
                  </span>
                  <span>Initiative: {combatant.initiative}</span>
                  <div className="hp-bar">
                    <div 
                      className="hp-fill" 
                      style={{ width: `${(combatant.current_hp / combatant.max_hp) * 100}%` }}
                    />
                  </div>
                  <span>{combatant.current_hp}/{combatant.max_hp}</span>
                  <span>AC: {combatant.current_ac}</span>
                </div>
                {combatant.is_turn && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" onClick={() => takeAction('attack')}>
                      {t('combat.attack')}
                    </button>
                    <button className="btn" onClick={() => takeAction('spell')}>
                      {t('combat.spell')}
                    </button>
                    <button className="btn btn-primary" onClick={nextTurn}>
                      Next Turn
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Combat Log */}
          <div className="game-log" ref={logRef} style={{ marginTop: '20px' }}>
            {currentEncounter.combatLog?.map((log) => (
              <div key={log.id} className={`log-entry ${log.action_type === 'system' ? 'system' : 'combat'}`}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No active combat. Create an encounter to start!</p>
        </div>
      )}

      {/* Past Encounters */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">Past Encounters</div>
        {encounters.filter(e => e.status !== 'active').length === 0 ? (
          <p>No past encounters</p>
        ) : (
          encounters.filter(e => e.status !== 'active').map(enc => (
            <div key={enc.id} style={{ padding: '10px', borderBottom: '1px solid var(--gb-light)' }}>
              {enc.name} - {enc.status} - Round {enc.current_round}
            </div>
          ))
        )}
      </div>
    </div>
  );
}