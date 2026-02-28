/**
 * MonadStrike — Contract Instances
 *
 * Creates ethers.js v6 contract instances connected to the
 * deployed contracts on Monad testnet. ABIs are loaded from
 * Hardhat compilation artifacts.
 */
import { ethers } from 'ethers';
import { MONAD_TESTNET, CONTRACTS, MONAD_RPC } from '../config/monad.js';

// ── ABI imports (from Hardhat artifacts — paste after compilation) ────
// These are minimal ABIs covering only the functions the frontend needs.
// The full ABIs are in /artifacts/ after `npx hardhat compile`.

export const GameEconomyABI = [
    "function deposit() payable",
    "function joinRound() payable",
    "function buyWeapon(uint8 weaponId)",
    "function claimRewards()",
    "function getPlayerBalance(address player) view returns (uint256)",
    "function getCurrentRound() view returns (tuple(uint256 id, uint8 state, address winner, uint256 startTime, uint256 prizePool, uint256 totalKills, uint256 txCount))",
    "function getRoundPlayers(uint256 roundId) view returns (address[])",
    "function getRoundPlayerCount(uint256 roundId) view returns (uint256)",
    "function isInRound(uint256 roundId, address player) view returns (bool)",
    "function roundKills(uint256, address) view returns (uint256)",
    "function currentRoundId() view returns (uint256)",
    "function weapons(uint8) view returns (tuple(uint256 cost, uint256 damage, uint256 killReward, bool exists))",
    "event PlayerJoined(uint256 indexed roundId, address indexed player, uint256 entryFee)",
    "event WeaponPurchased(address indexed player, uint8 weaponId, uint256 cost, uint256 timestamp)",
    "event KillRegistered(address indexed killer, address indexed victim, uint8 weaponUsed, uint256 roundId)",
    "event RoundSettled(uint256 indexed roundId, address indexed winner, uint256 prizePool, uint256 txCount)",
    "event RewardClaimed(address indexed player, uint256 amount)",
    "event RoundStateChanged(uint256 indexed roundId, uint8 newState)",
    "event BalanceDeposited(address indexed player, uint256 amount)"
];

export const WeaponNFTABI = [
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function getLoadout(address player) view returns (uint256[])",
    "function weaponName(uint256 tokenId) view returns (string)",
    "event WeaponMinted(address indexed to, uint256 indexed tokenId, uint256 amount)",
    "event WeaponBurned(address indexed from, uint256 indexed tokenId, uint256 amount)"
];

export const BettingPoolABI = [
    "function placeBet(uint256 roundId, address team) payable",
    "function claimWinnings(uint256 roundId)",
    "function getRoundPool(uint256 roundId) view returns (tuple(uint256 totalPool, bool settled, address winningTeam, uint256 winningTotal))",
    "function getBetCount(uint256 roundId) view returns (uint256)",
    "event BetPlaced(address indexed bettor, uint256 indexed roundId, address indexed team, uint256 amount)",
    "event BetsSettled(uint256 indexed roundId, address indexed winner, uint256 totalPool)"
];

export const PlayerStatsABI = [
    "function getStats(address player) view returns (tuple(uint256 totalKills, uint256 totalDeaths, uint256 roundsWon, uint256 roundsPlayed, uint256 totalEarned, uint256 totalSpent, uint256 totalTxCount))",
    "function getKDRatio(address player) view returns (uint256)",
    "function getLeaderboard(uint256 topN) view returns (tuple(address player, uint256 totalKills, uint256 totalDeaths, uint256 roundsWon, uint256 totalEarned)[])",
    "function totalPlayers() view returns (uint256)",
    "event StatsUpdated(address indexed player, uint256 kills, uint256 deaths, bool won, uint256 earned)"
];

// ── Provider + Signer helpers ────────────────────────────────────────

/**
 * Get a read-only provider for Monad testnet
 */
export function getProvider() {
    return new ethers.JsonRpcProvider(MONAD_RPC);
}

/**
 * Get a signer from MetaMask (browser wallet)
 */
export async function getSigner() {
    if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
}

// ── Contract Instance Factory ────────────────────────────────────────

/**
 * Get contract instances. Pass a signer for write operations,
 * or nothing for read-only.
 */
export function getContracts(signerOrProvider) {
    const provider = signerOrProvider || getProvider();

    return {
        gameEconomy: CONTRACTS.gameEconomy
            ? new ethers.Contract(CONTRACTS.gameEconomy, GameEconomyABI, provider)
            : null,
        weaponNFT: CONTRACTS.weaponNFT
            ? new ethers.Contract(CONTRACTS.weaponNFT, WeaponNFTABI, provider)
            : null,
        bettingPool: CONTRACTS.bettingPool
            ? new ethers.Contract(CONTRACTS.bettingPool, BettingPoolABI, provider)
            : null,
        playerStats: CONTRACTS.playerStats
            ? new ethers.Contract(CONTRACTS.playerStats, PlayerStatsABI, provider)
            : null
    };
}

/**
 * Get contract instances connected to the user's wallet signer
 */
export async function getSignedContracts() {
    const signer = await getSigner();
    return getContracts(signer);
}
