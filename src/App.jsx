import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import StatsPage from './pages/StatsPage';

/**
 * MonadStrike — Root Application
 *
 * Routes:
 *   /       → Landing page with wallet connect
 *   /lobby  → Game lobby, player list
 *   /game   → Active game with Phaser + all panels
 *   /stats  → On-chain player stats + leaderboard
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications — styled to match cyberpunk theme */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#111118',
            color: '#e0e0e0',
            border: '1px solid #2a2a3a',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#111118' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#111118' }
          }
        }}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
