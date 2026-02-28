import { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import useTxStore from '../../store/txStore';
import { WEAPON_LIST } from '../../config/weapons';

/**
 * HUD Overlay — drawn in React on top of the Phaser canvas.
 * Shows HP, weapon, money, round timer, kill count, and pending tx badge.
 */
export default function HUDOverlay() {
    const { roundState, roundTimer, playerBalance, inventory, killFeed } = useGameStore();
    const { pendingCount, totalTxThisRound } = useTxStore();
    const [playerHP, setPlayerHP] = useState(100);

    const currentWeapon = inventory.length > 0 ? inventory[inventory.length - 1] : WEAPON_LIST[0];

    // Count kills by local player
    const myKills = killFeed.filter(k => k.killer === 'local_player').length;

    const stateLabels = {
        LOBBY: 'WAITING FOR PLAYERS',
        BUY: '🛒 BUY PHASE',
        LIVE: '⚔️ ROUND LIVE',
        SETTLING: '⚡ SETTLING...',
        COMPLETE: '🏁 ROUND OVER',
        RESULTS: '📊 RESULTS'
    };

    const stateColors = {
        LOBBY: '#666',
        BUY: '#f59e0b',
        LIVE: '#ef4444',
        SETTLING: '#836ef9',
        COMPLETE: '#10b981',
        RESULTS: '#10b981'
    };

    const hpPercent = Math.max(playerHP / 100, 0);
    const hpColor = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';

    return (
        <div
            id="hud-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 10,
                fontFamily: "'JetBrains Mono', monospace"
            }}
        >
            {/* Top center — round state + timer */}
            <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(10, 10, 15, 0.9)',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                padding: '8px 20px'
            }}>
                <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: stateColors[roundState] || '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {stateLabels[roundState] || roundState}
                </span>
                {roundTimer > 0 && (
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: roundTimer <= 10 ? '#ef4444' : '#fff',
                        fontVariantNumeric: 'tabular-nums',
                        animation: roundTimer <= 10 ? 'pulse-glow 0.5s ease-in-out infinite' : 'none'
                    }}>
                        {Math.floor(roundTimer / 60)}:{(roundTimer % 60).toString().padStart(2, '0')}
                    </span>
                )}
            </div>

            {/* Bottom left — HP + weapon */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px'
            }}>
                {/* HP bar */}
                <div style={{
                    background: 'rgba(10, 10, 15, 0.9)',
                    border: '1px solid #2a2a3a',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    minWidth: '80px'
                }}>
                    <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>HP</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: hpColor }}>
                        {playerHP}
                    </div>
                    <div style={{
                        height: '3px',
                        background: '#1a1a2a',
                        borderRadius: '2px',
                        marginTop: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${hpPercent * 100}%`,
                            background: `linear-gradient(90deg, ${hpColor}, ${hpColor})`,
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Current weapon */}
                <div style={{
                    background: 'rgba(10, 10, 15, 0.9)',
                    border: '1px solid #2a2a3a',
                    borderRadius: '10px',
                    padding: '8px 14px'
                }}>
                    <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>WEAPON</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '20px' }}>{currentWeapon?.icon || '🔫'}</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#e0e0e0' }}>
                                {currentWeapon?.name || 'Glock'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#555' }}>
                                DMG: {currentWeapon?.damage || 25}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kills */}
                <div style={{
                    background: 'rgba(10, 10, 15, 0.9)',
                    border: '1px solid #2a2a3a',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>KILLS</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                        {myKills}
                    </div>
                </div>
            </div>

            {/* Bottom right — balance */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(10, 10, 15, 0.9)',
                border: '1px solid #2a2a3a',
                borderRadius: '10px',
                padding: '8px 14px'
            }}>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>BALANCE</div>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#00ff9d'
                }}>
                    {playerBalance.toFixed(4)} MON
                </div>
            </div>

            {/* Top right — pending tx badge */}
            {pendingCount > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    color: '#f59e0b',
                    fontWeight: '600',
                    animation: 'pulse-glow 1.5s ease-in-out infinite',
                    pointerEvents: 'auto'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        boxShadow: '0 0 10px #f59e0b'
                    }} />
                    {pendingCount} txs pending
                </div>
            )}

            {/* Top left — total tx counter */}
            <div style={{
                position: 'absolute',
                top: '12px',
                left: '16px',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '11px',
                color: '#836ef9'
            }}>
                📊 {totalTxThisRound} txs this round
            </div>

            {/* Top center-right — controls hint */}
            <div style={{
                position: 'absolute',
                top: '12px',
                right: '180px',
                background: 'rgba(10, 10, 15, 0.6)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '9px',
                color: '#444'
            }}>
                WASD: Move | Mouse: Aim | Click: Shoot | B: Shop
            </div>
        </div>
    );
}
