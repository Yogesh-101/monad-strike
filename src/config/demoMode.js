/**
 * MonadStrike — Demo Mode
 *
 * When contracts aren't deployed, the app runs in Demo Mode.
 * All economy actions are simulated locally with fake tx hashes
 * and timers that mimic real Monad confirmation times (~0.5-1s).
 *
 * This lets the entire game run end-to-end without a chain deployment,
 * which is perfect for hackathon presentations and local testing.
 */
import useTxStore from '../store/txStore';
import useGameStore from '../store/gameStore';
import { WEAPON_LIST } from '../config/weapons';

// Check if contracts are deployed
export function isContractsDeployed() {
    const gameEconomy = import.meta.env.VITE_GAME_ECONOMY_ADDRESS;
    return gameEconomy && gameEconomy.length > 2; // not empty or just "0x"
}

export const DEMO_MODE = !isContractsDeployed();

/**
 * Generate a fake tx hash that looks realistic
 */
function fakeTxHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * 16)];
    }
    return hash;
}

/**
 * Simulate a chain transaction with a realistic delay
 */
function simulateTx(delayMs = null) {
    const delay = delayMs || (400 + Math.random() * 800); // 0.4-1.2s like real Monad
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                hash: fakeTxHash(),
                wait: () => Promise.resolve({ status: 1 })
            });
        }, delay);
    });
}

/**
 * Demo-mode implementations of all economy actions.
 * These mirror the real contract calls but execute locally.
 */
export function createDemoActions() {
    const { addTx, updateTx } = useTxStore.getState();
    const store = useGameStore.getState;

    const demoSubmitTx = async (txId, delayMs) => {
        const txStore = useTxStore.getState();
        txStore.updateTx(txId, { status: 'SUBMITTED', hash: fakeTxHash() });

        await new Promise(r => setTimeout(r, delayMs || (400 + Math.random() * 800)));

        const confirmTime = (Date.now() - (txStore.queue.find(t => t.id === txId)?.timestamp || Date.now())) / 1000;
        txStore.updateTx(txId, { status: 'CONFIRMED', confirmTime });
    };

    return {
        deposit: async (amountEth) => {
            const { addTx } = useTxStore.getState();
            const txId = addTx('DEPOSIT', `Depositing ${amountEth} MON`);
            const currentBalance = useGameStore.getState().playerBalance;
            useGameStore.getState().setPlayerBalance(currentBalance + parseFloat(amountEth));
            await demoSubmitTx(txId);
            return true;
        },

        joinRound: async () => {
            const { addTx } = useTxStore.getState();
            const txId = addTx('JOIN_ROUND', 'Joining round...');
            // Add local player to players list
            const walletStore = (await import('../store/walletStore')).default;
            const address = walletStore.getState().address;
            useGameStore.getState().addPlayer({
                wallet: address || '0xDemoPlayer',
                hp: 100,
                weapon: 0,
                team: 'alpha'
            });
            await demoSubmitTx(txId);
            return true;
        },

        buyWeapon: async (weaponId) => {
            const weapon = WEAPON_LIST.find(w => w.id === weaponId);
            if (!weapon) return;

            const { addTx } = useTxStore.getState();
            const { addToInventory, playerBalance, setPlayerBalance } = useGameStore.getState();

            if (playerBalance < weapon.cost) {
                throw new Error(`Not enough MON. Need ${weapon.cost}, have ${playerBalance.toFixed(4)}`);
            }

            addToInventory(weapon);
            setPlayerBalance(playerBalance - weapon.cost);

            const txId = addTx('BUY_WEAPON', `${weapon.name} — ${weapon.cost} MON`);
            await demoSubmitTx(txId);
            return true;
        },

        claimRewards: async () => {
            const { addTx } = useTxStore.getState();
            const txId = addTx('CLAIM', 'Claiming rewards...');
            useGameStore.getState().setPlayerBalance(0);
            await demoSubmitTx(txId);
            return true;
        },

        placeBet: async (roundId, teamAddress, amountEth) => {
            const { addTx } = useTxStore.getState();
            const txId = addTx('BET', `Bet ${amountEth} MON on ${teamAddress.slice(0, 8)}...`);
            await demoSubmitTx(txId);
            return true;
        },

        fetchBalance: async () => {
            return useGameStore.getState().playerBalance;
        },

        fetchCurrentRound: async () => {
            return {
                id: 1,
                state: 0,
                winner: '0x0000000000000000000000000000000000000000',
                startTime: Math.floor(Date.now() / 1000),
                prizePool: 0n,
                totalKills: 0,
                txCount: 0
            };
        }
    };
}
