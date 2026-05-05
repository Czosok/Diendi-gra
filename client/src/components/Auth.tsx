import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameStore, apiCall } from '../store/gameStore';

interface AuthResponse {
  user: { id: number; username: string; email?: string };
  token: string;
}

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { username, password }
        : { username, password, email };

      const data = await apiCall<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setAuth(data.user, data.token);
      navigate('/characters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    // Guest login - create temporary guest user
    const guestUsername = `guest_${Date.now()}`;
    const guestPassword = 'guest_temp_123';
    const guestEmail = `${guestUsername}@guest.local`;
    
    setLoading(true);
    setError('');
    
    try {
      // Try to register as guest (may fail if username exists, that's ok)
      try {
        await apiCall<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username: guestUsername, password: guestPassword, email: guestEmail })
        });
      } catch (e) {
        // Username exists, try login
      }
      
      // Login as guest
      const data = await apiCall<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: guestUsername, password: guestPassword })
      });
      
      setAuth(data.user, data.token);
      navigate('/characters');
    } catch (err) {
      // If all fails, just use local guest mode
      setAuth({ id: 0, username: 'Guest', email: 'guest@local' }, 'guest-token');
      navigate('/characters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button 
          className={`auth-tab ${isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(true)}
        >
          {t('auth.login')}
        </button>
        <button 
          className={`auth-tab ${!isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(false)}
        >
          {t('auth.register')}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{t('auth.username')}</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.password')}</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div style={{ color: '#ff6b6b', marginBottom: '15px', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? t('loading') : (isLogin ? t('auth.login') : t('auth.register'))}
        </button>
        
        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '10px' }}
          onClick={handleGuest}
          disabled={loading}
        >
          {t('auth.guest') || 'Play as Guest'}
        </button>
      </form>
    </div>
  );
}