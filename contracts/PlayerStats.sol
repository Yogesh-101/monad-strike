// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlayerStats
 * @notice Permanent on-chain kill/death/earn history for MonadStrike players.
 *         Written to by GameEconomy at round settlement — never reset.
 */
contract PlayerStats is Ownable {

    // ── Types ────────────────────────────────────────────────────────────
    struct Stats {
        uint256 totalKills;
        uint256 totalDeaths;
        uint256 roundsWon;
        uint256 roundsPlayed;
        uint256 totalEarned;   // in wei
        uint256 totalSpent;    // in wei
        uint256 totalTxCount;
    }

    struct LeaderboardEntry {
        address player;
        uint256 totalKills;
        uint256 totalDeaths;
        uint256 roundsWon;
        uint256 totalEarned;
    }

    // ── State ────────────────────────────────────────────────────────────
    mapping(address => Stats) public playerStats;

    /// @notice Only the GameEconomy contract may write stats
    address public authorizedCaller;

    /// @notice Track every player who has ever played for leaderboard iteration
    address[] public allPlayers;
    mapping(address => bool) private _hasPlayed;

    // ── Events ───────────────────────────────────────────────────────────
    event StatsUpdated(
        address indexed player,
        uint256 kills,
        uint256 deaths,
        bool won,
        uint256 earned
    );
    event AuthorizedCallerSet(address indexed caller);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotAuthorized();

    // ── Modifiers ────────────────────────────────────────────────────────
    modifier onlyAuthorized() {
        if (msg.sender != authorizedCaller && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ── Admin ────────────────────────────────────────────────────────────

    function setAuthorizedCaller(address _caller) external onlyOwner {
        authorizedCaller = _caller;
        emit AuthorizedCallerSet(_caller);
    }

    // ── Writes (called by GameEconomy at settlement) ─────────────────────

    /// @notice Record a player's stats for a completed round
    function updateStats(
        address player,
        uint256 kills,
        uint256 deaths,
        bool won,
        uint256 earned,
        uint256 spent,
        uint256 txCount
    ) external onlyAuthorized {
        // Register first-time players for leaderboard
        if (!_hasPlayed[player]) {
            allPlayers.push(player);
            _hasPlayed[player] = true;
        }

        Stats storage s = playerStats[player];
        s.totalKills   += kills;
        s.totalDeaths  += deaths;
        s.roundsPlayed += 1;
        s.totalEarned  += earned;
        s.totalSpent   += spent;
        s.totalTxCount += txCount;

        if (won) {
            s.roundsWon += 1;
        }

        emit StatsUpdated(player, kills, deaths, won, earned);
    }

    /// @notice Batch-update stats for all players in a round (saves gas via single call)
    function batchUpdateStats(
        address[] calldata players,
        uint256[] calldata kills,
        uint256[] calldata deaths,
        bool[] calldata won,
        uint256[] calldata earned,
        uint256[] calldata spent,
        uint256[] calldata txCounts
    ) external onlyAuthorized {
        require(
            players.length == kills.length &&
            players.length == deaths.length &&
            players.length == won.length &&
            players.length == earned.length &&
            players.length == spent.length &&
            players.length == txCounts.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < players.length; i++) {
            if (!_hasPlayed[players[i]]) {
                allPlayers.push(players[i]);
                _hasPlayed[players[i]] = true;
            }

            Stats storage s = playerStats[players[i]];
            s.totalKills   += kills[i];
            s.totalDeaths  += deaths[i];
            s.roundsPlayed += 1;
            s.totalEarned  += earned[i];
            s.totalSpent   += spent[i];
            s.totalTxCount += txCounts[i];

            if (won[i]) {
                s.roundsWon += 1;
            }
        }
    }

    // ── Views ────────────────────────────────────────────────────────────

    /// @notice Get full stats for a player
    function getStats(address player) external view returns (Stats memory) {
        return playerStats[player];
    }

    /// @notice K/D ratio as kills * 100 / deaths (to avoid floating point)
    function getKDRatio(address player) external view returns (uint256) {
        Stats memory s = playerStats[player];
        if (s.totalDeaths == 0) return s.totalKills * 100;
        return (s.totalKills * 100) / s.totalDeaths;
    }

    /// @notice Return the top N players sorted by total kills (on-chain sort — keep N small)
    function getLeaderboard(uint256 topN) external view returns (LeaderboardEntry[] memory) {
        uint256 total = allPlayers.length;
        if (topN > total) topN = total;

        // Build unsorted array
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](total);
        for (uint256 i = 0; i < total; i++) {
            address p = allPlayers[i];
            Stats memory s = playerStats[p];
            entries[i] = LeaderboardEntry(p, s.totalKills, s.totalDeaths, s.roundsWon, s.totalEarned);
        }

        // Simple selection sort for top N (fine for hackathon scale)
        for (uint256 i = 0; i < topN; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; j++) {
                if (entries[j].totalKills > entries[maxIdx].totalKills) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                LeaderboardEntry memory tmp = entries[i];
                entries[i] = entries[maxIdx];
                entries[maxIdx] = tmp;
            }
        }

        // Trim to topN
        LeaderboardEntry[] memory result = new LeaderboardEntry[](topN);
        for (uint256 i = 0; i < topN; i++) {
            result[i] = entries[i];
        }
        return result;
    }

    /// @notice Total number of unique players
    function totalPlayers() external view returns (uint256) {
        return allPlayers.length;
    }
}
