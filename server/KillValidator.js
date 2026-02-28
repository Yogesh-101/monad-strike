/**
 * MonadStrike — Kill Validator
 *
 * Basic server-side anti-cheat: validates kill reports before
 * they're submitted to the chain. Checks distance, fire rate,
 * and target validity.
 */

// Weapon damage values must match contracts/config
const WEAPON_STATS = {
    0: { name: 'Glock', damage: 25, range: 300, cooldownMs: 400 },
    1: { name: 'Desert Eagle', damage: 55, range: 350, cooldownMs: 600 },
    2: { name: 'MP5', damage: 35, range: 280, cooldownMs: 200 },
    3: { name: 'AK-47', damage: 80, range: 400, cooldownMs: 300 },
    4: { name: 'AWP', damage: 120, range: 600, cooldownMs: 1500 },
    5: { name: 'HE Grenade', damage: 60, range: 150, cooldownMs: 2000 },
    6: { name: 'Armor', damage: 0, range: 0, cooldownMs: 0 }
};

export default class KillValidator {
    constructor() {
        // Track last shot time per player for fire rate validation
        this.lastShot = new Map(); // wallet → timestamp
    }

    /**
     * Validate a kill/damage report
     * @param {string} killerWallet
     * @param {string} victimWallet
     * @param {number} weaponId
     * @param {Map} players - active player map from server
     * @returns {{ valid: boolean, damage: number, reason?: string }}
     */
    validateKill(killerWallet, victimWallet, weaponId, players) {
        // ── Basic checks ──────────────────────────────────────────
        if (killerWallet === victimWallet) {
            return { valid: false, damage: 0, reason: 'Self-damage not allowed' };
        }

        if (!players.has(killerWallet)) {
            return { valid: false, damage: 0, reason: 'Killer not found' };
        }

        if (!players.has(victimWallet)) {
            return { valid: false, damage: 0, reason: 'Victim not found' };
        }

        const killer = players.get(killerWallet);
        const victim = players.get(victimWallet);

        // Dead players can't shoot
        if (killer.hp <= 0) {
            return { valid: false, damage: 0, reason: 'Killer is dead' };
        }

        // Can't shoot dead players
        if (victim.hp <= 0) {
            return { valid: false, damage: 0, reason: 'Victim is already dead' };
        }

        // ── Weapon validation ─────────────────────────────────────
        const weapon = WEAPON_STATS[weaponId];
        if (!weapon || weapon.damage === 0) {
            return { valid: false, damage: 0, reason: 'Invalid or non-damage weapon' };
        }

        // ── Fire rate check ───────────────────────────────────────
        const now = Date.now();
        const lastShotTime = this.lastShot.get(killerWallet) || 0;
        if (now - lastShotTime < weapon.cooldownMs * 0.8) {
            // Allow 20% tolerance for network latency
            return { valid: false, damage: 0, reason: 'Firing too fast' };
        }
        this.lastShot.set(killerWallet, now);

        // ── Distance check ────────────────────────────────────────
        const dx = killer.x - victim.x;
        const dy = killer.y - victim.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Allow 50% extra range tolerance for latency
        if (distance > weapon.range * 1.5) {
            return { valid: false, damage: 0, reason: 'Target out of range' };
        }

        // ── Calculate damage (with armor reduction) ───────────────
        let damage = weapon.damage;

        // Check if victim has armor (weapon ID 6)
        // In a full implementation this would check NFT balances,
        // but for the game server we track it locally
        if (victim.weapon === 6) {
            damage = Math.floor(damage * 0.6); // 40% damage reduction with armor
        }

        return { valid: true, damage };
    }

    /**
     * Clear tracking data for a player who disconnects
     */
    clearPlayer(wallet) {
        this.lastShot.delete(wallet);
    }

    /**
     * Reset all tracking for a new round
     */
    resetRound() {
        this.lastShot.clear();
    }
}
