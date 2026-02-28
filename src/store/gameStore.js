// MonadStrike — Game Store (Zustand)
// Manages round state, players, kills, and game phases
import { create } from 'zustand';

const useGameStore = create((set) => ({
    // Round state
    currentRound: null,
    roundState: 'LOBBY', // LOBBY | BUY | LIVE | SETTLING | COMPLETE
    roundTimer: 0,

    // Players
    players: [],
    localPlayer: null,

    // Kills
    killFeed: [],
    killBatch: [],

    // Economy
    inventory: [],
    playerBalance: 0,

    // Actions
    setRoundState: (state) => set({ roundState: state }),
    setRoundTimer: (timer) => set({ roundTimer: timer }),
    addPlayer: (player) => set((s) => ({ players: [...s.players, player] })),
    removePlayer: (wallet) => set((s) => ({
        players: s.players.filter(p => p.wallet !== wallet)
    })),
    addKill: (kill) => set((s) => ({
        killFeed: [kill, ...s.killFeed].slice(0, 20),
        killBatch: [...s.killBatch, kill]
    })),
    clearKillBatch: () => set({ killBatch: [] }),
    addToInventory: (weapon) => set((s) => ({
        inventory: [...s.inventory, weapon]
    })),
    setPlayerBalance: (balance) => set({ playerBalance: balance }),
    resetRound: () => set({
        roundState: 'LOBBY',
        roundTimer: 0,
        killFeed: [],
        killBatch: [],
        inventory: []
    })
}));

export default useGameStore;
