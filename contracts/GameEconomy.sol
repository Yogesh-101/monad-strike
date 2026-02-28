// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameEconomy
 * @notice Core economy contract for MonadStrike.
 *         Handles round lifecycle, weapon purchases, kill registration,
 *         and settlement with reward payouts.
 *
 *         Every economy action emits an event so the live tx feed
 *         can display it in real time.
 */

// ── Interfaces for linked contracts ─────────────────────────────────
interface IWeaponNFT {
    function mint(address to, uint256 tokenId, uint256 amount) external;
    function burn(address from, uint256 tokenId, uint256 amount) external;
    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) external;
    function getLoadout(address player) external view returns (uint256[] memory);
}

interface IPlayerStats {
    function updateStats(
        address player,
        uint256 kills,
        uint256 deaths,
        bool won,
        uint256 earned,
        uint256 spent,
        uint256 txCount
    ) external;
}

contract GameEconomy is Ownable, ReentrancyGuard {

    // ── Types ────────────────────────────────────────────────────────────
    enum RoundState { LOBBY, BUY, LIVE, SETTLING, COMPLETE }

    struct WeaponConfig {
        uint256 cost;       // in wei
        uint256 damage;
        uint256 killReward; // in wei
        bool exists;
    }

    struct RoundInfo {
        uint256 id;
        RoundState state;
        address winner;
        uint256 startTime;
        uint256 prizePool;
        uint256 totalKills;
        uint256 txCount;
    }

    // Internal round data (mappings can't be in memory structs, so we split)
    struct RoundData {
        uint256 id;
        address[] players;
        RoundState state;
        address winner;
        uint256 startTime;
        uint256 prizePool;
        uint256 totalKills;
        uint256 txCount;
    }

    // ── State ────────────────────────────────────────────────────────────
    mapping(address => uint256) public playerBalance;
    mapping(uint256 => RoundData) internal rounds;
    mapping(uint256 => mapping(address => bool)) public isInRound;
    mapping(uint256 => mapping(address => uint256)) public roundKills;
    mapping(uint256 => mapping(address => uint256)) public roundDeaths;
    mapping(uint256 => mapping(address => uint256)) public roundEarned;
    mapping(uint256 => mapping(address => uint256)) public roundSpent;
    mapping(uint256 => mapping(address => uint256)) public roundTxCount;

    uint256 public currentRoundId;

    IWeaponNFT public weaponNFT;
    IPlayerStats public playerStatsContract;

    // Weapon registry: id → config
    mapping(uint8 => WeaponConfig) public weapons;
    uint8 public totalWeapons;

    // Entry fee to join a round
    uint256 public constant ENTRY_FEE = 0.005 ether;
    // Bonus for losing team members
    uint256 public constant ROUND_LOSS_BONUS = 0.002 ether;
    // Max players per round
    uint256 public constant MAX_PLAYERS = 10;
    // Min players to start
    uint256 public constant MIN_PLAYERS = 2;

    // ── Events ───────────────────────────────────────────────────────────
    event RoundCreated(uint256 indexed roundId);
    event PlayerJoined(uint256 indexed roundId, address indexed player, uint256 entryFee);
    event RoundStateChanged(uint256 indexed roundId, RoundState newState);
    event WeaponPurchased(address indexed player, uint8 weaponId, uint256 cost, uint256 timestamp);
    event KillRegistered(address indexed killer, address indexed victim, uint8 weaponUsed, uint256 roundId);
    event RoundSettled(uint256 indexed roundId, address indexed winner, uint256 prizePool, uint256 txCount);
    event RewardClaimed(address indexed player, uint256 amount);
    event BalanceDeposited(address indexed player, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────
    error RoundFull();
    error RoundNotInState(RoundState expected, RoundState actual);
    error AlreadyInRound();
    error NotInRound();
    error InsufficientBalance(uint256 required, uint256 available);
    error InvalidWeapon(uint8 weaponId);
    error TransferFailed();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(address _weaponNFT, address _playerStats) Ownable(msg.sender) {
        weaponNFT = IWeaponNFT(_weaponNFT);
        playerStatsContract = IPlayerStats(_playerStats);

        // Register weapons (costs in wei, matching spec)
        _registerWeapon(0, 0.001 ether, 25,  0.001 ether); // Glock
        _registerWeapon(1, 0.003 ether, 55,  0.001 ether); // Desert Eagle
        _registerWeapon(2, 0.006 ether, 35,  0.003 ether); // MP5
        _registerWeapon(3, 0.012 ether, 80,  0.002 ether); // AK-47
        _registerWeapon(4, 0.018 ether, 120, 0.001 ether); // AWP
        _registerWeapon(5, 0.002 ether, 60,  0.002 ether); // HE Grenade
        _registerWeapon(6, 0.003 ether, 0,   0 ether);     // Armor

        // Create initial round
        _createRound();
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    function _registerWeapon(uint8 id, uint256 cost, uint256 damage, uint256 killReward) internal {
        weapons[id] = WeaponConfig(cost, damage, killReward, true);
        totalWeapons = id + 1;
    }

    function _createRound() internal {
        currentRoundId++;
        RoundData storage r = rounds[currentRoundId];
        r.id = currentRoundId;
        r.state = RoundState.LOBBY;
        r.startTime = block.timestamp;
        emit RoundCreated(currentRoundId);
    }

    function _requireState(uint256 roundId, RoundState expected) internal view {
        if (rounds[roundId].state != expected) {
            revert RoundNotInState(expected, rounds[roundId].state);
        }
    }

    // ── Player actions ───────────────────────────────────────────────────

    /// @notice Deposit MON into the game economy
    function deposit() external payable {
        playerBalance[msg.sender] += msg.value;
        emit BalanceDeposited(msg.sender, msg.value);
    }

    /// @notice Join the current round with entry fee
    function joinRound() external payable nonReentrant {
        uint256 rid = currentRoundId;
        RoundData storage r = rounds[rid];

        // Allow joining during LOBBY or BUY phase
        require(
            r.state == RoundState.LOBBY || r.state == RoundState.BUY,
            "Cannot join in this phase"
        );
        if (r.players.length >= MAX_PLAYERS) revert RoundFull();
        if (isInRound[rid][msg.sender]) revert AlreadyInRound();

        // Accept entry fee (direct payment or from balance)
        uint256 totalDeposit = msg.value;
        if (totalDeposit < ENTRY_FEE) {
            uint256 remaining = ENTRY_FEE - totalDeposit;
            if (playerBalance[msg.sender] < remaining) {
                revert InsufficientBalance(remaining, playerBalance[msg.sender]);
            }
            playerBalance[msg.sender] -= remaining;
        } else {
            // Deposit excess to balance
            if (totalDeposit > ENTRY_FEE) {
                playerBalance[msg.sender] += (totalDeposit - ENTRY_FEE);
            }
        }

        r.players.push(msg.sender);
        r.prizePool += ENTRY_FEE;
        isInRound[rid][msg.sender] = true;

        r.txCount++;
        roundTxCount[rid][msg.sender]++;

        emit PlayerJoined(rid, msg.sender, ENTRY_FEE);
    }

    /// @notice Buy a weapon during BUY phase (cost deducted from player balance)
    function buyWeapon(uint8 weaponId) external nonReentrant {
        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.BUY);
        if (!isInRound[rid][msg.sender]) revert NotInRound();
        if (!weapons[weaponId].exists) revert InvalidWeapon(weaponId);

        uint256 cost = weapons[weaponId].cost;
        if (playerBalance[msg.sender] < cost) {
            revert InsufficientBalance(cost, playerBalance[msg.sender]);
        }

        playerBalance[msg.sender] -= cost;
        roundSpent[rid][msg.sender] += cost;
        rounds[rid].prizePool += cost;

        // Mint weapon NFT to player
        weaponNFT.mint(msg.sender, weaponId, 1);

        rounds[rid].txCount++;
        roundTxCount[rid][msg.sender]++;

        emit WeaponPurchased(msg.sender, weaponId, cost, block.timestamp);
    }

    /// @notice Register a kill (owner-only — game server validates and submits)
    function registerKill(
        address killer,
        address victim,
        uint8 weaponUsed
    ) external onlyOwner {
        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.LIVE);
        require(isInRound[rid][killer] && isInRound[rid][victim], "Players not in round");

        roundKills[rid][killer]++;
        roundDeaths[rid][victim]++;
        rounds[rid].totalKills++;

        // Pay kill reward immediately (optimistic — Monad settles fast)
        uint256 reward = weapons[weaponUsed].killReward;
        if (reward > 0) {
            playerBalance[killer] += reward;
            roundEarned[rid][killer] += reward;
        }

        rounds[rid].txCount++;
        roundTxCount[rid][killer]++;

        emit KillRegistered(killer, victim, weaponUsed, rid);
    }

    /// @notice Register a batch of kills in one tx (gas-efficient for Monad's parallel execution)
    function registerKillBatch(
        address[] calldata killers,
        address[] calldata victims,
        uint8[] calldata weaponsUsed
    ) external onlyOwner {
        require(
            killers.length == victims.length && killers.length == weaponsUsed.length,
            "Array length mismatch"
        );

        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.LIVE);

        for (uint256 i = 0; i < killers.length; i++) {
            address killer = killers[i];
            address victim = victims[i];
            uint8 weapon = weaponsUsed[i];

            roundKills[rid][killer]++;
            roundDeaths[rid][victim]++;
            rounds[rid].totalKills++;

            uint256 reward = weapons[weapon].killReward;
            if (reward > 0) {
                playerBalance[killer] += reward;
                roundEarned[rid][killer] += reward;
            }

            rounds[rid].txCount++;
            roundTxCount[rid][killer]++;

            emit KillRegistered(killer, victim, weapon, rid);
        }
    }

    // ── Round lifecycle (owner / server controls) ────────────────────────

    /// @notice Transition round to BUY phase
    function startBuyPhase() external onlyOwner {
        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.LOBBY);
        require(rounds[rid].players.length >= MIN_PLAYERS, "Not enough players");
        rounds[rid].state = RoundState.BUY;
        rounds[rid].startTime = block.timestamp;
        emit RoundStateChanged(rid, RoundState.BUY);
    }

    /// @notice Transition round to LIVE phase
    function startRound() external onlyOwner {
        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.BUY);
        rounds[rid].state = RoundState.LIVE;
        emit RoundStateChanged(rid, RoundState.LIVE);
    }

    /// @notice Settle the round — pay out winner + loss bonuses, update stats, create next round
    function settleRound(address winner) external onlyOwner nonReentrant {
        uint256 rid = currentRoundId;
        _requireState(rid, RoundState.LIVE);

        RoundData storage r = rounds[rid];
        r.state = RoundState.SETTLING;
        emit RoundStateChanged(rid, RoundState.SETTLING);

        r.winner = winner;

        // Winner gets 60% of prize pool
        uint256 winnerShare = (r.prizePool * 60) / 100;
        playerBalance[winner] += winnerShare;
        roundEarned[rid][winner] += winnerShare;

        // Remaining 40% stays in contract as house (or future rewards)
        // Pay round loss bonus to non-winners
        for (uint256 i = 0; i < r.players.length; i++) {
            address p = r.players[i];
            if (p != winner) {
                playerBalance[p] += ROUND_LOSS_BONUS;
                roundEarned[rid][p] += ROUND_LOSS_BONUS;
            }

            // Update permanent stats via PlayerStats contract
            playerStatsContract.updateStats(
                p,
                roundKills[rid][p],
                roundDeaths[rid][p],
                p == winner,
                roundEarned[rid][p],
                roundSpent[rid][p],
                roundTxCount[rid][p]
            );
        }

        r.state = RoundState.COMPLETE;
        r.txCount++;

        emit RoundSettled(rid, winner, r.prizePool, r.txCount);
        emit RoundStateChanged(rid, RoundState.COMPLETE);

        // Create next round automatically
        _createRound();
    }

    /// @notice Players withdraw their earned MON
    function claimRewards() external nonReentrant {
        uint256 amount = playerBalance[msg.sender];
        require(amount > 0, "No balance to claim");

        playerBalance[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit RewardClaimed(msg.sender, amount);
    }

    // ── Views ────────────────────────────────────────────────────────────

    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalance[player];
    }

    function getCurrentRound() external view returns (RoundInfo memory) {
        RoundData storage r = rounds[currentRoundId];
        return RoundInfo(
            r.id,
            r.state,
            r.winner,
            r.startTime,
            r.prizePool,
            r.totalKills,
            r.txCount
        );
    }

    function getRoundPlayers(uint256 roundId) external view returns (address[] memory) {
        return rounds[roundId].players;
    }

    function getRoundPlayerCount(uint256 roundId) external view returns (uint256) {
        return rounds[roundId].players.length;
    }

    function getWeaponConfig(uint8 weaponId) external view returns (WeaponConfig memory) {
        return weapons[weaponId];
    }

    /// @notice Allow contract to receive MON
    receive() external payable {
        playerBalance[msg.sender] += msg.value;
        emit BalanceDeposited(msg.sender, msg.value);
    }
}
