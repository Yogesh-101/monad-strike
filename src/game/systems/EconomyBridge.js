import useTxStore from '../../store/txStore';
import useGameStore from '../../store/gameStore';
import { DEMO_MODE } from '../../config/demoMode';
import { WEAPON_LIST } from '../../config/weapons';

/**
 * EconomyBridge — Bridges Phaser game events → tx queue.
 *
 * Called from GameScene when kills, purchases, or other
 * economy events happen. In demo mode, simulates chain txs.
 * In live mode, submits to the actual contracts.
 */
export default class EconomyBridge {
    constructor() {
        this.killBatch = [];
        this.batchTimer = null;
        this.BATCH_INTERVAL = 10000; // Flush kill batch every 10s
    }

    /**
     * Register a kill — add to batch and optionally flush
     */
    registerKill(killer, victim, weaponId) {
        const weapon = WEAPON_LIST.find(w => w.id === weaponId) || WEAPON_LIST[0];

        // Add to kill feed in React
        useGameStore.getState().addKill({
            killer: killer || 'local_player',
            victim: victim || 'bot',
            weapon: weapon.name,
            weaponIcon: weapon.icon,
            roundId: 1,
            timestamp: Date.now()
        });

        // Award kill reward
        if (DEMO_MODE) {
            const currentBalance = useGameStore.getState().playerBalance;
            useGameStore.getState().setPlayerBalance(currentBalance + weapon.killReward);

            // Generate demo tx
            this._createDemoTx('KILL_BATCH', `Kill: ${(victim || 'bot').slice(0, 10)} (${weapon.name})`);
        }

        this.killBatch.push({ killer, victim, weaponId, timestamp: Date.now() });

        // Auto-flush if batch is large
        if (this.killBatch.length >= 5) {
            this.flushKillBatch();
        }
    }

    /**
     * Register a weapon purchase
     */
    registerPurchase(weaponId) {
        const weapon = WEAPON_LIST.find(w => w.id === weaponId) || WEAPON_LIST[0];

        if (DEMO_MODE) {
            const { playerBalance, setPlayerBalance, addToInventory } = useGameStore.getState();
            if (playerBalance >= weapon.cost) {
                setPlayerBalance(playerBalance - weapon.cost);
                addToInventory(weapon);
                this._createDemoTx('BUY_WEAPON', `${weapon.name} — ${weapon.cost} MON`);
                return true;
            }
            return false;
        }

        return true; // Live mode handled by useGameEconomy hook
    }

    /**
     * Flush accumulated kills to chain (batched for gas efficiency)
     */
    flushKillBatch() {
        if (this.killBatch.length === 0) return;

        const batch = [...this.killBatch];
        this.killBatch = [];

        if (DEMO_MODE) {
            this._createDemoTx('KILL_BATCH', `Batch: ${batch.length} kills registered`);
        }
    }

    /**
     * Start periodic batch flushing
     */
    startBatchTimer() {
        if (this.batchTimer) clearInterval(this.batchTimer);
        this.batchTimer = setInterval(() => {
            this.flushKillBatch();
        }, this.BATCH_INTERVAL);
    }

    /**
     * Stop batch flushing
     */
    stopBatchTimer() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
        // Flush remaining kills
        this.flushKillBatch();
    }

    /**
     * Generate a demo mode transaction with fake hash and Monad-like timings
     */
    _createDemoTx(type, description) {
        const { addTx, updateTx } = useTxStore.getState();
        const txId = addTx(type, description);

        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];

        updateTx(txId, { status: 'SUBMITTED', hash });

        // Simulate Monad confirmation (0.3-1s)
        setTimeout(() => {
            const confirmTime = (0.3 + Math.random() * 0.7);
            updateTx(txId, { status: 'CONFIRMED', confirmTime });
        }, 300 + Math.random() * 700);

        return txId;
    }

    destroy() {
        this.stopBatchTimer();
    }
}
