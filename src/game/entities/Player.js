import Phaser from 'phaser';
import { WEAPON_LIST } from '../../config/weapons';

/**
 * Player Entity — self-contained player with HP, weapon, and movement.
 * Created once in GameScene, updated every frame.
 */
export default class Player {
    constructor(scene, x, y, isLocal = true) {
        this.scene = scene;
        this.isLocal = isLocal;

        // Sprite
        this.sprite = scene.physics.add.sprite(x, y, isLocal ? 'player' : 'enemy');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(5);
        this.sprite.setScale(1);

        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.armor = 0;
        this.speed = 200;
        this.isAlive = true;

        // Weapon system
        this.currentWeaponId = 0; // Glock default
        this.currentWeapon = WEAPON_LIST[0];
        this.lastShotTime = 0;

        // Player name tag
        if (!isLocal) {
            this.nameTag = scene.add.text(x, y - 28, '', {
                fontFamily: 'JetBrains Mono',
                fontSize: '9px',
                color: '#ef4444',
                align: 'center'
            }).setOrigin(0.5).setDepth(6);
        }

        // HP bar
        this.hpBar = scene.add.graphics();
        this.hpBar.setDepth(7);

        // Reference back
        this.sprite.playerRef = this;
    }

    setWeapon(weaponId) {
        const weapon = WEAPON_LIST.find(w => w.id === weaponId);
        if (weapon) {
            this.currentWeaponId = weaponId;
            this.currentWeapon = weapon;
        }
    }

    damage(amount) {
        // Armor absorbs 50% damage
        let actualDamage = amount;
        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.5);
            this.armor -= absorbed;
            actualDamage -= absorbed;
        }

        this.hp = Math.max(0, this.hp - actualDamage);

        // Flash red
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite.active) this.sprite.clearTint();
        });

        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    respawn(x, y) {
        this.hp = this.maxHp;
        this.armor = 0;
        this.isAlive = true;
        this.sprite.setActive(true).setVisible(true);
        this.sprite.setPosition(x, y);
        this.sprite.clearTint();
    }

    die() {
        this.isAlive = false;
        this.sprite.setActive(false).setVisible(false);

        // Death particles
        for (let i = 0; i < 10; i++) {
            const p = this.scene.add.circle(
                this.sprite.x + Phaser.Math.Between(-12, 12),
                this.sprite.y + Phaser.Math.Between(-12, 12),
                Phaser.Math.Between(2, 5),
                this.isLocal ? 0x00ff9d : 0xff4444,
                0.8
            );
            this.scene.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-40, 40),
                y: p.y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: 600,
                onComplete: () => p.destroy()
            });
        }
    }

    updateHpBar() {
        if (!this.hpBar || !this.sprite.active) return;

        this.hpBar.clear();
        const barWidth = 32;
        const barHeight = 4;
        const x = this.sprite.x - barWidth / 2;
        const y = this.sprite.y - 22;

        // Background
        this.hpBar.fillStyle(0x1a1a2a, 0.8);
        this.hpBar.fillRect(x, y, barWidth, barHeight);

        // HP fill
        const pct = this.hp / this.maxHp;
        const color = pct > 0.5 ? 0x10b981 : pct > 0.25 ? 0xf59e0b : 0xef4444;
        this.hpBar.fillStyle(color, 1);
        this.hpBar.fillRect(x, y, barWidth * pct, barHeight);

        // Name tag
        if (this.nameTag) {
            this.nameTag.setPosition(this.sprite.x, y - 5);
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.hpBar) this.hpBar.destroy();
        if (this.nameTag) this.nameTag.destroy();
    }
}
