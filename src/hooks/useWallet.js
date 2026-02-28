/**
 * MonadStrike — useWallet hook
 *
 * Handles MetaMask connection, network switching to Monad testnet,
 * and balance tracking. Updates the Zustand walletStore.
 */
import { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import useWalletStore from '../store/walletStore';
import { MONAD_TESTNET } from '../config/monad';

export default function useWallet() {
    const {
        address,
        balance,
        chainId,
        isConnected,
        isCorrectNetwork,
        setWallet,
        setBalance,
        disconnect: disconnectStore
    } = useWalletStore();

    // ── Connect to MetaMask ──────────────────────────────────────────
    const connect = useCallback(async () => {
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            setWallet(accounts[0], currentChainId);
            await refreshBalance(accounts[0]);
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            throw err;
        }
    }, [setWallet]);

    // ── Switch to Monad testnet ──────────────────────────────────────
    const switchNetwork = useCallback(async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MONAD_TESTNET.chainId }]
            });
        } catch (switchError) {
            // Chain not added to MetaMask yet — add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: MONAD_TESTNET.chainId,
                        chainName: MONAD_TESTNET.chainName,
                        rpcUrls: MONAD_TESTNET.rpcUrls,
                        blockExplorerUrls: MONAD_TESTNET.blockExplorerUrls,
                        nativeCurrency: MONAD_TESTNET.nativeCurrency
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }, []);

    // ── Disconnect ───────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        disconnectStore();
    }, [disconnectStore]);

    // ── Refresh balance ──────────────────────────────────────────────
    const refreshBalance = useCallback(async (addr) => {
        if (!window.ethereum || !addr) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const bal = await provider.getBalance(addr);
            setBalance(ethers.formatEther(bal));
        } catch (err) {
            console.error('Failed to get balance:', err);
        }
    }, [setBalance]);

    // ── Listen for account/network changes ───────────────────────────
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnectStore();
            } else {
                window.ethereum.request({ method: 'eth_chainId' }).then((chainId) => {
                    setWallet(accounts[0], chainId);
                    refreshBalance(accounts[0]);
                });
            }
        };

        const handleChainChanged = (newChainId) => {
            if (address) {
                setWallet(address, newChainId);
                refreshBalance(address);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
            if (accounts.length > 0) {
                window.ethereum.request({ method: 'eth_chainId' }).then((chainId) => {
                    setWallet(accounts[0], chainId);
                    refreshBalance(accounts[0]);
                });
            }
        });

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [address, setWallet, disconnectStore, refreshBalance]);

    return {
        address,
        balance,
        chainId,
        isConnected,
        isCorrectNetwork,
        connect,
        disconnect,
        switchNetwork,
        refreshBalance: () => refreshBalance(address)
    };
}
