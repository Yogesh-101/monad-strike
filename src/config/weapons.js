// MonadStrike — Weapon Definitions (mirrors CS:GO economy)
export const WEAPONS = {
    GLOCK: {
        id: 0,
        name: 'Glock',
        cost: 0.001,
        damage: 25,
        type: 'Pistol',
        fireRate: 400,
        ammo: 20,
        killReward: 0.001,
        icon: '🔫'
    },
    DEAGLE: {
        id: 1,
        name: 'Desert Eagle',
        cost: 0.003,
        damage: 55,
        type: 'Pistol',
        fireRate: 600,
        ammo: 7,
        killReward: 0.001,
        icon: '🔫'
    },
    MP5: {
        id: 2,
        name: 'MP5',
        cost: 0.006,
        damage: 35,
        type: 'SMG',
        fireRate: 200,
        ammo: 30,
        killReward: 0.003,
        icon: '🔫'
    },
    AK47: {
        id: 3,
        name: 'AK-47',
        cost: 0.012,
        damage: 80,
        type: 'Rifle',
        fireRate: 300,
        ammo: 30,
        killReward: 0.002,
        icon: '🔫'
    },
    AWP: {
        id: 4,
        name: 'AWP',
        cost: 0.018,
        damage: 120,
        type: 'Sniper',
        fireRate: 1500,
        ammo: 10,
        killReward: 0.001,
        icon: '🎯'
    },
    HE_GRENADE: {
        id: 5,
        name: 'HE Grenade',
        cost: 0.002,
        damage: 60,
        type: 'Utility',
        fireRate: 0,
        ammo: 1,
        killReward: 0.002,
        icon: '💣'
    },
    ARMOR: {
        id: 6,
        name: 'Armor',
        cost: 0.003,
        damage: 0,
        type: 'Defense',
        fireRate: 0,
        ammo: 0,
        killReward: 0,
        icon: '🛡️'
    }
};

export const WEAPON_LIST = Object.values(WEAPONS);

// Round loss bonus for losing team
export const ROUND_LOSS_BONUS = 0.002;

// Entry fee to join a round
export const ENTRY_FEE = 0.005;

// Round timing (seconds)
export const ROUND_TIMING = {
    BUY_PHASE: 30,
    ROUND_LIVE: 90,
    SETTLEMENT: 5,
    RESULTS: 10
};

// Game constants
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;
export const PLAYER_MAX_HP = 100;
export const KILL_BATCH_INTERVAL = 10000; // 10 seconds in ms
