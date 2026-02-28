import { useState } from 'react';
import useGameEconomy from '../../hooks/useGameEconomy';
import useGameStore from '../../store/gameStore';
import useWalletStore from '../../store/walletStore';
import { DEMO_MODE } from '../../config/demoMode';

/**
 * BetPanel — Place bets on round winner during LOBBY/BUY phase.
 */
export default function BetPanel() {
    const { placeBet } = useGameEconomy();
    const { players, playerBalance } = useGameStore();
    const { isConnected } = useWalletStore();
    const [betAmount, setBetAmount] = useState('0.001');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [placing, setPlacing] = useState(false);

    if (!DEMO_MODE && !isConnected) return null;
    if (players.length === 0) return null;

    const handleBet = async () => {
        if (!selectedPlayer || !betAmount) return;
        setPlacing(true);
        try {
            await placeBet(1, selectedPlayer, parseFloat(betAmount));
        } catch (err) {
            console.error(err);
        }
        setPlacing(false);
    };

    return (
        <div style={{
            background: '#111118',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                fontSize: '12px',
                color: '#836ef9',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: '700',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                🎲 Place Bet
            </div>

            {/* Player selection */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Bet on Winner
                </div>
                {players.map((player, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedPlayer(player.wallet)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            marginBottom: '4px',
                            background: selectedPlayer === player.wallet
                                ? 'rgba(131, 110, 249, 0.15)'
                                : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedPlayer === player.wallet ? '#836ef9' : '#1a1a2a'}`,
                            borderRadius: '6px',
                            color: '#aaa',
                            fontSize: '11px',
                            fontFamily: "'JetBrains Mono', monospace",
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: selectedPlayer === player.wallet ? '#836ef9' : '#333'
                        }} />
                        {player.wallet?.slice(0, 10)}...{player.wallet?.slice(-4)}
                    </button>
                ))}
            </div>

            {/* Amount */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <input
                    type="number"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    style={{
                        flex: 1,
                        background: '#0a0a0f',
                        border: '1px solid #2a2a3a',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#fff',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none'
                    }}
                    step="0.001"
                    min="0.001"
                />
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#555'
                }}>
                    MON
                </span>
            </div>

            <button
                onClick={handleBet}
                disabled={!selectedPlayer || placing}
                style={{
                    width: '100%',
                    background: selectedPlayer
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : '#1a1a2a',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedPlayer ? '#fff' : '#444',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: selectedPlayer ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}
            >
                {placing ? '⏳ Placing...' : '🎲 Place Bet'}
            </button>
        </div>
    );
}
