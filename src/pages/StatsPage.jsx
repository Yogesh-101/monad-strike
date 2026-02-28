import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWallet from '../hooks/useWallet';
import { getContracts } from '../contracts';
import { ethers } from 'ethers';
import ConnectButton from '../components/wallet/ConnectButton';
import NetworkBadge from '../components/wallet/NetworkBadge';

/**
 * StatsPage — On-chain player stats and leaderboard.
 */
export default function StatsPage() {
    const { address, isConnected } = useWallet();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isConnected || !address) return;
        fetchStats();
    }, [isConnected, address]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const contracts = getContracts();
            if (contracts.playerStats) {
                const s = await contracts.playerStats.getStats(address);
                setStats({
                    totalKills: Number(s.totalKills),
                    totalDeaths: Number(s.totalDeaths),
                    roundsWon: Number(s.roundsWon),
                    roundsPlayed: Number(s.roundsPlayed),
                    totalEarned: ethers.formatEther(s.totalEarned),
                    totalSpent: ethers.formatEther(s.totalSpent),
                    totalTxCount: Number(s.totalTxCount)
                });

                const lb = await contracts.playerStats.getLeaderboard(10);
                setLeaderboard(lb.map(entry => ({
                    player: entry.player,
                    kills: Number(entry.totalKills),
                    deaths: Number(entry.totalDeaths),
                    wins: Number(entry.roundsWon),
                    earned: ethers.formatEther(entry.totalEarned)
                })));
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            <main style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '40px 24px'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}>
                    📊 On-Chain Stats
                </h2>

                {/* Personal stats */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        marginBottom: '40px'
                    }}>
                        {[
                            { label: 'Total Kills', value: stats.totalKills, icon: '💀', color: '#ef4444' },
                            { label: 'Deaths', value: stats.totalDeaths, icon: '☠️', color: '#666' },
                            { label: 'Rounds Won', value: stats.roundsWon, icon: '🏆', color: '#f59e0b' },
                            { label: 'K/D Ratio', value: stats.totalDeaths > 0 ? (stats.totalKills / stats.totalDeaths).toFixed(2) : stats.totalKills, icon: '📈', color: '#10b981' },
                            { label: 'Games Played', value: stats.roundsPlayed, icon: '🎮', color: '#836ef9' },
                            { label: 'Total Earned', value: `${parseFloat(stats.totalEarned).toFixed(4)} MON`, icon: '💰', color: '#00ff9d' },
                            { label: 'Total Spent', value: `${parseFloat(stats.totalSpent).toFixed(4)} MON`, icon: '💸', color: '#f59e0b' },
                            { label: 'On-Chain Txs', value: stats.totalTxCount, icon: '⛓', color: '#836ef9' }
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: '#111118',
                                border: '1px solid #2a2a3a',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: stat.color,
                                    fontVariantNumeric: 'tabular-nums'
                                }}>
                                    {stat.value}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: '#555',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginTop: '4px'
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!stats && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#444',
                        fontSize: '14px'
                    }}>
                        {isConnected ? 'No stats found. Play a round first!' : 'Connect your wallet to see stats.'}
                    </div>
                )}

                {/* Leaderboard */}
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#836ef9',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textAlign: 'center'
                }}>
                    🏆 Global Leaderboard
                </h3>

                <div style={{
                    background: '#111118',
                    border: '1px solid #2a2a3a',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 80px 80px 100px',
                        padding: '12px 16px',
                        borderBottom: '1px solid #2a2a3a',
                        fontSize: '10px',
                        color: '#555',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        <span>#</span>
                        <span>Player</span>
                        <span>Kills</span>
                        <span>Deaths</span>
                        <span>Wins</span>
                        <span>Earned</span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#333',
                            fontSize: '13px'
                        }}>
                            No players yet
                        </div>
                    ) : (
                        leaderboard.map((entry, i) => (
                            <div key={i} style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr 80px 80px 80px 100px',
                                padding: '12px 16px',
                                borderBottom: '1px solid #1a1a2a',
                                fontSize: '12px',
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#888',
                                background: entry.player === address
                                    ? 'rgba(131, 110, 249, 0.05)'
                                    : 'transparent'
                            }}>
                                <span style={{
                                    color: i < 3 ? '#f59e0b' : '#444',
                                    fontWeight: i < 3 ? '700' : '400'
                                }}>
                                    {i + 1}
                                </span>
                                <span>{entry.player.slice(0, 8)}...{entry.player.slice(-4)}</span>
                                <span style={{ color: '#ef4444' }}>{entry.kills}</span>
                                <span>{entry.deaths}</span>
                                <span style={{ color: '#f59e0b' }}>{entry.wins}</span>
                                <span style={{ color: '#00ff9d' }}>
                                    {parseFloat(entry.earned).toFixed(3)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
