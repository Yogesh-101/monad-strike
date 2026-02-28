import { useEffect, useRef, useCallback, useState } from 'react';
import PhaserGame from '../game/PhaserGame';
import HUDOverlay from '../components/game/HUDOverlay';
import KillFeed from '../components/game/KillFeed';
import SettlementOverlay from '../components/game/SettlementOverlay';
import InventoryPanel from '../components/economy/InventoryPanel';
import EconomySummary from '../components/economy/EconomySummary';
import TxFeedPanel from '../components/chain/TxFeedPanel';
import BuyPhasePanel from '../components/economy/BuyPhasePanel';
import useGameStore from '../store/gameStore';
import useTxStore from '../store/txStore';
import NetworkBadge from '../components/wallet/NetworkBadge';
import ConnectButton from '../components/wallet/ConnectButton';
import { useNavigate } from 'react-router-dom';
import { DEMO_MODE, createDemoActions } from '../config/demoMode';
import { ROUND_TIMING } from '../config/weapons';

/**
 * GamePage — Active game view with all panels + round cycle.
 * In demo mode, auto-runs the full round lifecycle.
 */
export default function GamePage() {
    const { roundState, roundTimer, setRoundState, setRoundTimer, playerBalance } = useGameStore();
    const navigate = useNavigate();
    const timerRef = useRef(null);
    const [showBuyPanel, setShowBuyPanel] = useState(false);

    // ── Demo Mode: auto-cycle round phases ──────────────────────────
    useEffect(() => {
        if (!DEMO_MODE) return;

        // Start in LIVE if Quick Start was used
        const state = useGameStore.getState().roundState;
        if (state === 'LIVE') {
            setRoundTimer(ROUND_TIMING.ROUND_LIVE);
            startRoundTimer('LIVE');
        } else if (state === 'BUY') {
            setRoundTimer(ROUND_TIMING.BUY_PHASE);
            setShowBuyPanel(true);
            startRoundTimer('BUY');
        } else {
            // Start buy phase after 2s
            setTimeout(() => {
                setRoundState('BUY');
                setRoundTimer(ROUND_TIMING.BUY_PHASE);
                setShowBuyPanel(true);
                startRoundTimer('BUY');
            }, 2000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRoundTimer = useCallback((phase) => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const currentTimer = useGameStore.getState().roundTimer;

            if (currentTimer <= 1) {
                clearInterval(timerRef.current);
                transitionToNextPhase(phase);
            } else {
                setRoundTimer(currentTimer - 1);
            }
        }, 1000);
    }, []);

    const transitionToNextPhase = useCallback((currentPhase) => {
        switch (currentPhase) {
            case 'BUY':
                setRoundState('LIVE');
                setRoundTimer(ROUND_TIMING.ROUND_LIVE);
                setShowBuyPanel(false);
                startRoundTimer('LIVE');
                break;
            case 'LIVE':
                setRoundState('SETTLING');
                setRoundTimer(ROUND_TIMING.SETTLEMENT);
                startRoundTimer('SETTLING');
                break;
            case 'SETTLING':
                setRoundState('COMPLETE');
                setRoundTimer(ROUND_TIMING.RESULTS);
                startRoundTimer('COMPLETE');
                break;
            case 'COMPLETE':
                // New round
                setRoundState('BUY');
                setRoundTimer(ROUND_TIMING.BUY_PHASE);
                setShowBuyPanel(true);
                useTxStore.getState().resetRoundStats();
                startRoundTimer('BUY');
                break;
        }
    }, [startRoundTimer]);

    // Toggle buy panel with B key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'b' || e.key === 'B') {
                setShowBuyPanel(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <div style={{
            height: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* Top bar */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 16px',
                borderBottom: '1px solid #1a1a2a',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                        style={{ fontSize: '16px', fontWeight: '800', color: '#836ef9', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        ⟐ MONADSTRIKE
                    </span>
                    <NetworkBadge />
                    {DEMO_MODE && (
                        <span style={{
                            fontSize: '10px',
                            color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                            DEMO
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Buy panel toggle */}
                    <button
                        onClick={() => setShowBuyPanel(prev => !prev)}
                        style={{
                            background: showBuyPanel ? 'rgba(131, 110, 249, 0.2)' : 'transparent',
                            border: '1px solid #2a2a3a',
                            borderRadius: '8px',
                            color: showBuyPanel ? '#836ef9' : '#555',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    >
                        🔫 Shop [B]
                    </button>
                    {/* Balance */}
                    <div style={{
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#00ff9d'
                    }}>
                        💰 {playerBalance.toFixed(4)} MON
                    </div>
                    <ConnectButton />
                </div>
            </header>

            {/* Main game area */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '12px',
                padding: '12px',
                overflow: 'hidden'
            }}>
                {/* Left panel — Buy phase */}
                {showBuyPanel && (
                    <div style={{
                        flexShrink: 0,
                        animation: 'slide-in-right 0.3s ease-out',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '320px',
                        maxHeight: '100%'
                    }}>
                        <BuyPhasePanel />
                        <InventoryPanel />
                        <EconomySummary />
                    </div>
                )}

                {/* Center — Game canvas with overlays */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative' }}>
                        <PhaserGame width={800} height={600} />
                        <HUDOverlay />
                        <KillFeed />
                    </div>
                </div>

                {/* Right panel — Live tx feed */}
                <div style={{ flexShrink: 0, height: '100%' }}>
                    <TxFeedPanel />
                </div>
            </div>

            {/* Settlement overlay */}
            <SettlementOverlay />
        </div>
    );
}
