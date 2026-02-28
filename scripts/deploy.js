const hre = require("hardhat");

/**
 * MonadStrike — Full deploy script
 *
 * Deploy order (dependencies must resolve):
 *   1. WeaponNFT
 *   2. PlayerStats
 *   3. GameEconomy  (needs WeaponNFT + PlayerStats addresses)
 *   4. BettingPool  (needs GameEconomy address)
 *   5. Authorize GameEconomy as caller on WeaponNFT + PlayerStats
 */
async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("  🎮 MonadStrike — Contract Deployment");
    console.log("═══════════════════════════════════════════════════");
    console.log(`  Deployer:  ${deployer.address}`);
    console.log(`  Network:   ${hre.network.name}`);
    console.log(`  Chain ID:  ${(await hre.ethers.provider.getNetwork()).chainId}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`  Balance:   ${hre.ethers.formatEther(balance)} MON`);
    console.log("═══════════════════════════════════════════════════\n");

    // ── 1. WeaponNFT ─────────────────────────────────────────────────
    console.log("📦 [1/5] Deploying WeaponNFT...");
    const WeaponNFT = await hre.ethers.getContractFactory("WeaponNFT");
    const weaponNFT = await WeaponNFT.deploy();
    await weaponNFT.waitForDeployment();
    const weaponNFTAddr = await weaponNFT.getAddress();
    console.log(`   ✅ WeaponNFT deployed: ${weaponNFTAddr}\n`);

    // ── 2. PlayerStats ───────────────────────────────────────────────
    console.log("📦 [2/5] Deploying PlayerStats...");
    const PlayerStats = await hre.ethers.getContractFactory("PlayerStats");
    const playerStats = await PlayerStats.deploy();
    await playerStats.waitForDeployment();
    const playerStatsAddr = await playerStats.getAddress();
    console.log(`   ✅ PlayerStats deployed: ${playerStatsAddr}\n`);

    // ── 3. GameEconomy ───────────────────────────────────────────────
    console.log("📦 [3/5] Deploying GameEconomy...");
    const GameEconomy = await hre.ethers.getContractFactory("GameEconomy");
    const gameEconomy = await GameEconomy.deploy(weaponNFTAddr, playerStatsAddr);
    await gameEconomy.waitForDeployment();
    const gameEconomyAddr = await gameEconomy.getAddress();
    console.log(`   ✅ GameEconomy deployed: ${gameEconomyAddr}\n`);

    // ── 4. BettingPool ───────────────────────────────────────────────
    console.log("📦 [4/5] Deploying BettingPool...");
    const BettingPool = await hre.ethers.getContractFactory("BettingPool");
    const bettingPool = await BettingPool.deploy(gameEconomyAddr);
    await bettingPool.waitForDeployment();
    const bettingPoolAddr = await bettingPool.getAddress();
    console.log(`   ✅ BettingPool deployed: ${bettingPoolAddr}\n`);

    // ── 5. Authorize GameEconomy ─────────────────────────────────────
    console.log("🔑 [5/5] Setting authorized callers...");
    const tx1 = await weaponNFT.setAuthorizedCaller(gameEconomyAddr);
    await tx1.wait();
    console.log("   ✅ WeaponNFT → GameEconomy authorized");

    const tx2 = await playerStats.setAuthorizedCaller(gameEconomyAddr);
    await tx2.wait();
    console.log("   ✅ PlayerStats → GameEconomy authorized\n");

    // ── Summary ──────────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  🚀 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════════════════");
    console.log(`  VITE_WEAPON_NFT_ADDRESS=${weaponNFTAddr}`);
    console.log(`  VITE_PLAYER_STATS_ADDRESS=${playerStatsAddr}`);
    console.log(`  VITE_GAME_ECONOMY_ADDRESS=${gameEconomyAddr}`);
    console.log(`  VITE_BETTING_POOL_ADDRESS=${bettingPoolAddr}`);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n  📝 Copy the addresses above into your .env file!\n");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
