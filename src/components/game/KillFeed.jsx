import { useEffect, useState } from 'react';
import useGameStore from '../../store/gameStore';

/**
 * Kill Feed — shows recent kills with weapon info.
 * Entries animate in and fade out after 4 seconds.
 */
export default function KillFeed() {
    const { killFeed } = useGameStore();
    const [visibleKills, setVisibleKills] = useState([]);

    useEffect(() => {
        // Add new kills with a timestamp for auto-removal
        setVisibleKills(killFeed.slice(0, 6).map(kill => ({
            ...kill,
            fadeId: `${kill.killer}-${kill.victim}-${kill.timestamp}`
        })));
    }, [killFeed]);

    if (visibleKills.length === 0) return null;

    return (
        <div
            id="kill-feed"
            style={{
                position: 'absolute',
                top: '60px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 11,
                pointerEvents: 'none'
            }}
        >
            {visibleKills.map((kill, i) => (
                <div
                    key={kill.fadeId || i}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(10, 10, 15, 0.85)',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        animation: 'slide-in-right 0.3s ease-out',
                        opacity: i > 3 ? 0.5 : 1
                    }}
                >
                    <span style={{ color: '#00ff9d', fontWeight: '600' }}>
                        {typeof kill.killer === 'string' ? kill.killer.slice(0, 8) : 'Player'}
                    </span>
                    <span style={{ color: '#ff4444' }}>{kill.weaponIcon || '🔫'}</span>
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>
                        {typeof kill.victim === 'string' ? kill.victim.slice(0, 8) : 'Player'}
                    </span>
                    <span style={{ color: '#333', fontSize: '10px' }}>
                        {kill.weapon || ''}
                    </span>
                </div>
            ))}
        </div>
    );
}
