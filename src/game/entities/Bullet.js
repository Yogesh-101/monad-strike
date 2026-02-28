import Phaser from 'phaser';

/**
 * Bullet Entity — projectile with velocity, damage, and auto-destroy.
 */
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 500;
        this.damage = 25;
        this.weaponId = 0;
        this.ownerId = null;
        this.lifespan = 2000; // ms
        this.born = 0;
    }

    fire(x, y, angle, damage, weaponId, ownerId) {
        this.setPosition(x, y);
        this.setActive(true).setVisible(true);
        this.setDepth(4);

        this.damage = damage;
        this.weaponId = weaponId;
        this.ownerId = ownerId;
        this.born = this.scene.time.now;

        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );

        // Muzzle flash
        const flash = this.scene.add.circle(x, y, 8, 0xf59e0b, 0.8);
        flash.setDepth(6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2.5,
            scaleY: 2.5,
            duration: 80,
            onComplete: () => flash.destroy()
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Auto-destroy after lifespan
        if (time - this.born > this.lifespan) {
            this.setActive(false).setVisible(false);
            this.body.stop();
        }

        // Out of bounds
        if (this.x < -20 || this.x > 820 || this.y < -20 || this.y > 620) {
            this.setActive(false).setVisible(false);
            this.body.stop();
        }
    }
}
