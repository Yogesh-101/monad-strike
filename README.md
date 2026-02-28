# 🎮 MonadStrike — On-Chain CS Economy Game

![MonadStrike Hero](https://github.com/user-attachments/assets/placeholder-hero-image) <!-- Add a screenshot of your game here -->

**MonadStrike** is a browser-based, Counter-Strike-style web3 top-down shooter that runs fully on the **Monad Testnet**. 

Built to showcase the raw power of Monad's 10,000 TPS parallel execution, MonadStrike integrates a live on-chain economy where every weapon trade, kill bounty, and round settlement is confirmed as a real transaction—all happening instantly without interrupting the high-speed 60FPS gameplay.

---

## 🚀 Features

- **Optimistic On-Chain Gameplay**: Local Phaser 3 gameplay runs smoothly at 60 FPS while transactions (purchases, kills, bets) fire asynchronously to the Monad Testnet.
- **Full In-Game Economy**: Mirroring CS:GO, players buy weapons (Glocks, AK-47s, AWPs) and utility using MON tokens during the Buy Phase.
- **Weapon System (ERC-1155)**: Arsenal is minted and managed entirely as on-chain NFT assets. Top fraggers can even drop weapons to teammates seamlessly.
- **Dynamic Batch Settlements**: Kills are buffered and flushed to the blockchain every 10 seconds or at round end using batched transactions.
- **Live Explorer Feed**: A visual panel tracks the exact real-time transactions hitting Monad, providing an unparalleled demonstration of high throughput.

---

## 🏗️ Architecture Stack

### **Frontend & Engine**
- **React 18 + Vite**: High-performance UI rendering.
- **Phaser 3**: Robust 2D WebGL top-down game engine.
- **Zustand**: Fast, lightweight state management.
- **Tailwind CSS**: Sleek, cyberpunk-inspired UI styling.

### **Web3 & Smart Contracts**
- **Ethers.js v6**: Interfacing with the blockchain and maintaining the optimistic Transaction Queue.
- **Solidity 0.8.24**: EVM-compatible contracts tailored for Monad (`GameEconomy`, `WeaponNFT`, `BettingPool`, `PlayerStats`).
- **Monad Testnet**: Utilizing the parallel execution EVM layer.
- **Hardhat**: Development and deployment pipeline.

---

## ⚙️ Prerequisites

To run this project locally, ensure you have the following installed:
1. **Node.js**: v18.0.0 or higher
2. **MetaMask**: Browser Extension configured to the **Monad Testnet**

**Monad Testnet Configuration:**
- **Network Name**: Monad Testnet
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Chain ID**: `10143` (0x279F)
- **Currency Symbol**: `MON`

---

## 🛠️ Local Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/Yogesh-101/monad-strike.git
cd monad-strike
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up your environment variables**
Duplicate `.env.example` and rename it to `.env`:
```bash
cp .env.example .env
```
Ensure you provide your deployer private key and ensure you have testnet MON. *(Never commit your private keys!)*

**4. Compile and Deploy Smart Contracts**
Start by compiling the Hardhat smart contracts:
```bash
npm run compile
```
Deploy the contracts to the Monad testnet:
```bash
npm run deploy:monad
```
*(Once deployed, make sure to copy the newly generated contract addresses into your `.env` file.)*

**5. Start the Application**
You need to run two processes: the WebSocket sync server and the Vite frontend.
Open two terminals:

*Terminal 1 - Game Sync Server:*
```bash
npm run server
```

*Terminal 2 - Frontend Client:*
```bash
npm run dev
```

The game should now be running locally at `http://localhost:3001/` (or whichever port Vite provides).

---

## 📖 How to Play

1. **Connect Wallet**: Click the 'Connect' button and ensure you are on the Monad testnet.
2. **Lobby & Buy Phase**: Join a game. During the initial 30-second buy phase, buy weapons and armor. All purchases reflect on-chain immediately.
3. **The Game Loop**: Use `WASD` to move and `Mouse` to aim/shoot. Eliminate opponents to earn Kill Bounties.
4. **Settlement Phase**: Watch the Live Tx Feed pulse as all the economy transactions from the 90-second round hit finality on the Monad chain in mere seconds.

---

## 🛠 Project Structure

```text
monad-strike/
├── contracts/           # Solidity Smart Contracts (Core Economy, ERC-1155)
├── scripts/             # Hardhat deployment scripts
├── server/              # WebSocket authoritative position & round sync Node server
├── src/                 
│   ├── components/      # React UI components (HUD, Buy Menu, Live Tx Feed)
│   ├── config/          # Global configs (Monad network, Weapon data)
│   ├── game/            # Phaser 3 Game Engine logic & Entities
│   ├── hooks/           # Custom React/Web3 hooks
│   ├── store/           # Zustand stores for Game, Wallet, and Tx Queue states
│   └── App.jsx          # App root 
└── MONAD_CS_BUILD_SPEC.md   # Original Build specifications & deep-dive architecture
```

---

## 💸 Smart Contracts deployed by this project
- **GameEconomy**: Manages deposits, balances, weapon purchases, and orchestrates settlement rewards.
- **WeaponNFT**: Standard ERC-1155 tailored for managing in-game items.
- **PlayerStats**: Aggregates permanent on-chain player K/D ratios and earnings.
- **BettingPool**: Spectators can place live wagers on round outcomes.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
