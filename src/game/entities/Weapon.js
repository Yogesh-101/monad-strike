import { WEAPONS, WEAPON_LIST } from '../../config/weapons';

/**
 * Weapon — weapon stats manager for use in Phaser scenes.
 * Provides fire rate control, damage lookup, and ammo management.
 */
export default class Weapon {
    constructor(weaponId = 0) {
        this.setWeapon(weaponId);
    }

    setWeapon(weaponId) {
        const weapon = WEAPON_LIST.find(w => w.id === weaponId) || WEAPON_LIST[0];
        this.id = weapon.id;
        this.name = weapon.name;
        this.damage = weapon.damage;
        this.fireRate = weapon.fireRate;
        this.maxAmmo = weapon.ammo;
        this.ammo = weapon.ammo;
        this.cost = weapon.cost;
        this.killReward = weapon.killReward;
        this.type = weapon.type;
        this.icon = weapon.icon;
        this.lastFireTime = 0;
    }

    canFire(currentTime) {
        if (this.ammo <= 0) return false;
        if (this.fireRate === 0) return false; // Passive items
        return (currentTime - this.lastFireTime) >= this.fireRate;
    }

    fire(currentTime) {
        if (!this.canFire(currentTime)) return false;
        this.lastFireTime = currentTime;
        this.ammo--;
        return true;
    }

    reload() {
        this.ammo = this.maxAmmo;
    }

    getStats() {
        return {
            id: this.id,
            name: this.name,
            damage: this.damage,
            fireRate: this.fireRate,
            ammo: this.ammo,
            maxAmmo: this.maxAmmo,
            icon: this.icon,
            type: this.type
        };
    }

    static getWeaponById(id) {
        return WEAPON_LIST.find(w => w.id === id) || WEAPON_LIST[0];
    }

    static getAllWeapons() {
        return WEAPON_LIST;
    }
}
