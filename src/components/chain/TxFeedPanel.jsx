import useTxStore from '../../store/txStore';
import TxBadge from './TxBadge';
import { MONAD_EXPLORER } from '../../config/monad';

/**
 * MonadStrike — Live Transaction Feed Panel
 *
 * The HERO demo element. Shows real Monad transactions as they happen.
 * Color-coded: green=confirmed, orange=pending, red=failed.
 * New transactions slide in from right with animation.
 */
export default function TxFeedPanel() {
    const { queue, pendingCount, confirmedCount, totalTxThisRound, avgConfirmTime } = useTxStore();

    return (
        <div
            id="tx-feed-panel"
            style={{
                width: '320px',
                height: '100%',
                background: 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
                border: '1px solid #2a2a3a',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2a2a3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⛓</span>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#836ef9',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Monad Live Feed
                    </span>
                </div>
                {pendingCount > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '20px',
                        fontSize: '11px',
                        color: '#f59e0b',
                        animation: 'pulse-glow 1.5s ease-in-out infinite'
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#f59e0b',
                            boxShadow: '0 0 8px #f59e0b'
                        }} />
                        {pendingCount} pending
                    </div>
                )}
            </div>

            {/* Transaction list */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px'
            }}>
                {queue.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        color: '#444',
                        fontSize: '13px',
                        textAlign: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '32px', opacity: 0.5 }}>⛓</span>
                        <span>Waiting for transactions...</span>
                        <span style={{ fontSize: '11px', color: '#333' }}>
                            Every action will appear here
                        </span>
                    </div>
                ) : (
                    queue.slice(0, 50).map((tx, i) => (
                        <TxBadge key={tx.id} tx={tx} index={i} />
                    ))
                )}
            </div>

            {/* Stats footer */}
            <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #2a2a3a',
                background: 'rgba(131, 110, 249, 0.03)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#666'
                }}>
                    <span>📊 This round:</span>
                    <span style={{ color: '#836ef9', fontWeight: '600' }}>
                        {totalTxThisRound} txs
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                }}>
                    <span>Avg confirm:</span>
                    <span style={{ color: '#10b981' }}>
                        {avgConfirmTime > 0 ? `${avgConfirmTime.toFixed(1)}s` : '—'}
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                }}>
                    <span>Confirmed:</span>
                    <span style={{ color: '#10b981' }}>{confirmedCount}</span>
                </div>
            </div>
        </div>
    );
}
