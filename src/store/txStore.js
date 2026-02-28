// MonadStrike — Transaction Queue Store (Zustand)
// The optimistic tx queue — the most important piece of the architecture
//
// Tx lifecycle: PENDING → SUBMITTED → CONFIRMED | FAILED
//
// On action (e.g. buyWeapon):
// 1. Add tx to queue with status PENDING, assign optimistic ID
// 2. Update game state immediately (don't wait for chain)
// 3. Submit tx to Monad in background
// 4. On receipt: update status to CONFIRMED, update UI badge
// 5. On error: status FAILED, show toast, revert optimistic state if critical
import { create } from 'zustand';

let txIdCounter = 0;

const useTxStore = create((set, get) => ({
    queue: [],
    pendingCount: 0,
    confirmedCount: 0,
    failedCount: 0,
    totalTxThisRound: 0,
    avgConfirmTime: 0,

    addTx: (type, description) => {
        const id = ++txIdCounter;
        const tx = {
            id,
            type,
            description,
            status: 'PENDING',
            hash: null,
            timestamp: Date.now(),
            confirmTime: null
        };
        set((s) => ({
            queue: [tx, ...s.queue].slice(0, 100),
            pendingCount: s.pendingCount + 1,
            totalTxThisRound: s.totalTxThisRound + 1
        }));
        return id;
    },

    updateTx: (id, updates) => set((s) => {
        const queue = s.queue.map(tx =>
            tx.id === id ? { ...tx, ...updates } : tx
        );
        const pending = queue.filter(tx => tx.status === 'PENDING' || tx.status === 'SUBMITTED').length;
        const confirmed = queue.filter(tx => tx.status === 'CONFIRMED').length;
        const failed = queue.filter(tx => tx.status === 'FAILED').length;

        // Calculate average confirmation time
        const confirmedTxs = queue.filter(tx => tx.confirmTime);
        const avg = confirmedTxs.length > 0
            ? confirmedTxs.reduce((sum, tx) => sum + tx.confirmTime, 0) / confirmedTxs.length
            : 0;

        return {
            queue,
            pendingCount: pending,
            confirmedCount: confirmed,
            failedCount: failed,
            avgConfirmTime: avg
        };
    }),

    submitTx: async (id, contractCall) => {
        const { updateTx } = get();
        try {
            updateTx(id, { status: 'SUBMITTED' });
            const tx = await contractCall();
            updateTx(id, { hash: tx.hash, status: 'SUBMITTED' });
            const receipt = await tx.wait();
            const confirmTime = (Date.now() - get().queue.find(t => t.id === id)?.timestamp) / 1000;
            updateTx(id, {
                status: 'CONFIRMED',
                confirmTime
            });
            return receipt;
        } catch (error) {
            updateTx(id, { status: 'FAILED' });
            throw error;
        }
    },

    clearCompleted: () => set((s) => ({
        queue: s.queue.filter(tx => tx.status === 'PENDING' || tx.status === 'SUBMITTED')
    })),

    resetRoundStats: () => set({
        totalTxThisRound: 0,
        avgConfirmTime: 0
    })
}));

export default useTxStore;
