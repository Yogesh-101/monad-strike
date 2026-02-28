import { MONAD_EXPLORER } from '../../config/monad';

/**
 * Single transaction badge in the live feed.
 * Color-coded by status with slide-in animation.
 */
const STATUS_CONFIG = {
    PENDING: {
        icon: '⏳',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.2)',
        label: 'Pending'
    },
    SUBMITTED: {
        icon: '📡',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.2)',
        label: 'Submitted'
    },
    CONFIRMED: {
        icon: '✅',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.2)',
        label: 'Confirmed'
    },
    FAILED: {
        icon: '❌',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: 'rgba(239, 68, 68, 0.2)',
        label: 'Failed'
    }
};

const TYPE_ICONS = {
    BUY_WEAPON: '🔫',
    KILL_BATCH: '💀',
    JOIN_ROUND: '🎮',
    BET: '🎲',
    DEPOSIT: '💰',
    CLAIM: '💎',
    SETTLEMENT: '⚡'
};

export default function TxBadge({ tx, index }) {
    const config = STATUS_CONFIG[tx.status] || STATUS_CONFIG.PENDING;
    const typeIcon = TYPE_ICONS[tx.type] || '📝';
    const isNew = index < 3;

    return (
        <div
            style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '6px',
                animation: isNew ? 'slide-in-right 0.3s ease-out' : 'none',
                transition: 'all 0.3s ease'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: config.color
                }}>
                    <span>{config.icon}</span>
                    <span>{tx.description}</span>
                </div>
                <span style={{ fontSize: '10px' }}>{typeIcon}</span>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#555'
            }}>
                {tx.hash ? (
                    <a
                        href={`${MONAD_EXPLORER}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#836ef9',
                            textDecoration: 'none',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                    </a>
                ) : (
                    <span style={{ color: '#333' }}>awaiting hash...</span>
                )}

                {tx.confirmTime && (
                    <span style={{ color: '#10b981' }}>
                        {tx.confirmTime.toFixed(1)}s
                    </span>
                )}
            </div>
        </div>
    );
}
