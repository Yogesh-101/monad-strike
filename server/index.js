/**
 * MonadStrike — WebSocket Server
 *
 * Handles multiplayer position sync and round state coordination.
 * The chain handles economy — this server only handles real-time gameplay.
 *
 * Message types documented in MONAD_CS_BUILD_SPEC.md
 */
import { WebSocketServer } from 'ws';
import RoundManager from './RoundManager.js';
import KillValidator from './KillValidator.js';

const PORT = process.env.WS_PORT || 3001;
const POSITION_BROADCAST_HZ = 20;
const POSITION_INTERVAL = 1000 / POSITION_BROADCAST_HZ;

// ── State ──────────────────────────────────────────────────────────────
const players = new Map();   // wallet → { ws, x, y, angle, moving, roundId, hp, weapon }
const roundManager = new RoundManager();
const killValidator = new KillValidator();

// ── WebSocket Server ───────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });

console.log(`\n⚡ MonadStrike WebSocket server running on ws://localhost:${PORT}`);
console.log(`   Position broadcast rate: ${POSITION_BROADCAST_HZ}hz\n`);

wss.on('connection', (ws) => {
    let playerWallet = null;

    ws.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            return; // Ignore malformed messages
        }

        switch (msg.type) {
            // ── Player joins the game ──────────────────────────────────
            case 'JOIN': {
                playerWallet = msg.wallet;
                const spawnPos = getSpawnPosition(players.size);

                players.set(playerWallet, {
                    ws,
                    x: spawnPos.x,
                    y: spawnPos.y,
                    angle: 0,
                    moving: false,
                    roundId: msg.roundId || roundManager.currentRoundId,
                    hp: 100,
                    weapon: 0, // Glock default
                    team: msg.team || 'none'
                });

                roundManager.addPlayer(playerWallet);

                // Notify all players of the updated player list
                broadcastPlayerList();

                // Send current round state to joining player
                ws.send(JSON.stringify({
                    type: 'ROUND_STATE',
                    roundId: roundManager.currentRoundId,
                    phase: roundManager.phase,
                    timer: roundManager.timer,
                    players: getPlayerList()
                }));

                console.log(`🟢 Player joined: ${playerWallet.slice(0, 8)}...`);
                break;
            }

            // ── Position update (sent at ~60fps from client, we throttle) ─
            case 'POSITION': {
                if (!playerWallet || !players.has(playerWallet)) return;
                const player = players.get(playerWallet);
                player.x = msg.x;
                player.y = msg.y;
                player.angle = msg.angle;
                player.moving = msg.moving;
                break;
            }

            // ── Shoot / kill report ────────────────────────────────────
            case 'SHOOT': {
                if (!playerWallet || roundManager.phase !== 'LIVE') return;

                const result = killValidator.validateKill(
                    playerWallet,
                    msg.targetWallet,
                    msg.weapon,
                    players
                );

                if (result.valid) {
                    const target = players.get(msg.targetWallet);
                    if (target) {
                        target.hp -= result.damage;

                        if (target.hp <= 0) {
                            target.hp = 0;

                            // Broadcast kill confirmation
                            broadcast({
                                type: 'KILL_CONFIRMED',
                                killer: playerWallet,
                                victim: msg.targetWallet,
                                weapon: msg.weapon,
                                roundId: roundManager.currentRoundId
                            });

                            // Respawn victim after delay
                            setTimeout(() => {
                                if (players.has(msg.targetWallet)) {
                                    const respawn = getSpawnPosition(Math.random() * 10);
                                    const p = players.get(msg.targetWallet);
                                    p.hp = 100;
                                    p.x = respawn.x;
                                    p.y = respawn.y;
                                }
                            }, 3000);
                        } else {
                            // Damage feedback
                            broadcast({
                                type: 'DAMAGE',
                                target: msg.targetWallet,
                                hp: target.hp,
                                attacker: playerWallet
                            });
                        }
                    }
                }
                break;
            }

            // ── Player signals they're ready ───────────────────────────
            case 'ROUND_READY': {
                if (!playerWallet) return;
                roundManager.setPlayerReady(playerWallet);

                if (roundManager.allPlayersReady() && players.size >= 2) {
                    roundManager.startBuyPhase();
                    broadcast({
                        type: 'PHASE_CHANGE',
                        phase: 'BUY',
                        roundId: roundManager.currentRoundId,
                        timer: roundManager.timer
                    });
                }
                break;
            }

            // ── Weapon selection update ────────────────────────────────
            case 'WEAPON_SELECT': {
                if (!playerWallet || !players.has(playerWallet)) return;
                players.get(playerWallet).weapon = msg.weaponId;
                break;
            }

            default:
                break;
        }
    });

    ws.on('close', () => {
        if (playerWallet) {
            players.delete(playerWallet);
            roundManager.removePlayer(playerWallet);
            broadcastPlayerList();
            console.log(`🔴 Player left: ${playerWallet.slice(0, 8)}...`);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
});

// ── Position broadcasting at fixed rate ────────────────────────────────
setInterval(() => {
    if (players.size === 0) return;

    const positions = [];
    for (const [wallet, p] of players) {
        positions.push({
            wallet,
            x: p.x,
            y: p.y,
            angle: p.angle,
            moving: p.moving,
            hp: p.hp,
            weapon: p.weapon
        });
    }

    broadcast({ type: 'POSITION_UPDATE', players: positions });
}, POSITION_INTERVAL);

// ── Round Manager callbacks ────────────────────────────────────────────
roundManager.on('phaseChange', (phase, roundId, timer) => {
    console.log(`⚡ Phase → ${phase} | Round ${roundId} | Timer: ${timer}s`);
    broadcast({
        type: 'PHASE_CHANGE',
        phase,
        roundId,
        timer
    });
});

roundManager.on('roundEnd', (roundId, stats) => {
    console.log(`🏁 Round ${roundId} ended`);
    broadcast({
        type: 'ROUND_END',
        roundId,
        winner: stats.winner,
        stats
    });

    // Reset player HPs for next round
    for (const [, p] of players) {
        p.hp = 100;
    }
});

roundManager.on('timerUpdate', (timer, phase) => {
    broadcast({ type: 'TIMER_UPDATE', timer, phase });
});

// ── Helpers ────────────────────────────────────────────────────────────

function broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const [, p] of players) {
        if (p.ws.readyState === 1) {
            p.ws.send(data);
        }
    }
}

function broadcastPlayerList() {
    broadcast({
        type: 'PLAYERS',
        players: getPlayerList()
    });
}

function getPlayerList() {
    const list = [];
    for (const [wallet, p] of players) {
        list.push({
            wallet,
            x: p.x,
            y: p.y,
            hp: p.hp,
            weapon: p.weapon,
            team: p.team
        });
    }
    return list;
}

function getSpawnPosition(index) {
    // Spread players around the arena (800x600)
    const spawnPoints = [
        { x: 100, y: 100 }, { x: 700, y: 100 },
        { x: 100, y: 500 }, { x: 700, y: 500 },
        { x: 400, y: 300 }, { x: 200, y: 300 },
        { x: 600, y: 300 }, { x: 400, y: 100 },
        { x: 400, y: 500 }, { x: 300, y: 200 }
    ];
    return spawnPoints[Math.floor(index) % spawnPoints.length];
}
