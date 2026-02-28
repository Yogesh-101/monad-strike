import useGameEconomy from '../../hooks/useGameEconomy';
import useGameStore from '../../store/gameStore';
import useWalletStore from '../../store/walletStore';
import { WEAPON_LIST } from '../../config/weapons';
import { DEMO_MODE } from '../../config/demoMode';

/**
 * Buy Phase Panel — CS:GO-style weapon shop.
 * Shows during BUY phase (30 seconds).
 */
export default function BuyPhasePanel() {
    const { buyWeapon } = useGameEconomy();
    const { playerBalance, inventory } = useGameStore();
    const { isConnected } = useWalletStore();

    if (!DEMO_MODE && !isConnected) return null;

    const categories = {
        Pistol: WEAPON_LIST.filter(w => w.type === 'Pistol'),
        SMG: WEAPON_LIST.filter(w => w.type === 'SMG'),
        Rifle: WEAPON_LIST.filter(w => w.type === 'Rifle'),
        Sniper: WEAPON_LIST.filter(w => w.type === 'Sniper'),
        Utility: WEAPON_LIST.filter(w => w.type === 'Utility' || w.type === 'Defense')
    };

    return (
        <div
            id="buy-phase-panel"
            style={{
                background: 'linear-gradient(180deg, rgba(17,17,24,0.98) 0%, rgba(10,10,15,0.98) 100%)',
                border: '1px solid #2a2a3a',
                borderRadius: '16px',
                padding: '20px',
                maxWidth: '400px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #2a2a3a'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#836ef9',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    🔫 Weapon Shop
                </h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 255, 157, 0.1)',
                    border: '1px solid rgba(0, 255, 157, 0.2)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    color: '#00ff9d'
                }}>
                    💰 {playerBalance.toFixed(4)} MON
                </div>
            </div>

            {/* Weapon categories */}
            {Object.entries(categories).map(([category, weapons]) => (
                <div key={category} style={{ marginBottom: '12px' }}>
                    <div style={{
                        fontSize: '10px',
                        color: '#555',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        marginBottom: '6px',
                        fontWeight: '600'
                    }}>
                        {category}
                    </div>

                    {weapons.map(weapon => {
                        const owned = inventory.filter(w => w.id === weapon.id).length;
                        const canAfford = playerBalance >= weapon.cost;

                        return (
                            <button
                                key={weapon.id}
                                id={`buy-weapon-${weapon.id}`}
                                onClick={() => buyWeapon(weapon.id)}
                                disabled={!canAfford}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: canAfford
                                        ? 'rgba(131, 110, 249, 0.05)'
                                        : 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${canAfford ? '#2a2a3a' : '#1a1a2a'}`,
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    marginBottom: '4px',
                                    color: canAfford ? '#e0e0e0' : '#444',
                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s ease',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '13px'
                                }}
                                onMouseEnter={e => {
                                    if (canAfford) {
                                        e.currentTarget.style.background = 'rgba(131, 110, 249, 0.15)';
                                        e.currentTarget.style.borderColor = '#836ef9';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = canAfford
                                        ? 'rgba(131, 110, 249, 0.05)'
                                        : 'rgba(255, 255, 255, 0.02)';
                                    e.currentTarget.style.borderColor = canAfford ? '#2a2a3a' : '#1a1a2a';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>{weapon.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{weapon.name}</div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#555',
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            DMG: {weapon.damage} | {weapon.type}
                                            {owned > 0 && <span style={{ color: '#10b981' }}> ×{owned}</span>}
                                        </div>
                                    </div>
                                </div>

                                <span style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '12px',
                                    color: canAfford ? '#00ff9d' : '#444'
                                }}>
                                    {weapon.cost} MON
                                </span>
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
