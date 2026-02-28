import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWallet from '../hooks/useWallet';
import useGameEconomy from '../hooks/useGameEconomy';
import useGameStore from '../store/gameStore';
import ConnectButton from '../components/wallet/ConnectButton';
import NetworkBadge from '../components/wallet/NetworkBadge';
import BetPanel from '../components/economy/BetPanel';
import { DEMO_MODE } from '../config/demoMode';

/**
 * LobbyPage — Waiting room with player list and join button.
 */
export default function LobbyPage() {
    const { isConnected, isCorrectNetwork, address } = useWallet();
    const { joinRound, deposit } = useGameEconomy();
    const { players, roundState } = useGameStore();
    const navigate = useNavigate();
    const [joining, setJoining] = useState(false);
    const [depositAmount, setDepositAmount] = useState('0.0001');

    // Navigate to game when round starts
    useEffect(() => {
        if (roundState === 'BUY' || roundState === 'LIVE') {
            navigate('/game');
        }
    }, [roundState, navigate]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            await joinRound();
        } catch (err) {
            console.error(err);
        }
        setJoining(false);
    };

    const handleDeposit = async () => {
        await deposit(parseFloat(depositAmount));
    };

    const handleStartDemo = async () => {
        // In demo mode: deposit, join, then go straight to game
        setJoining(true);
        try {
            await deposit(0.1);
            await joinRound();
            // SetRoundState to BUY, then navigate
            useGameStore.getState().setRoundState('LIVE');
            navigate('/game');
        } catch (err) {
            console.error(err);
        }
        setJoining(false);
    };

    // Determine if buttons should be enabled
    // In demo mode, always allow actions when connected
    const canInteract = DEMO_MODE ? isConnected : (isConnected && isCorrectNetwork);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid #1a1a2a'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span
                        style={{ fontSize: '20px', fontWeight: '800', color: '#836ef9', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        ⟐ MONADSTRIKE
                    </span>
                    <NetworkBadge />
                </div>
                <ConnectButton />
            </header>

            {/* Demo Mode Banner */}
            {DEMO_MODE && (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(131, 110, 249, 0.15))',
                    borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '10px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace"
                }}>
                    <span style={{ fontSize: '16px' }}>🎮</span>
                    <span style={{ color: '#f59e0b' }}>Demo Mode</span>
                    <span style={{ color: '#666' }}>—</span>
                    <span style={{ color: '#888' }}>
                        Contracts not deployed. Using simulated transactions.
                    </span>
                    <span style={{ color: '#666' }}>|</span>
                    <span style={{ color: '#836ef9', fontSize: '11px' }}>
                        Run <code style={{ background: '#1a1a2a', padding: '2px 6px', borderRadius: '4px' }}>npm run deploy:monad</code> to go live
                    </span>
                </div>
            )}

            {/* Main content */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '100%'
                }}>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 8px',
                        textAlign: 'center'
                    }}>
                        🎮 Game Lobby
                    </h2>
                    <p style={{
                        fontSize: '13px',
                        color: '#555',
                        fontFamily: "'JetBrains Mono', monospace",
                        textAlign: 'center',
                        marginBottom: '32px'
                    }}>
                        Min 2 players • Max 10 • Entry fee: 0.005 MON
                    </p>

                    {/* Deposit Section */}
                    <div style={{
                        background: '#111118',
                        border: '1px solid #2a2a3a',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            color: '#555',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px'
                        }}>
                            💰 Deposit MON
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: '#0a0a0f',
                                    border: '1px solid #2a2a3a',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    outline: 'none'
                                }}
                                step="0.01"
                                min="0.001"
                            />
                            <button
                                onClick={handleDeposit}
                                disabled={!canInteract}
                                style={{
                                    background: canInteract
                                        ? 'linear-gradient(135deg, #836ef9, #6b4de6)'
                                        : '#1a1a2a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: canInteract ? '#fff' : '#444',
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: canInteract ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Deposit
                            </button>
                        </div>
                    </div>

                    {/* Player list */}
                    <div style={{
                        background: '#111118',
                        border: '1px solid #2a2a3a',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{
                                fontSize: '12px',
                                color: '#555',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                Players in Lobby
                            </span>
                            <span style={{
                                fontSize: '13px',
                                color: '#836ef9',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: '600'
                            }}>
                                {players.length}/10
                            </span>
                        </div>

                        {players.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '24px',
                                color: '#333',
                                fontSize: '13px'
                            }}>
                                No players yet. Be the first to join!
                            </div>
                        ) : (
                            players.map((player, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    background: 'rgba(131, 110, 249, 0.05)',
                                    borderRadius: '8px',
                                    marginBottom: '4px',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '12px',
                                    color: '#888'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#10b981'
                                    }} />
                                    {player.wallet?.slice(0, 10)}...{player.wallet?.slice(-6)}
                                    {player.wallet === address && (
                                        <span style={{ color: '#836ef9', fontSize: '10px' }}>(you)</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <BetPanel />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            id="join-round-btn"
                            onClick={handleJoin}
                            disabled={!canInteract || joining}
                            style={{
                                width: '100%',
                                background: canInteract
                                    ? 'linear-gradient(135deg, #00ff9d 0%, #10b981 100%)'
                                    : '#1a1a2a',
                                border: 'none',
                                borderRadius: '12px',
                                color: canInteract ? '#0a0a0f' : '#444',
                                padding: '16px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: canInteract ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}
                        >
                            {joining ? '⏳ Joining...' : '🎮 Join Round (0.005 MON)'}
                        </button>

                        {/* Demo mode: Quick start button */}
                        {DEMO_MODE && canInteract && (
                            <button
                                id="start-demo-btn"
                                onClick={handleStartDemo}
                                disabled={joining}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #836ef9 0%, #6b4de6 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    padding: '14px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    boxShadow: '0 4px 15px rgba(131, 110, 249, 0.3)'
                                }}
                                onMouseEnter={e => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(131, 110, 249, 0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(131, 110, 249, 0.3)';
                                }}
                            >
                                ⚡ Quick Start (Demo) — Skip to Game
                            </button>
                        )}
                    </div>

                    {/* Demo mode info */}
                    {DEMO_MODE && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: 'rgba(131, 110, 249, 0.05)',
                            border: '1px solid #2a2a3a',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#666',
                            lineHeight: 1.6,
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            <div style={{ color: '#836ef9', fontWeight: '600', marginBottom: '8px' }}>
                                💡 Demo Mode Active
                            </div>
                            <div>• Deposits and purchases are simulated locally</div>
                            <div>• Tx feed shows realistic Monad timings (~0.5-1s)</div>
                            <div>• Game is fully playable with demo bots</div>
                            <div style={{ marginTop: '8px', color: '#888' }}>
                                To deploy contracts and play for real MON:
                                <br />1. Add your private key to <code style={{ background: '#1a1a2a', padding: '1px 4px', borderRadius: '3px' }}>.env</code>
                                <br />2. Run <code style={{ background: '#1a1a2a', padding: '1px 4px', borderRadius: '3px' }}>npm run deploy:monad</code>
                                <br />3. Copy deployed addresses to <code style={{ background: '#1a1a2a', padding: '1px 4px', borderRadius: '3px' }}>.env</code>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
