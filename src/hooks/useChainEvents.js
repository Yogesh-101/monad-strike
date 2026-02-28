/**
 * MonadStrike — useChainEvents hook
 *
 * Listens to contract events on Monad and updates the tx feed + game state.
 * This makes the live feed panel show real on-chain activity.
 */
import { useEffect, useRef, useCallback } from 'react';
import { getContracts, getProvider } from '../contracts';
import useTxStore from '../store/txStore';
import useGameStore from '../store/gameStore';
import { WEAPON_LIST } from '../config/weapons';
import { ethers } from 'ethers';

export default function useChainEvents() {
    const { addTx, updateTx } = useTxStore();
    const { addKill, setRoundState } = useGameStore();
    const listenersRef = useRef(false);

    const startListening = useCallback(() => {
        if (listenersRef.current) return;
        listenersRef.current = true;

        const provider = getProvider();
        const contracts = getContracts(provider);

        if (!contracts.gameEconomy) {
            console.warn('GameEconomy contract not deployed — skipping event listeners');
            return;
        }

        // ── WeaponPurchased ────────────────────────────────────────────
        contracts.gameEconomy.on('WeaponPurchased', (player, weaponId, cost, timestamp) => {
            const weapon = WEAPON_LIST.find(w => w.id === Number(weaponId));
            const txId = addTx('BUY_WEAPON', `${weapon?.name || 'Weapon'} bought by ${player.slice(0, 8)}...`);
            updateTx(txId, {
                status: 'CONFIRMED',
                confirmTime: 0.5 // Events arrive after confirmation
            });
        });

        // ── KillRegistered ─────────────────────────────────────────────
        contracts.gameEconomy.on('KillRegistered', (killer, victim, weaponUsed, roundId) => {
            const weapon = WEAPON_LIST.find(w => w.id === Number(weaponUsed));
            addKill({
                killer: killer,
                victim: victim,
                weapon: weapon?.name || 'Unknown',
                weaponIcon: weapon?.icon || '🔫',
                roundId: Number(roundId),
                timestamp: Date.now()
            });
        });

        // ── RoundSettled ───────────────────────────────────────────────
        contracts.gameEconomy.on('RoundSettled', (roundId, winner, prizePool, txCount) => {
            const txId = addTx('SETTLEMENT', `Round ${roundId} settled — ${ethers.formatEther(prizePool)} MON prize pool`);
            updateTx(txId, { status: 'CONFIRMED', confirmTime: 0.3 });
        });

        // ── RoundStateChanged ─────────────────────────────────────────
        contracts.gameEconomy.on('RoundStateChanged', (roundId, newState) => {
            const states = ['LOBBY', 'BUY', 'LIVE', 'SETTLING', 'COMPLETE'];
            setRoundState(states[newState] || 'LOBBY');
        });

        // ── BetPlaced ──────────────────────────────────────────────────
        if (contracts.bettingPool) {
            contracts.bettingPool.on('BetPlaced', (bettor, roundId, team, amount) => {
                const txId = addTx('BET', `Bet ${ethers.formatEther(amount)} MON by ${bettor.slice(0, 8)}...`);
                updateTx(txId, { status: 'CONFIRMED', confirmTime: 0.4 });
            });
        }

        console.log('⛓ Chain event listeners active');
    }, [addTx, updateTx, addKill, setRoundState]);

    const stopListening = useCallback(() => {
        if (!listenersRef.current) return;
        listenersRef.current = false;

        const provider = getProvider();
        const contracts = getContracts(provider);
        if (contracts.gameEconomy) {
            contracts.gameEconomy.removeAllListeners();
        }
        if (contracts.bettingPool) {
            contracts.bettingPool.removeAllListeners();
        }
        console.log('⛓ Chain event listeners stopped');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopListening();
    }, [stopListening]);

    return {
        startListening,
        stopListening
    };
}
