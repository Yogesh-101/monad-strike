/**
 * MonadStrike — useGameEconomy hook
 *
 * Wraps contract calls with the optimistic tx queue.
 * Every action fires immediately in the UI, then syncs to chain.
 *
 * When contracts aren't deployed, falls back to Demo Mode
 * which simulates everything locally.
 */
import { useCallback } from 'react';
import { ethers } from 'ethers';
import { getSignedContracts } from '../contracts';
import useTxStore from '../store/txStore';
import useGameStore from '../store/gameStore';
import toast from 'react-hot-toast';
import { WEAPONS, WEAPON_LIST } from '../config/weapons';
import { DEMO_MODE, createDemoActions } from '../config/demoMode';

export default function useGameEconomy() {
    const { addTx, submitTx } = useTxStore();
    const { addToInventory, setPlayerBalance } = useGameStore();

    // ── Deposit MON ──────────────────────────────────────────────────
    const deposit = useCallback(async (amountEth) => {
        if (DEMO_MODE) {
            try {
                const demo = createDemoActions();
                await demo.deposit(amountEth);
                toast.success(`Deposited ${amountEth} MON (Demo Mode)`);
            } catch (err) {
                toast.error(`Deposit failed: ${err.message}`);
            }
            return;
        }

        const txId = addTx('DEPOSIT', `Depositing ${amountEth} MON`);
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) throw new Error('GameEconomy contract not deployed');
            await submitTx(txId, () =>
                gameEconomy.deposit({ value: ethers.parseEther(amountEth.toString()) })
            );
            toast.success(`Deposited ${amountEth} MON`);
        } catch (err) {
            toast.error(`Deposit failed: ${err.reason || err.message}`);
        }
    }, [addTx, submitTx]);

    // ── Join Round ───────────────────────────────────────────────────
    const joinRound = useCallback(async () => {
        if (DEMO_MODE) {
            try {
                const demo = createDemoActions();
                await demo.joinRound();
                toast.success('Joined the round! (Demo Mode)');
            } catch (err) {
                toast.error(`Join failed: ${err.message}`);
            }
            return;
        }

        const txId = addTx('JOIN_ROUND', 'Joining round...');
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) throw new Error('GameEconomy contract not deployed');
            await submitTx(txId, () =>
                gameEconomy.joinRound({ value: ethers.parseEther('0.005') })
            );
            toast.success('Joined the round!');
        } catch (err) {
            toast.error(`Join failed: ${err.reason || err.message}`);
        }
    }, [addTx, submitTx]);

    // ── Buy Weapon ───────────────────────────────────────────────────
    const buyWeapon = useCallback(async (weaponId) => {
        const weapon = WEAPON_LIST.find(w => w.id === weaponId);
        if (!weapon) return;

        if (DEMO_MODE) {
            try {
                const demo = createDemoActions();
                await demo.buyWeapon(weaponId);
                toast.success(`${weapon.name} purchased! (Demo Mode)`);
            } catch (err) {
                toast.error(`Purchase failed: ${err.message}`);
            }
            return;
        }

        // Optimistic: add to inventory immediately
        addToInventory(weapon);
        toast(`Buying ${weapon.name}...`, { icon: weapon.icon });

        const txId = addTx('BUY_WEAPON', `${weapon.name} — ${weapon.cost} MON`);
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) throw new Error('GameEconomy contract not deployed');
            await submitTx(txId, () => gameEconomy.buyWeapon(weaponId));
            toast.success(`${weapon.name} purchased!`);
        } catch (err) {
            toast.error(`Purchase failed: ${err.reason || err.message}`);
        }
    }, [addTx, submitTx, addToInventory]);

    // ── Claim Rewards ────────────────────────────────────────────────
    const claimRewards = useCallback(async () => {
        if (DEMO_MODE) {
            try {
                const demo = createDemoActions();
                await demo.claimRewards();
                toast.success('Rewards claimed! (Demo Mode)');
            } catch (err) {
                toast.error(`Claim failed: ${err.message}`);
            }
            return;
        }

        const txId = addTx('CLAIM', 'Claiming rewards...');
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) throw new Error('GameEconomy contract not deployed');
            await submitTx(txId, () => gameEconomy.claimRewards());
            setPlayerBalance(0);
            toast.success('Rewards claimed!');
        } catch (err) {
            toast.error(`Claim failed: ${err.reason || err.message}`);
        }
    }, [addTx, submitTx, setPlayerBalance]);

    // ── Place Bet ────────────────────────────────────────────────────
    const placeBet = useCallback(async (roundId, teamAddress, amountEth) => {
        if (DEMO_MODE) {
            try {
                const demo = createDemoActions();
                await demo.placeBet(roundId, teamAddress, amountEth);
                toast.success('Bet placed! (Demo Mode)');
            } catch (err) {
                toast.error(`Bet failed: ${err.message}`);
            }
            return;
        }

        const txId = addTx('BET', `Bet ${amountEth} MON on ${teamAddress.slice(0, 8)}...`);
        try {
            const { bettingPool } = await getSignedContracts();
            if (!bettingPool) throw new Error('BettingPool contract not deployed');
            await submitTx(txId, () =>
                bettingPool.placeBet(roundId, teamAddress, {
                    value: ethers.parseEther(amountEth.toString())
                })
            );
            toast.success('Bet placed!');
        } catch (err) {
            toast.error(`Bet failed: ${err.reason || err.message}`);
        }
    }, [addTx, submitTx]);

    // ── Read-only: fetch player balance ──────────────────────────────
    const fetchBalance = useCallback(async (playerAddress) => {
        if (DEMO_MODE) {
            return useGameStore.getState().playerBalance;
        }
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) return 0;
            const bal = await gameEconomy.getPlayerBalance(playerAddress);
            const formatted = parseFloat(ethers.formatEther(bal));
            setPlayerBalance(formatted);
            return formatted;
        } catch (err) {
            console.error('Failed to fetch balance:', err);
            return 0;
        }
    }, [setPlayerBalance]);

    // ── Read-only: fetch current round ───────────────────────────────
    const fetchCurrentRound = useCallback(async () => {
        if (DEMO_MODE) {
            return { id: 1, state: 0, winner: null, startTime: Date.now(), prizePool: 0, totalKills: 0, txCount: 0 };
        }
        try {
            const { gameEconomy } = await getSignedContracts();
            if (!gameEconomy) return null;
            return await gameEconomy.getCurrentRound();
        } catch (err) {
            console.error('Failed to fetch round:', err);
            return null;
        }
    }, []);

    return {
        deposit,
        joinRound,
        buyWeapon,
        claimRewards,
        placeBet,
        fetchBalance,
        fetchCurrentRound
    };
}
