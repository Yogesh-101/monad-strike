// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BettingPool
 * @notice Round outcome betting for MonadStrike.
 *         Players bet on who will win the round during the BUY phase.
 *         Bets are settled by the game server after round completion.
 *         Winners split the pool proportionally to their bet size.
 */
contract BettingPool is Ownable, ReentrancyGuard {

    // ── Types ────────────────────────────────────────────────────────────
    struct Bet {
        address bettor;
        address team;       // the player they're betting on to win
        uint256 amount;
        bool claimed;
    }

    struct RoundPool {
        uint256 totalPool;
        bool settled;
        address winningTeam;
        uint256 winningTotal; // total bets placed on the winner
    }

    // ── State ────────────────────────────────────────────────────────────
    // roundId => pool info
    mapping(uint256 => RoundPool) public roundPools;
    // roundId => list of bets
    mapping(uint256 => Bet[]) public roundBets;
    // roundId => bettor => total amount bet
    mapping(uint256 => mapping(address => uint256)) public playerBetAmount;
    // roundId => team => total amount bet on that team
    mapping(uint256 => mapping(address => uint256)) public teamBetTotals;

    address public gameEconomy;

    // ── Events ───────────────────────────────────────────────────────────
    event BetPlaced(
        address indexed bettor,
        uint256 indexed roundId,
        address indexed team,
        uint256 amount
    );
    event BetsSettled(
        uint256 indexed roundId,
        address indexed winner,
        uint256 totalPool
    );
    event WinningsClaimed(
        address indexed bettor,
        uint256 indexed roundId,
        uint256 amount
    );

    // ── Errors ───────────────────────────────────────────────────────────
    error RoundAlreadySettled();
    error RoundNotSettled();
    error AlreadyClaimed();
    error NoBetPlaced();
    error ZeroBet();
    error TransferFailed();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(address _gameEconomy) Ownable(msg.sender) {
        gameEconomy = _gameEconomy;
    }

    // ── Player actions ───────────────────────────────────────────────────

    /// @notice Place a bet on a player/team to win the round
    function placeBet(
        uint256 roundId,
        address team
    ) external payable nonReentrant {
        if (msg.value == 0) revert ZeroBet();
        if (roundPools[roundId].settled) revert RoundAlreadySettled();

        roundBets[roundId].push(Bet({
            bettor: msg.sender,
            team: team,
            amount: msg.value,
            claimed: false
        }));

        roundPools[roundId].totalPool += msg.value;
        playerBetAmount[roundId][msg.sender] += msg.value;
        teamBetTotals[roundId][team] += msg.value;

        emit BetPlaced(msg.sender, roundId, team, msg.value);
    }

    /// @notice Settle all bets for a round (called by owner after round ends)
    function settleBets(
        uint256 roundId,
        address winningTeam
    ) external onlyOwner {
        RoundPool storage pool = roundPools[roundId];
        if (pool.settled) revert RoundAlreadySettled();

        pool.settled = true;
        pool.winningTeam = winningTeam;
        pool.winningTotal = teamBetTotals[roundId][winningTeam];

        emit BetsSettled(roundId, winningTeam, pool.totalPool);
    }

    /// @notice Claim winnings for a round (proportional to bet on winning team)
    function claimWinnings(uint256 roundId) external nonReentrant {
        RoundPool memory pool = roundPools[roundId];
        if (!pool.settled) revert RoundNotSettled();

        Bet[] storage bets = roundBets[roundId];
        uint256 totalWinnings = 0;
        bool foundBet = false;

        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].bettor == msg.sender && bets[i].team == pool.winningTeam && !bets[i].claimed) {
                foundBet = true;
                bets[i].claimed = true;

                // Proportional share: (betAmount / totalWinningBets) * totalPool
                if (pool.winningTotal > 0) {
                    totalWinnings += (bets[i].amount * pool.totalPool) / pool.winningTotal;
                }
            }
        }

        if (!foundBet) revert NoBetPlaced();
        require(totalWinnings > 0, "No winnings");

        (bool success, ) = payable(msg.sender).call{value: totalWinnings}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(msg.sender, roundId, totalWinnings);
    }

    // ── Views ────────────────────────────────────────────────────────────

    function getRoundPool(uint256 roundId) external view returns (RoundPool memory) {
        return roundPools[roundId];
    }

    function getRoundBets(uint256 roundId) external view returns (Bet[] memory) {
        return roundBets[roundId];
    }

    function getBetCount(uint256 roundId) external view returns (uint256) {
        return roundBets[roundId].length;
    }

    /// @notice Allow contract to receive MON
    receive() external payable {}
}
