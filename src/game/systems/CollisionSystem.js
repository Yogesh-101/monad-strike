/**
 * CollisionSystem — Centralized collision detection and resolution.
 * Used by GameScene for bullet-enemy, player-wall, etc.
 */
export default class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Set up all colliders for the scene
     */
    setup(player, enemies, bullets, walls) {
        const scene = this.scene;

        // Player vs walls
        scene.physics.add.collider(player, walls);

        // Enemies vs walls
        scene.physics.add.collider(enemies, walls);

        // Bullets vs walls — destroy bullet
        scene.physics.add.overlap(
            bullets,
            walls,
            (bullet) => {
                bullet.setActive(false).setVisible(false);
                if (bullet.body) bullet.body.stop();
            },
            null,
            scene
        );

        // Bullets vs enemies — damage
        scene.physics.add.overlap(
            bullets,
            enemies,
            (bullet, enemy) => {
                if (!bullet.active || !enemy.active) return;

                // Disable bullet
                bullet.setActive(false).setVisible(false);
                if (bullet.body) bullet.body.stop();

                // Damage enemy through Player entity ref
                const playerRef = enemy.playerRef;
                if (playerRef) {
                    const isDead = playerRef.damage(bullet.damage);
                    playerRef.updateHpBar();

                    if (isDead) {
                        scene.events.emit('enemyKilled', {
                            enemy: playerRef,
                            enemySprite: enemy,
                            weaponId: bullet.weaponId,
                            ownerId: bullet.ownerId
                        });
                    }
                } else {
                    // Fallback: direct HP manipulation
                    enemy.hp = (enemy.hp || 100) - bullet.damage;
                    enemy.setTint(0xff0000);
                    scene.time.delayedCall(100, () => {
                        if (enemy.active) enemy.clearTint();
                    });

                    if (enemy.hp <= 0) {
                        scene.events.emit('enemyKilled', {
                            enemySprite: enemy,
                            weaponId: bullet.weaponId,
                            ownerId: bullet.ownerId
                        });
                    }
                }
            },
            null,
            scene
        );
    }

    /**
     * Check distance between two points (for range validation)
     */
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /**
     * Check if point is within arena bounds
     */
    static inBounds(x, y, width = 800, height = 600, margin = 32) {
        return x >= margin && x <= width - margin && y >= margin && y <= height - margin;
    }
}
