/**
 * MonadStrike — useTxQueue hook
 *
 * Manages the optimistic transaction queue for batch kill submissions
 * and provides queue stats for the HUD overlay.
 */
import { useCallback, useEffect, useRef } from 'react';
import useTxStore from '../store/txStore';
import useGameStore from '../store/gameStore';
import { getSignedContracts } from '../contracts';
import { KILL_BATCH_INTERVAL } from '../config/weapons';

export default function useTxQueue() {
    const {
        queue,
        pendingCount,
        confirmedCount,
        totalTxThisRound,
        avgConfirmTime,
        addTx,
        submitTx,
        clearCompleted,
        resetRoundStats
    } = useTxStore();

    const { killBatch, clearKillBatch } = useGameStore();
    const flushIntervalRef = useRef(null);

    // ── Flush kill batch to chain ────────────────────────────────────
    const flushKillBatch = useCallback(async () => {
        const batch = useGameStore.getState().killBatch;
        if (batch.length === 0) return;

        const txId = addTx('KILL_BATCH', `Flushing ${batch.length} kills to chain`);
        clearKillBatch();

        try {
            const { gameEconomy } = await getSignedContracts();

            if (batch.length === 1) {
                // Single kill — use registerKill
                await submitTx(txId, () =>
                    gameEconomy.registerKill(
                        batch[0].killer,
                        batch[0].victim,
                        batch[0].weapon
                    )
                );
            } else {
                // Multiple kills — use batch call
                await submitTx(txId, () =>
                    gameEconomy.registerKillBatch(
                        batch.map(k => k.killer),
                        batch.map(k => k.victim),
                        batch.map(k => k.weapon)
                    )
                );
            }
        } catch (err) {
            console.error('Kill batch flush failed:', err);
        }
    }, [addTx, submitTx, clearKillBatch]);

    // ── Auto-flush kills every KILL_BATCH_INTERVAL (10s) ────────────
    const startAutoFlush = useCallback(() => {
        if (flushIntervalRef.current) return;
        flushIntervalRef.current = setInterval(flushKillBatch, KILL_BATCH_INTERVAL);
    }, [flushKillBatch]);

    const stopAutoFlush = useCallback(() => {
        if (flushIntervalRef.current) {
            clearInterval(flushIntervalRef.current);
            flushIntervalRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopAutoFlush();
    }, [stopAutoFlush]);

    return {
        queue,
        pendingCount,
        confirmedCount,
        totalTxThisRound,
        avgConfirmTime,
        addTx,
        submitTx,
        flushKillBatch,
        startAutoFlush,
        stopAutoFlush,
        clearCompleted,
        resetRoundStats
    };
}
