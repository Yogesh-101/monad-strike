# 🎮 MonadStrike — On-Chain CS Economy Game
## Complete Build Specification for Claude Sonnet 4.6

---

## YOUR ROLE

You are a senior full-stack Web3 engineer. Your job is to build **MonadStrike** — a Counter-Strike–style on-chain economy game that runs on Monad testnet. You will build this step by step, file by file, asking for confirmation between major phases only if something is ambiguous. Otherwise, keep building.

**Do not skip steps. Do not stub functions. Write complete, working code every time.**

---

## WHAT WE ARE BUILDING

A browser-based game where:
- Players join rounds, buy weapons, fight, and earn rewards
- Every economy action (buy, sell, kill reward, bet, loot) is a **real on-chain transaction on Monad**
- Gameplay is client-side and instant (optimistic execution)
- The chain settles kills, economy, and round results at round-end checkpoints
- A live block explorer panel shows Monad transactions firing in real time
- The whole thing is a showcase of Monad's 10,000 TPS parallel execution

**The demo pitch:** *"Every weapon trade, kill bounty, and round settlement — confirmed on-chain before the next round starts. Watch the block explorer while you play."*

---

## ARCHITECTURE OVERVIEW

```
Frontend (React + Vite)
│
├── Game Layer (Phaser 3)          ← client-side, runs at 60fps, no chain lag
│   ├── Player movement + shooting
│   ├── Hit detection (local)
│   └── Round state machine
│
├── Economy Layer (React UI)       ← buy phase, inventory, leaderboard
│   ├── Buy Phase Panel
│   ├── Inventory / Loadout
│   ├── Live Bet Panel
│   └── Round Economy Summary
│
├── Chain Layer (ethers.js v6)     ← async, fires transactions in background
│   ├── Optimistic tx queue
│   ├── Round settlement trigger
│   └── Event listener → game state sync
│
└── Live Feed Panel                ← shows real Monad txs as they happen
    ├── Monad block explorer embed
    └── Local tx log with status indicators

Smart Contracts (Solidity 0.8.24, deployed on Monad testnet)
│
├── GameEconomy.sol                ← core: weapons, kills, round settlement
├── WeaponNFT.sol                  ← ERC-1155 weapons as tokens
├── BettingPool.sol                ← round outcome bets
└── PlayerStats.sol                ← on-chain kill/death/earn history
```

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Game engine | Phaser 3 |
| Styling | Tailwind CSS |
| Web3 | ethers.js v6 |
| Wallet | MetaMask (window.ethereum) |
| Contracts | Solidity 0.8.24 |
| Contract dev | Hardhat |
| Contract testing | Hardhat + Chai |
| Chain | Monad Testnet |
| State management | Zustand |
| Notifications | react-hot-toast |

---

## MONAD NETWORK CONFIG

```javascript
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
}
```

---

## GAME DESIGN SPEC

### Round Structure

```
[LOBBY] → [BUY PHASE 30s] → [ROUND LIVE 90s] → [SETTLEMENT 3-5s] → [RESULTS] → loop
```

**LOBBY:** Players connect wallet, join game. Min 2 players, max 10.

**BUY PHASE (30 seconds):**
- Players spend in-game MON to buy weapons + utility
- Economy transactions fire on-chain during this phase
- Players can also place bets on round outcome here

**ROUND LIVE (90 seconds):**
- Phaser 3 top-down 2D game runs locally
- Kills registered client-side, queued as pending transactions
- UI shows pending tx count in corner ("14 txs pending...")
- Every 10 seconds, a batch of kill/damage txs flush to chain

**SETTLEMENT (3-5 seconds):**
- Round ends → smart contract called to settle
- Chain resolves: kill rewards paid out, bets settled, weapon drops assigned
- Block explorer panel shows tx burst happening live
- "Settling on Monad..." loading screen shown to players

**RESULTS:**
- Show round winner, top fragger, biggest earner
- Show total transactions this round, gas used, block numbers
- Economy resets for next round

---

## WEAPON ECONOMY

Directly mirror CS:GO buy menu logic:

| Weapon | Cost (MON) | Damage | Type |
|---|---|---|---|
| Glock | 0.001 | 25 | Pistol |
| Desert Eagle | 0.003 | 55 | Pistol |
| MP5 | 0.006 | 35 | SMG |
| AK-47 | 0.012 | 80 | Rifle |
| AWP | 0.018 | 120 | Sniper |
| HE Grenade | 0.002 | 60 | Utility |
| Armor | 0.003 | — | Defense |

**Kill reward:** 0.001–0.005 MON depending on weapon used (knives pay most).

**Round loss bonus:** Losing team gets 0.002 MON each to stay competitive (mirror CS economy).

**Drop system:** Top fragger can drop a weapon to a teammate — this is an on-chain ERC-1155 transfer, shown live in feed.

---

## SMART CONTRACTS — FULL SPEC

### `GameEconomy.sol`

```
State:
- mapping(address => uint256) public playerBalance
- mapping(uint256 => Round) public rounds
- uint256 public currentRoundId
- address public owner

Struct Round:
- uint256 id
- address[] players
- RoundState state (LOBBY, BUY, LIVE, SETTLING, COMPLETE)
- address winner
- uint256 startTime
- uint256 prizePool
- mapping(address => address[]) kills  // killer → victims[]

Functions:
- joinRound() payable           → player joins, deposits entry fee
- buyWeapon(uint8 weaponId)     → deduct cost, emit WeaponPurchased
- registerKill(address victim)  → owner-only (game server signs), emit KillRegistered
- settleRound(address winner)   → pays out rewards, emits RoundSettled
- claimRewards()                → player withdraws earnings
- getPlayerBalance(address)     → view
- getCurrentRound()             → view

Events:
- WeaponPurchased(address player, uint8 weaponId, uint256 cost, uint256 timestamp)
- KillRegistered(address killer, address victim, uint8 weaponUsed, uint256 roundId)
- RoundSettled(uint256 roundId, address winner, uint256 prizePool, uint256 txCount)
- RewardClaimed(address player, uint256 amount)
```

### `WeaponNFT.sol`

```
ERC-1155
- tokenId = weapon type (0=Glock, 1=Deagle, etc.)
- mint on purchase via GameEconomy
- burn on round end
- transferFrom for weapon drops between players
- uri returns weapon metadata JSON
```

### `BettingPool.sol`

```
Functions:
- placeBet(uint256 roundId, address team, uint256 amount) payable
- settleBets(uint256 roundId, address winningTeam)        → owner only
- claimWinnings(uint256 roundId)

Events:
- BetPlaced(address bettor, uint256 roundId, address team, uint256 amount)
- BetsSettled(uint256 roundId, address winner, uint256 totalPool)
```

### `PlayerStats.sol`

```
- mapping(address => Stats) public playerStats

Struct Stats:
  uint256 totalKills
  uint256 totalDeaths  
  uint256 roundsWon
  uint256 totalEarned
  uint256 totalTxCount

- updateStats(address player, ...) → called by GameEconomy on settlement
- getLeaderboard(uint256 topN) → returns top N players by kills
```

---

## FRONTEND STRUCTURE

```
src/
├── main.jsx
├── App.jsx
├── index.css
│
├── config/
│   ├── monad.js           ← network config, contract addresses
│   └── weapons.js         ← weapon definitions, costs, damage
│
├── contracts/
│   ├── abis/
│   │   ├── GameEconomy.json
│   │   ├── WeaponNFT.json
│   │   ├── BettingPool.json
│   │   └── PlayerStats.json
│   └── index.js           ← contract instances with ethers.js
│
├── store/
│   ├── gameStore.js        ← Zustand: round state, players, kills
│   ├── walletStore.js      ← Zustand: wallet connection, balance
│   └── txStore.js          ← Zustand: pending/confirmed tx queue
│
├── hooks/
│   ├── useWallet.js        ← connect, switch network, sign
│   ├── useGameEconomy.js   ← buy weapons, claim rewards
│   ├── useTxQueue.js       ← optimistic tx queue manager
│   └── useChainEvents.js   ← listen to contract events, update state
│
├── game/
│   ├── PhaserGame.jsx      ← mounts Phaser into React
│   ├── scenes/
│   │   ├── PreloadScene.js
│   │   ├── LobbyScene.js
│   │   ├── GameScene.js    ← main gameplay
│   │   └── ResultsScene.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Bullet.js
│   │   └── Weapon.js
│   └── systems/
│       ├── CollisionSystem.js
│       └── EconomyBridge.js  ← sends kills/events from Phaser → txQueue
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── wallet/
│   │   ├── ConnectButton.jsx
│   │   └── NetworkBadge.jsx
│   ├── economy/
│   │   ├── BuyPhasePanel.jsx   ← weapon shop during buy phase
│   │   ├── InventoryPanel.jsx
│   │   ├── BetPanel.jsx
│   │   └── EconomySummary.jsx  ← post-round breakdown
│   ├── game/
│   │   ├── Crosshair.jsx
│   │   ├── KillFeed.jsx
│   │   ├── HUDOverlay.jsx      ← HP, ammo, money, round timer
│   │   └── SettlementOverlay.jsx
│   ├── chain/
│   │   ├── TxFeedPanel.jsx     ← live tx list with status
│   │   ├── TxBadge.jsx         ← single tx item: hash, status, type
│   │   └── BlockExplorerFrame.jsx
│   └── leaderboard/
│       └── Leaderboard.jsx
│
└── pages/
    ├── HomePage.jsx        ← landing, connect wallet
    ├── LobbyPage.jsx       ← waiting room, player list
    ├── GamePage.jsx        ← active game view
    └── StatsPage.jsx       ← on-chain player history
```

---

## OPTIMISTIC TX QUEUE — CORE LOGIC

This is the most important piece. Implement it exactly as described.

```javascript
// store/txStore.js
// 
// Tx lifecycle: PENDING → SUBMITTED → CONFIRMED | FAILED
//
// On action (e.g. buyWeapon):
// 1. Add tx to queue with status PENDING, assign optimistic ID
// 2. Update game state immediately (don't wait for chain)
// 3. Submit tx to Monad in background
// 4. On receipt: update status to CONFIRMED, update UI badge
// 5. On error: status FAILED, show toast, revert optimistic state if critical
//
// Two categories of transactions:
// CRITICAL (must confirm before game continues):
//   - joinRound, settleRound
// ASYNC (fire and forget, game doesn't wait):
//   - buyWeapon, registerKill, placeBet
//
// Batch flushing for kills:
// - Queue kills locally during round
// - Every 10 seconds OR on round end, flush batch to chain
// - Use multicall pattern if possible to send multiple kills in one tx

const useTxStore = create((set, get) => ({
  queue: [],           // { id, type, status, hash, description, timestamp }
  pendingCount: 0,
  confirmedCount: 0,
  
  addTx: (type, description) => { ... },
  updateTx: (id, updates) => { ... },
  submitTx: async (id, contractCall) => { ... },
  flushKillBatch: async () => { ... },
  clearCompleted: () => { ... }
}))
```

---

## PHASER GAME SCENE — CORE REQUIREMENTS

The game is a **top-down 2D shooter** with these specs:

**Map:** Single flat arena, 800x600px, tiled floor, wall obstacles. Drawn with Phaser tilemaps or simple rectangle physics bodies.

**Player:** 32x32 sprite, WASD movement, mouse aim, left-click shoot.

**Bullets:** Phaser arcade physics, travel in aimed direction, despawn on wall/hit.

**Hit detection:** Client-side only. On hit:
1. Reduce target HP in local state
2. If HP reaches 0: register kill in local queue, emit `PLAYER_KILLED` event
3. EconomyBridge picks up event and adds to kill batch queue

**Networking for multiplayer:** Use a simple WebSocket server (Node.js + ws library) for position sync. Player positions broadcast at 20hz. This is NOT blockchain — just for seeing other players move. Chain handles economy only.

**HUD elements drawn in React (not Phaser):**
- HP bar
- Current weapon + ammo
- Money (MON balance)
- Round timer
- Pending tx count badge (pulsing orange dot)

---

## LIVE TX FEED PANEL

This panel appears on the right side of the screen during gameplay.

```
┌─────────────────────────────┐
│  ⛓ MONAD LIVE FEED          │
│  Block #4821903              │
├─────────────────────────────┤
│ ✅ Kill reward sent    0.003 │
│    0xabc...def  #4821902     │
├─────────────────────────────┤
│ ⏳ Weapon purchase...        │
│    AK-47  0.012 MON          │
├─────────────────────────────┤
│ ✅ Bet placed         0.01   │
│    0x123...456  #4821901     │
├─────────────────────────────┤
│ ✅ Kill registered           │
│    player1 → player3         │
├─────────────────────────────┤
│ 📊 This round: 47 txs        │
│    Avg confirm: 0.6s         │
└─────────────────────────────┘
```

- Animate new transactions sliding in from top
- Color code: green = confirmed, orange = pending, red = failed
- Show tx hash (truncated) that links to Monad explorer
- Show rolling stats: txs this round, avg confirmation time
- This panel is the **hero demo element** — make it visually striking

---

## SETTLEMENT SCREEN

When round ends, show a full-screen overlay:

```
┌──────────────────────────────────────────────┐
│                                              │
│   ⚡ SETTLING ON MONAD                       │
│                                              │
│   Round 7 Economy                           │
│   ───────────────                           │
│   💀 Kills registered:        23             │
│   🔫 Weapons purchased:       18             │
│   💰 Bets settled:             8             │
│   📦 Weapon drops:             3             │
│                                              │
│   Total transactions:         52             │
│   Blocks used:                 6             │
│   Time to settle:           3.2s             │
│                                              │
│   ████████████████████░░░░  78%             │
│                                              │
│   Watching live on Monad Explorer →          │
│                                              │
└──────────────────────────────────────────────┘
```

This is your **hackathon money shot.** Show it proudly.

---

## WEBSOCKET SERVER

Simple Node.js server for position sync:

```javascript
// server/index.js
// 
// Handles:
// - Player join/leave
// - Position broadcasts (20hz)
// - Round state sync (authoritative round timer)
// - Kill validation (simple server-side check before chain submission)
//
// Does NOT handle:
// - Economy (that's the chain)
// - Authentication (wallet signature handles that)
// - Persistent state (chain has that)
//
// Endpoints:
// WS: ws://localhost:3001
//
// Message types:
// CLIENT → SERVER:
//   { type: 'JOIN', wallet: '0x...', roundId: 1 }
//   { type: 'POSITION', x, y, angle, moving }
//   { type: 'SHOOT', targetWallet: '0x...' }
//   { type: 'ROUND_READY' }
//
// SERVER → CLIENT:
//   { type: 'PLAYERS', players: [...] }
//   { type: 'POSITION_UPDATE', wallet, x, y, angle }
//   { type: 'KILL_CONFIRMED', killer, victim, weapon }
//   { type: 'ROUND_START', roundId, players }
//   { type: 'ROUND_END', winner, stats }
//   { type: 'PHASE_CHANGE', phase: 'BUY'|'LIVE'|'SETTLING' }
```

---

## HARDHAT CONFIG

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  }
}
```

Deploy order:
1. WeaponNFT.sol
2. PlayerStats.sol  
3. GameEconomy.sol (pass WeaponNFT + PlayerStats addresses)
4. BettingPool.sol (pass GameEconomy address)
5. Call `setAuthorizedCaller` on WeaponNFT + PlayerStats to allow GameEconomy to write

---

## ENV VARIABLES

```
# .env (never commit)
DEPLOYER_PRIVATE_KEY=
VITE_GAME_ECONOMY_ADDRESS=
VITE_WEAPON_NFT_ADDRESS=
VITE_BETTING_POOL_ADDRESS=
VITE_PLAYER_STATS_ADDRESS=
VITE_WS_SERVER_URL=ws://localhost:3001
VITE_MONAD_RPC=https://testnet-rpc.monad.xyz
VITE_MONAD_EXPLORER=https://testnet.monadexplorer.com
```

---

## BUILD ORDER — FOLLOW THIS EXACTLY

### Phase 1 — Smart Contracts
1. `contracts/WeaponNFT.sol` — full ERC-1155 with mint/burn/transfer
2. `contracts/PlayerStats.sol` — stats tracker
3. `contracts/GameEconomy.sol` — core economy logic
4. `contracts/BettingPool.sol` — betting system
5. `test/` — Hardhat tests for all contracts
6. `scripts/deploy.js` — deploy all contracts in order
7. Deploy to Monad testnet, save addresses to `.env`

### Phase 2 — Backend Server
8. `server/index.js` — WebSocket position sync server
9. `server/RoundManager.js` — authoritative round timer + phase transitions
10. `server/KillValidator.js` — basic anti-cheat, validates kill reports

### Phase 3 — Frontend Foundation
11. Project setup: `npm create vite@latest`, install all deps
12. Tailwind config
13. `src/config/monad.js` + `src/config/weapons.js`
14. `src/store/walletStore.js`
15. `src/store/gameStore.js`
16. `src/store/txStore.js` — the optimistic queue
17. `src/hooks/useWallet.js`
18. `src/hooks/useTxQueue.js`
19. `src/contracts/index.js` — contract instances

### Phase 4 — Core UI Components
20. `ConnectButton.jsx` + `NetworkBadge.jsx`
21. `TxFeedPanel.jsx` + `TxBadge.jsx` — the live feed
22. `BuyPhasePanel.jsx` — weapon shop
23. `HUDOverlay.jsx`
24. `KillFeed.jsx`
25. `SettlementOverlay.jsx`

### Phase 5 — Phaser Game
26. `game/scenes/PreloadScene.js` — load assets
27. `game/scenes/GameScene.js` — full game loop
28. `game/entities/Player.js` — movement, shooting
29. `game/entities/Bullet.js`
30. `game/systems/EconomyBridge.js` — Phaser → tx queue bridge
31. `game/PhaserGame.jsx` — React wrapper

### Phase 6 — Pages + Integration
32. `HomePage.jsx` — landing, wallet connect
33. `LobbyPage.jsx` — room, player list, join game
34. `GamePage.jsx` — full game view with all panels
35. `StatsPage.jsx` — on-chain player stats
36. Wire everything together in `App.jsx`

### Phase 7 — Polish
37. Settlement screen animation
38. Sound effects (gunshots, buys, round win)
39. Mobile wallet support check
40. Error handling for failed txs
41. Loading states everywhere
42. Final README with setup instructions

---

## VISUAL DESIGN GUIDELINES

**Theme:** Dark, techy, green/cyan on black. CS meets cyberpunk.

**Color palette:**
- Background: `#0a0a0f`
- Panels: `#111118` with `1px solid #2a2a3a` border
- Accent green (Monad brand): `#836ef9` (Monad purple) or `#00ff9d`
- Pending tx: `#f59e0b` (amber)
- Confirmed tx: `#10b981` (green)
- Failed tx: `#ef4444` (red)
- Kill text: `#ff4444`

**Fonts:** `JetBrains Mono` or `Space Mono` from Google Fonts for the chain feed. `Inter` for UI.

**Key animations:**
- New tx slides in from right with fade
- Settlement screen uses a progress bar that fills block by block
- Kill feed entries animate in and fade out after 4 seconds
- Pending badge pulses when txs are in flight

---

## WHAT MAKES THIS A WINNER

When presenting to hackathon judges, the narrative is:

1. Open game in browser
2. Connect MetaMask to Monad testnet
3. Join a round, go to buy phase
4. Buy an AK-47 → point to the live tx appearing on Monad explorer
5. Round starts → play for 90 seconds
6. Kill someone → kill feed shows "tx pending..."
7. 10 second batch flush → show 5-10 kills hitting chain at once
8. Round ends → show settlement screen with 40-60 txs settling in ~3 seconds
9. Open Monad block explorer → show the burst of transactions
10. Say: *"This is impossible on Ethereum. On Solana you'd have ordering issues. On Monad, parallel execution means all 52 transactions settle in 3 seconds. This is what 10,000 TPS unlocks."*

---

## IMPORTANT RULES FOR IMPLEMENTATION

1. **Never block gameplay on a tx.** The chain is async. The game doesn't wait.
2. **Every economy action must emit a chain event.** No silent state changes.
3. **Show tx count prominently.** This is the demo metric. Make it visible.
4. **Settlement must be dramatic.** It's the money shot. Animate it.
5. **Handle wallet not connected gracefully.** Show a demo mode if needed.
6. **Handle failed txs gracefully.** Toast notifications, log in feed, don't crash.
7. **Comments in code explaining WHY, not what.** Future you will thank you.
8. **No placeholder data in the live feed.** Every tx shown must be real.

---

## START HERE

Begin with **Phase 1, Step 1**: Write the complete `WeaponNFT.sol` contract.

Then proceed in order through all phases. After each complete phase, confirm deployment or test results before moving to the next phase.

Good luck. Ship it. 🟣
