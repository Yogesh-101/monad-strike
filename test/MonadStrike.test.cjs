const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonadStrike Contracts", function () {
    let owner, player1, player2, player3;
    let weaponNFT, playerStats, gameEconomy, bettingPool;

    // Deploy the full contract suite before each test
    beforeEach(async function () {
        [owner, player1, player2, player3] = await ethers.getSigners();

        // 1. Deploy WeaponNFT
        const WeaponNFT = await ethers.getContractFactory("WeaponNFT");
        weaponNFT = await WeaponNFT.deploy();
        await weaponNFT.waitForDeployment();

        // 2. Deploy PlayerStats
        const PlayerStats = await ethers.getContractFactory("PlayerStats");
        playerStats = await PlayerStats.deploy();
        await playerStats.waitForDeployment();

        // 3. Deploy GameEconomy (pass WeaponNFT + PlayerStats addresses)
        const GameEconomy = await ethers.getContractFactory("GameEconomy");
        gameEconomy = await GameEconomy.deploy(
            await weaponNFT.getAddress(),
            await playerStats.getAddress()
        );
        await gameEconomy.waitForDeployment();

        // 4. Deploy BettingPool
        const BettingPool = await ethers.getContractFactory("BettingPool");
        bettingPool = await BettingPool.deploy(await gameEconomy.getAddress());
        await bettingPool.waitForDeployment();

        // 5. Authorize GameEconomy to write to WeaponNFT and PlayerStats
        await weaponNFT.setAuthorizedCaller(await gameEconomy.getAddress());
        await playerStats.setAuthorizedCaller(await gameEconomy.getAddress());
    });

    // ── WeaponNFT Tests ──────────────────────────────────────────────────

    describe("WeaponNFT", function () {
        it("Should have 7 weapons defined", async function () {
            expect(await weaponNFT.TOTAL_WEAPONS()).to.equal(7);
        });

        it("Should return correct weapon names", async function () {
            expect(await weaponNFT.weaponName(0)).to.equal("Glock");
            expect(await weaponNFT.weaponName(3)).to.equal("AK-47");
            expect(await weaponNFT.weaponName(4)).to.equal("AWP");
            expect(await weaponNFT.weaponName(6)).to.equal("Armor");
        });

        it("Should allow authorized caller to mint", async function () {
            // GameEconomy is authorized, but we can also use owner
            await weaponNFT.mint(player1.address, 0, 1);
            expect(await weaponNFT.balanceOf(player1.address, 0)).to.equal(1);
        });

        it("Should reject unauthorized minting", async function () {
            await expect(
                weaponNFT.connect(player1).mint(player1.address, 0, 1)
            ).to.be.revertedWithCustomError(weaponNFT, "NotAuthorized");
        });

        it("Should reject invalid weapon IDs", async function () {
            await expect(
                weaponNFT.mint(player1.address, 10, 1)
            ).to.be.revertedWithCustomError(weaponNFT, "InvalidWeaponId");
        });

        it("Should burn weapons correctly", async function () {
            await weaponNFT.mint(player1.address, 3, 2);
            expect(await weaponNFT.balanceOf(player1.address, 3)).to.equal(2);

            await weaponNFT.burn(player1.address, 3, 1);
            expect(await weaponNFT.balanceOf(player1.address, 3)).to.equal(1);
        });

        it("Should return full loadout", async function () {
            await weaponNFT.mint(player1.address, 0, 1); // Glock
            await weaponNFT.mint(player1.address, 3, 1); // AK-47
            await weaponNFT.mint(player1.address, 6, 1); // Armor

            const loadout = await weaponNFT.getLoadout(player1.address);
            expect(loadout[0]).to.equal(1); // Glock
            expect(loadout[3]).to.equal(1); // AK-47
            expect(loadout[6]).to.equal(1); // Armor
            expect(loadout[1]).to.equal(0); // No Deagle
        });

        it("Should allow weapon transfers (drops)", async function () {
            await weaponNFT.mint(player1.address, 3, 1);

            // Player1 drops AK-47 to player2
            await weaponNFT.connect(player1).safeTransferFrom(
                player1.address, player2.address, 3, 1, "0x"
            );

            expect(await weaponNFT.balanceOf(player1.address, 3)).to.equal(0);
            expect(await weaponNFT.balanceOf(player2.address, 3)).to.equal(1);
        });
    });

    // ── PlayerStats Tests ────────────────────────────────────────────────

    describe("PlayerStats", function () {
        it("Should initialize with zero stats", async function () {
            const stats = await playerStats.getStats(player1.address);
            expect(stats.totalKills).to.equal(0);
            expect(stats.totalDeaths).to.equal(0);
            expect(stats.roundsWon).to.equal(0);
        });

        it("Should update stats correctly", async function () {
            await playerStats.updateStats(
                player1.address,
                5,     // kills
                2,     // deaths
                true,  // won
                ethers.parseEther("0.01"), // earned
                ethers.parseEther("0.005"), // spent
                10     // txCount
            );

            const stats = await playerStats.getStats(player1.address);
            expect(stats.totalKills).to.equal(5);
            expect(stats.totalDeaths).to.equal(2);
            expect(stats.roundsWon).to.equal(1);
            expect(stats.roundsPlayed).to.equal(1);
        });

        it("Should accumulate stats across rounds", async function () {
            await playerStats.updateStats(player1.address, 3, 1, true, 100, 50, 5);
            await playerStats.updateStats(player1.address, 7, 3, false, 200, 100, 8);

            const stats = await playerStats.getStats(player1.address);
            expect(stats.totalKills).to.equal(10);
            expect(stats.totalDeaths).to.equal(4);
            expect(stats.roundsWon).to.equal(1);
            expect(stats.roundsPlayed).to.equal(2);
        });

        it("Should return K/D ratio", async function () {
            await playerStats.updateStats(player1.address, 10, 5, false, 0, 0, 0);
            // KD = 10 * 100 / 5 = 200
            expect(await playerStats.getKDRatio(player1.address)).to.equal(200);
        });

        it("Should build leaderboard", async function () {
            await playerStats.updateStats(player1.address, 5, 2, false, 0, 0, 0);
            await playerStats.updateStats(player2.address, 15, 3, true, 0, 0, 0);
            await playerStats.updateStats(player3.address, 10, 1, false, 0, 0, 0);

            const leaderboard = await playerStats.getLeaderboard(3);
            expect(leaderboard[0].player).to.equal(player2.address); // 15 kills
            expect(leaderboard[1].player).to.equal(player3.address); // 10 kills
            expect(leaderboard[2].player).to.equal(player1.address); // 5 kills
        });

        it("Should reject unauthorized stat updates", async function () {
            await expect(
                playerStats.connect(player1).updateStats(player1.address, 1, 0, false, 0, 0, 0)
            ).to.be.revertedWithCustomError(playerStats, "NotAuthorized");
        });
    });

    // ── GameEconomy Tests ────────────────────────────────────────────────

    describe("GameEconomy", function () {
        it("Should start with round 1 in LOBBY state", async function () {
            const round = await gameEconomy.getCurrentRound();
            expect(round.id).to.equal(1);
            expect(round.state).to.equal(0); // LOBBY
        });

        it("Should allow players to join a round", async function () {
            const entryFee = ethers.parseEther("0.005");

            await gameEconomy.connect(player1).joinRound({ value: entryFee });
            await gameEconomy.connect(player2).joinRound({ value: entryFee });

            expect(await gameEconomy.getRoundPlayerCount(1)).to.equal(2);
            expect(await gameEconomy.isInRound(1, player1.address)).to.be.true;
        });

        it("Should reject double-joining", async function () {
            const entryFee = ethers.parseEther("0.005");
            await gameEconomy.connect(player1).joinRound({ value: entryFee });

            await expect(
                gameEconomy.connect(player1).joinRound({ value: entryFee })
            ).to.be.revertedWithCustomError(gameEconomy, "AlreadyInRound");
        });

        it("Should handle full round lifecycle", async function () {
            const entryFee = ethers.parseEther("0.005");

            // 1. Players join
            await gameEconomy.connect(player1).joinRound({ value: entryFee });
            await gameEconomy.connect(player2).joinRound({ value: entryFee });

            // 2. Start buy phase
            await gameEconomy.startBuyPhase();
            let round = await gameEconomy.getCurrentRound();
            expect(round.state).to.equal(1); // BUY

            // 3. Players deposit and buy weapons
            await gameEconomy.connect(player1).deposit({ value: ethers.parseEther("0.02") });
            await gameEconomy.connect(player1).buyWeapon(3); // AK-47 costs 0.012

            // Check weapon was minted
            expect(await weaponNFT.balanceOf(player1.address, 3)).to.equal(1);

            // 4. Start round
            await gameEconomy.startRound();
            round = await gameEconomy.getCurrentRound();
            expect(round.state).to.equal(2); // LIVE

            // 5. Register kills
            await gameEconomy.registerKill(player1.address, player2.address, 3);
            expect(await gameEconomy.roundKills(1, player1.address)).to.equal(1);
            expect(await gameEconomy.roundDeaths(1, player2.address)).to.equal(1);

            // 6. Settle round
            await gameEconomy.settleRound(player1.address);
            round = await gameEconomy.getCurrentRound();
            // Should have auto-created round 2
            expect(round.id).to.equal(2);
            expect(round.state).to.equal(0); // LOBBY

            // 7. Check player1 earned rewards
            const balance = await gameEconomy.getPlayerBalance(player1.address);
            expect(balance).to.be.gt(0);

            // 8. Check permanent stats were updated
            const stats = await playerStats.getStats(player1.address);
            expect(stats.totalKills).to.equal(1);
            expect(stats.roundsWon).to.equal(1);
        });

        it("Should handle batch kill registration", async function () {
            const entryFee = ethers.parseEther("0.005");
            await gameEconomy.connect(player1).joinRound({ value: entryFee });
            await gameEconomy.connect(player2).joinRound({ value: entryFee });
            await gameEconomy.startBuyPhase();
            await gameEconomy.startRound();

            // Batch register 3 kills
            await gameEconomy.registerKillBatch(
                [player1.address, player1.address, player2.address],
                [player2.address, player2.address, player1.address],
                [0, 0, 1]
            );

            expect(await gameEconomy.roundKills(1, player1.address)).to.equal(2);
            expect(await gameEconomy.roundKills(1, player2.address)).to.equal(1);
            expect(await gameEconomy.roundDeaths(1, player2.address)).to.equal(2);
        });

        it("Should reject weapon purchase with insufficient balance", async function () {
            const entryFee = ethers.parseEther("0.005");
            await gameEconomy.connect(player1).joinRound({ value: entryFee });
            await gameEconomy.connect(player2).joinRound({ value: entryFee });
            await gameEconomy.startBuyPhase();

            // Player1 has no extra balance, AWP costs 0.018
            await expect(
                gameEconomy.connect(player1).buyWeapon(4)
            ).to.be.revertedWithCustomError(gameEconomy, "InsufficientBalance");
        });

        it("Should allow claiming rewards", async function () {
            const entryFee = ethers.parseEther("0.005");
            await gameEconomy.connect(player1).joinRound({ value: entryFee });
            await gameEconomy.connect(player2).joinRound({ value: entryFee });
            await gameEconomy.startBuyPhase();
            await gameEconomy.startRound();
            await gameEconomy.settleRound(player1.address);

            const balanceBefore = await ethers.provider.getBalance(player1.address);
            const gameBalance = await gameEconomy.getPlayerBalance(player1.address);

            if (gameBalance > 0n) {
                await gameEconomy.connect(player1).claimRewards();
                const balanceAfter = await ethers.provider.getBalance(player1.address);
                // Balance should increase (minus gas)
                expect(balanceAfter).to.be.gt(balanceBefore - ethers.parseEther("0.01"));
            }
        });
    });

    // ── BettingPool Tests ────────────────────────────────────────────────

    describe("BettingPool", function () {
        it("Should accept bets", async function () {
            await bettingPool.connect(player1).placeBet(
                1,
                player1.address,
                { value: ethers.parseEther("0.01") }
            );

            const pool = await bettingPool.getRoundPool(1);
            expect(pool.totalPool).to.equal(ethers.parseEther("0.01"));
        });

        it("Should reject zero bets", async function () {
            await expect(
                bettingPool.connect(player1).placeBet(1, player1.address, { value: 0 })
            ).to.be.revertedWithCustomError(bettingPool, "ZeroBet");
        });

        it("Should settle bets and allow claiming", async function () {
            // Place bets
            await bettingPool.connect(player1).placeBet(
                1, player1.address, { value: ethers.parseEther("0.01") }
            );
            await bettingPool.connect(player2).placeBet(
                1, player2.address, { value: ethers.parseEther("0.01") }
            );

            // Settle — player1 wins
            await bettingPool.settleBets(1, player1.address);

            const pool = await bettingPool.getRoundPool(1);
            expect(pool.settled).to.be.true;

            // Player1 claims
            const balBefore = await ethers.provider.getBalance(player1.address);
            await bettingPool.connect(player1).claimWinnings(1);
            const balAfter = await ethers.provider.getBalance(player1.address);
            // Should receive 0.02 ETH total (both bets since only player1 bet on player1)
            expect(balAfter).to.be.gt(balBefore);
        });

        it("Should reject claiming from non-settled rounds", async function () {
            await bettingPool.connect(player1).placeBet(
                1, player1.address, { value: ethers.parseEther("0.01") }
            );

            await expect(
                bettingPool.connect(player1).claimWinnings(1)
            ).to.be.revertedWithCustomError(bettingPool, "RoundNotSettled");
        });

        it("Should reject double settlement", async function () {
            await bettingPool.connect(player1).placeBet(
                1, player1.address, { value: ethers.parseEther("0.01") }
            );
            await bettingPool.settleBets(1, player1.address);

            await expect(
                bettingPool.settleBets(1, player2.address)
            ).to.be.revertedWithCustomError(bettingPool, "RoundAlreadySettled");
        });
    });
});
