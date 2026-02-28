import Phaser from 'phaser';
import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import CollisionSystem from '../systems/CollisionSystem';
import EconomyBridge from '../systems/EconomyBridge';

/**
 * GameScene — Main gameplay scene.
 * Uses modular entities (Player, Bullet) and systems (CollisionSystem, EconomyBridge).
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.walls = null;
        this.crosshair = null;
        this.cursors = null;
        this.wasd = null;
        this.economyBridge = null;
        this.collisionSystem = null;
    }

    create() {
        const { width, height } = this.cameras.main;

        // ── Systems ─────────────────────────────────────────────────
        this.economyBridge = new EconomyBridge();
        this.economyBridge.startBatchTimer();
        this.collisionSystem = new CollisionSystem(this);

        // ── Draw floor ──────────────────────────────────────────────
        for (let x = 0; x < width; x += 32) {
            for (let y = 0; y < height; y += 32) {
                this.add.image(x + 16, y + 16, 'floor');
            }
        }

        // ── Create walls ────────────────────────────────────────────
        this.walls = this.physics.add.staticGroup();
        this._createArenaWalls(width, height);
        this._createObstacles(width, height);

        // ── Create Player Entity ────────────────────────────────────
        this.player = new Player(this, width / 2, height / 2, true);

        // ── Create bullet group ─────────────────────────────────────
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: true
        });

        // ── Create enemy group ──────────────────────────────────────
        this.enemies = this.physics.add.group();
        this._spawnDemoBots();

        // ── Setup Collisions ────────────────────────────────────────
        this.collisionSystem.setup(
            this.player.sprite,
            this.enemies,
            this.bullets,
            this.walls
        );

        // Listen for collision system kill events
        this.events.on('enemyKilled', (data) => {
            const { enemySprite, weaponId } = data;

            // "KILL" text popup
            const killText = this.add.text(enemySprite.x, enemySprite.y - 20, '+KILL', {
                fontFamily: 'JetBrains Mono',
                fontSize: '14px',
                color: '#ff4444',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);

            this.tweens.add({
                targets: killText,
                y: killText.y - 40,
                alpha: 0,
                duration: 1000,
                onComplete: () => killText.destroy()
            });

            // Emit to EconomyBridge
            this.economyBridge.registerKill(
                'local_player',
                enemySprite.walletAddress || `bot_${enemySprite.botId}`,
                weaponId
            );

            // Remove and respawn enemy (demo bots logic)
            if (enemySprite.playerRef) {
                enemySprite.playerRef.die();
                // Respawn logic inside bot manager, or here for demo:
                this.time.delayedCall(3000, () => {
                    enemySprite.playerRef.respawn(
                        Phaser.Math.Between(100, 700),
                        Phaser.Math.Between(100, 500)
                    );
                });
            } else {
                if (enemySprite.hpBar) enemySprite.hpBar.destroy();
                enemySprite.destroy();
                this.time.delayedCall(3000, () => {
                    this._spawnBot(
                        Phaser.Math.Between(100, 700),
                        Phaser.Math.Between(100, 500)
                    );
                });
            }
        });

        // ── Input ───────────────────────────────────────────────────
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(10);
        this.input.setDefaultCursor('none');

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this._shoot();
            }
        });

        // ── Camera & UI ─────────────────────────────────────────────
        this.cameras.main.setBackgroundColor('#0a0a0f');

        const grid = this.add.graphics();
        grid.lineStyle(0.5, 0x1a1a2a, 0.3);
        for (let x = 0; x < width; x += 32) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 32) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }
        grid.strokePath();
        grid.setDepth(0);
    }

    update() {
        if (!this.player || !this.player.isAlive) return;

        // ── WASD Movement ───────────────────────────────────────────
        const speed = this.player.speed;
        let vx = 0, vy = 0;

        if (this.wasd.left.isDown) vx = -speed;
        else if (this.wasd.right.isDown) vx = speed;

        if (this.wasd.up.isDown) vy = -speed;
        else if (this.wasd.down.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.sprite.setVelocity(vx, vy);

        // ── Rotate player to face mouse ─────────────────────────────
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.sprite.x, this.player.sprite.y,
            pointer.worldX, pointer.worldY
        );
        this.player.sprite.setRotation(angle);

        // ── Crosshair ───────────────────────────────────────────────
        this.crosshair.setPosition(pointer.worldX, pointer.worldY);

        // ── Demo Bots ───────────────────────────────────────────────
        this._updateDemoBots();
    }

    _shoot() {
        if (!this.player || !this.player.isAlive) return;

        const now = this.time.now;
        const weapon = this.player.currentWeapon;

        // Fire rate check
        if (now - this.player.lastShotTime < weapon.fireRate) return;
        this.player.lastShotTime = now;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.sprite.x, this.player.sprite.y,
            pointer.worldX, pointer.worldY
        );

        const bullet = this.bullets.get();
        if (bullet) {
            bullet.fire(
                this.player.sprite.x,
                this.player.sprite.y,
                angle,
                weapon.damage,
                weapon.id,
                'local_player'
            );
        }
    }

    _createArenaWalls(width, height) {
        for (let x = 0; x < width; x += 32) {
            this.walls.create(x + 16, 16, 'wall');
            this.walls.create(x + 16, height - 16, 'wall');
        }
        for (let y = 32; y < height - 32; y += 32) {
            this.walls.create(16, y + 16, 'wall');
            this.walls.create(width - 16, y + 16, 'wall');
        }
    }

    _createObstacles(width, height) {
        const cx = width / 2, cy = height / 2;
        for (let i = -2; i <= 2; i++) {
            this.walls.create(cx + i * 32, cy, 'wall');
            this.walls.create(cx, cy + i * 32, 'wall');
        }

        const corners = [
            { x: 160, y: 160 },
            { x: width - 160, y: 160 },
            { x: 160, y: height - 160 },
            { x: width - 160, y: height - 160 }
        ];

        corners.forEach(c => {
            for (let dx = 0; dx < 2; dx++) {
                for (let dy = 0; dy < 2; dy++) {
                    this.walls.create(c.x + dx * 32, c.y + dy * 32, 'wall');
                }
            }
        });
    }

    _spawnDemoBots() {
        const spawnPoints = [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ];

        spawnPoints.forEach((pos, i) => {
            this._spawnBot(pos.x, pos.y, i);
        });
    }

    _spawnBot(x, y, id) {
        // We use the Player entity for bots too to reuse HP/Damage logic
        const botEntity = new Player(this, x, y, false);
        botEntity.sprite.botId = id || Phaser.Math.Between(0, 9999);
        botEntity.sprite.walletAddress = `0xbot${botEntity.sprite.botId}`;
        botEntity.sprite.moveTimer = 0;
        botEntity.sprite.moveDir = { x: 0, y: 0 };

        // Add sprite to enemies group for collisions
        this.enemies.add(botEntity.sprite);

        // Important: set playerRef so CollisionSystem uses the entity's damage() method
        botEntity.sprite.playerRef = botEntity;

        botEntity.updateHpBar();
    }

    _updateDemoBots() {
        this.enemies.getChildren().forEach(botSprite => {
            if (!botSprite.active || !botSprite.playerRef.isAlive) return;

            const bot = botSprite;
            const entity = botSprite.playerRef;

            // Simple wandering AI
            bot.moveTimer = (bot.moveTimer || 0) + 1;
            if (bot.moveTimer > 120) {
                bot.moveTimer = 0;
                bot.moveDir = {
                    x: Phaser.Math.Between(-1, 1) * 80,
                    y: Phaser.Math.Between(-1, 1) * 80
                };
            }

            bot.setVelocity(bot.moveDir.x, bot.moveDir.y);

            // Face the player
            if (this.player && this.player.isAlive) {
                const angle = Phaser.Math.Angle.Between(
                    bot.x, bot.y,
                    this.player.sprite.x, this.player.sprite.y
                );
                bot.setRotation(angle);
            }

            entity.updateHpBar();
        });
    }
}
