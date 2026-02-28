import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import GameScene from './scenes/GameScene';
import useGameStore from '../store/gameStore';
import useTxStore from '../store/txStore';
import { DEMO_MODE } from '../config/demoMode';

/**
 * PhaserGame — React wrapper that mounts the Phaser canvas
 * into a DOM container and bridges Phaser events ↔ React state.
 *
 * In demo mode, kills generate simulated tx entries in the live feed.
 */
export default function PhaserGame({ width = 800, height = 600 }) {
    const gameRef = useRef(null);
    const containerRef = useRef(null);
    const addKill = useGameStore(s => s.addKill);
    const setPlayerBalance = useGameStore(s => s.setPlayerBalance);

    useEffect(() => {
        if (gameRef.current || !containerRef.current) return;

        const config = {
            type: Phaser.AUTO,
            width,
            height,
            parent: containerRef.current,
            backgroundColor: '#0a0a0f',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [PreloadScene, GameScene],
            banner: false,
            pixelArt: true,
            input: {
                keyboard: {
                    target: containerRef.current
                }
            }
        };

        gameRef.current = new Phaser.Game(config);

        // ── Bridge Phaser events → React ────────────────────────────
        // (Handled by game/systems tools like EconomyBridge)

        // Cleanup on unmount
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [width, height, addKill, setPlayerBalance]);

    // Focus the game container on mount for keyboard input
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    return (
        <div
            ref={containerRef}
            id="phaser-game-container"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #2a2a3a',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                outline: 'none'
            }}
            tabIndex={0}
        />
    );
}
