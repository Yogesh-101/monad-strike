/**
 * MonadStrike — Round Manager
 *
 * Authoritative round timer and phase transitions.
 * The server is the source of truth for round timing —
 * the chain only records results at settlement.
 *
 * Phase flow: LOBBY → BUY (30s) → LIVE (90s) → SETTLING (5s) → RESULTS (10s) → LOBBY
 */
import { EventEmitter } from 'events';

const PHASE_DURATIONS = {
    BUY: 30,
    LIVE: 90,
    SETTLING: 5,
    RESULTS: 10
};

export default class RoundManager extends EventEmitter {
    constructor() {
        super();
        this.currentRoundId = 1;
        this.phase = 'LOBBY';    // LOBBY | BUY | LIVE | SETTLING | RESULTS
        this.timer = 0;
        this.timerInterval = null;
        this.players = new Set();
        this.readyPlayers = new Set();
        this.roundStats = {
            kills: 0,
            weaponsBought: 0,
            betsPlaced: 0,
            weaponDrops: 0,
            totalTx: 0,
            winner: null
        };
    }

    // ── Player management ──────────────────────────────────────────────

    addPlayer(wallet) {
        this.players.add(wallet);
    }

    removePlayer(wallet) {
        this.players.delete(wallet);
        this.readyPlayers.delete(wallet);
    }

    setPlayerReady(wallet) {
        this.readyPlayers.add(wallet);
    }

    allPlayersReady() {
        if (this.players.size < 2) return false;
        return this.readyPlayers.size >= this.players.size;
    }

    // ── Phase transitions ─────────────────────────────────────────────

    startBuyPhase() {
        this.phase = 'BUY';
        this.timer = PHASE_DURATIONS.BUY;
        this.emit('phaseChange', 'BUY', this.currentRoundId, this.timer);
        this._startTimer(() => this.startLivePhase());
    }

    startLivePhase() {
        this.phase = 'LIVE';
        this.timer = PHASE_DURATIONS.LIVE;
        this.emit('phaseChange', 'LIVE', this.currentRoundId, this.timer);
        this._startTimer(() => this.startSettlement());
    }

    startSettlement() {
        this.phase = 'SETTLING';
        this.timer = PHASE_DURATIONS.SETTLING;
        this.emit('phaseChange', 'SETTLING', this.currentRoundId, this.timer);
        this._startTimer(() => this.showResults());
    }

    showResults() {
        this.phase = 'RESULTS';
        this.timer = PHASE_DURATIONS.RESULTS;

        // Determine winner (highest kills in this round — simplified)
        this.emit('roundEnd', this.currentRoundId, { ...this.roundStats });
        this.emit('phaseChange', 'RESULTS', this.currentRoundId, this.timer);

        this._startTimer(() => this.startNewRound());
    }

    startNewRound() {
        this._stopTimer();

        this.currentRoundId++;
        this.phase = 'LOBBY';
        this.timer = 0;
        this.readyPlayers.clear();
        this.roundStats = {
            kills: 0,
            weaponsBought: 0,
            betsPlaced: 0,
            weaponDrops: 0,
            totalTx: 0,
            winner: null
        };

        this.emit('phaseChange', 'LOBBY', this.currentRoundId, 0);
    }

    // ── Stats tracking ────────────────────────────────────────────────

    recordKill() {
        this.roundStats.kills++;
        this.roundStats.totalTx++;
    }

    recordWeaponBuy() {
        this.roundStats.weaponsBought++;
        this.roundStats.totalTx++;
    }

    recordBet() {
        this.roundStats.betsPlaced++;
        this.roundStats.totalTx++;
    }

    recordWeaponDrop() {
        this.roundStats.weaponDrops++;
        this.roundStats.totalTx++;
    }

    setWinner(wallet) {
        this.roundStats.winner = wallet;
    }

    // ── Timer internals ───────────────────────────────────────────────

    _startTimer(onComplete) {
        this._stopTimer();

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.emit('timerUpdate', this.timer, this.phase);

            if (this.timer <= 0) {
                this._stopTimer();
                onComplete();
            }
        }, 1000);
    }

    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // ── View state ────────────────────────────────────────────────────

    getState() {
        return {
            roundId: this.currentRoundId,
            phase: this.phase,
            timer: this.timer,
            playerCount: this.players.size,
            readyCount: this.readyPlayers.size,
            stats: { ...this.roundStats }
        };
    }
}
