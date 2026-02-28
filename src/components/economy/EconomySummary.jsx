import useGameStore from '../../store/gameStore';
import useTxStore from '../../store/txStore';

/**
 * EconomySummary — Round economy stats overview.
 * Shows total prize pool, tx count, and cost metrics.
 */
export default function EconomySummary() {
    const { killFeed, playerBalance, players } = useGameStore();
    const { totalTxThisRound, avgConfirmTime, confirmedCount } = useTxStore();

    const myKills = killFeed.filter(k => k.killer === 'local_player').length;
    const killEarnings = myKills * 0.001; // Glock kill reward

    return (
        <div style={{
            background: '#111118',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: "'JetBrains Mono', monospace"
        }}>
            <div style={{
                fontSize: '12px',
                color: '#836ef9',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: '700',
                marginBottom: '12px'
            }}>
                💰 Economy Summary
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                    { label: 'Balance', value: `${playerBalance.toFixed(4)}`, unit: 'MON', color: '#00ff9d' },
                    { label: 'Kill Earnings', value: `+${killEarnings.toFixed(4)}`, unit: 'MON', color: '#10b981' },
                    { label: 'On-Chain Txs', value: totalTxThisRound, unit: '', color: '#836ef9' },
                    { label: 'Avg Confirm', value: avgConfirmTime > 0 ? avgConfirmTime.toFixed(1) : '—', unit: 's', color: '#f59e0b' },
                    { label: 'My Kills', value: myKills, unit: '', color: '#ef4444' },
                    { label: 'Players', value: players.length, unit: '', color: '#836ef9' }
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid #1a1a2a',
                        borderRadius: '8px',
                        padding: '10px'
                    }}>
                        <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: stat.color }}>
                            {stat.value}
                            {stat.unit && <span style={{ fontSize: '10px', color: '#444', marginLeft: '3px' }}>{stat.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
