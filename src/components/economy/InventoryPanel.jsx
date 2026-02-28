import useGameStore from '../../store/gameStore';

/**
 * InventoryPanel — Shows player's owned weapons and items.
 */
export default function InventoryPanel() {
    const { inventory } = useGameStore();

    // Group by weapon name
    const grouped = {};
    inventory.forEach(w => {
        if (!grouped[w.name]) grouped[w.name] = { ...w, count: 0 };
        grouped[w.name].count++;
    });

    const items = Object.values(grouped);

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
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span>🎒 Inventory</span>
                <span style={{ color: '#555', fontSize: '11px' }}>{inventory.length} items</span>
            </div>

            {items.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#333',
                    fontSize: '12px'
                }}>
                    No items yet. Visit the shop!
                </div>
            ) : (
                items.map(item => (
                    <div
                        key={item.name}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: 'rgba(131, 110, 249, 0.05)',
                            border: '1px solid #1a1a2a',
                            borderRadius: '8px',
                            marginBottom: '4px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#e0e0e0' }}>
                                    {item.name}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: '#555',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>
                                    DMG: {item.damage} | {item.type}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(131, 110, 249, 0.2)',
                            color: '#836ef9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            ×{item.count}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
