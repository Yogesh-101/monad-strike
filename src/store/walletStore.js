// MonadStrike — Wallet Store (Zustand)
// Manages wallet connection state, balance, and network
import { create } from 'zustand';

const useWalletStore = create((set) => ({
    address: null,
    balance: '0',
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,

    setWallet: (address, chainId) => set({
        address,
        chainId,
        isConnected: !!address,
        isCorrectNetwork: chainId === '0x279f' || chainId === 10143
    }),

    setBalance: (balance) => set({ balance }),

    disconnect: () => set({
        address: null,
        balance: '0',
        chainId: null,
        isConnected: false,
        isCorrectNetwork: false
    })
}));

export default useWalletStore;
