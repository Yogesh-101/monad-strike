// MonadStrike — Monad Network Configuration
export const MONAD_TESTNET = {
    chainId: '0x279F', // 10143 decimal
    chainName: 'Monad Testnet',
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com'],
    nativeCurrency: {
        name: 'MON',
        symbol: 'MON',
        decimals: 18
    }
};

// Contract addresses — populated after deployment
export const CONTRACTS = {
    gameEconomy: import.meta.env.VITE_GAME_ECONOMY_ADDRESS || '',
    weaponNFT: import.meta.env.VITE_WEAPON_NFT_ADDRESS || '',
    bettingPool: import.meta.env.VITE_BETTING_POOL_ADDRESS || '',
    playerStats: import.meta.env.VITE_PLAYER_STATS_ADDRESS || ''
};

export const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:3001';
export const MONAD_RPC = import.meta.env.VITE_MONAD_RPC || 'https://testnet-rpc.monad.xyz';
export const MONAD_EXPLORER = import.meta.env.VITE_MONAD_EXPLORER || 'https://testnet.monadexplorer.com';
