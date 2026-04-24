import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import Auth from './components/Auth';
import CharacterList from './components/CharacterList';
import CharacterSheet from './components/CharacterSheet';
import CharacterCreate from './components/CharacterCreate';
import Combat from './components/Combat';
import WorldMap from './components/WorldMap';
import Campaigns from './components/Campaigns';
import AIGameMaster from './components/AIGameMaster';

function App() {
  const { t, i18n } = useTranslation();
  const { user, checkAuth, logout } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setLoading(false));
  }, [checkAuth]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'pl' : 'en');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        {user && (
          <nav className="navbar">
            <Link to="/" className="navbar-brand">{t('app.title')}</Link>
            <div className="navbar-links">
              <Link to="/characters" className="navbar-link">{t('nav.characters')}</Link>
              <Link to="/combat" className="navbar-link">{t('nav.combat')}</Link>
              <Link to="/map" className="navbar-link">{t('nav.map')}</Link>
              <Link to="/campaigns" className="navbar-link">{t('nav.campaigns')}</Link>
              <Link to="/ai" className="navbar-link">{t('nav.ai')}</Link>
              <button onClick={toggleLanguage} className="btn" style={{ padding: '5px 10px' }}>
                {i18n.language.toUpperCase()}
              </button>
              <button onClick={logout} className="btn" style={{ padding: '5px 10px' }}>
                {t('auth.logout')}
              </button>
            </div>
          </nav>
        )}

        <div className="container">
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/characters" />} />
            <Route path="/characters" element={user ? <CharacterList /> : <Navigate to="/auth" />} />
            <Route path="/characters/new" element={user ? <CharacterCreate /> : <Navigate to="/auth" />} />
            <Route path="/characters/:id" element={user ? <CharacterSheet /> : <Navigate to="/auth" />} />
            <Route path="/combat" element={user ? <Combat /> : <Navigate to="/auth" />} />
            <Route path="/map" element={user ? <WorldMap /> : <Navigate to="/auth" />} />
            <Route path="/campaigns" element={user ? <Campaigns /> : <Navigate to="/auth" />} />
            <Route path="/ai" element={user ? <AIGameMaster /> : <Navigate to="/auth" />} />
            <Route path="/" element={<Navigate to={user ? "/characters" : "/auth"} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;