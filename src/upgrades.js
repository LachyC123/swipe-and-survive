/**
 * ===================================
 * SWIPE & SURVIVE - Upgrades System
 * ===================================
 * 
 * Defines all upgrades with their effects, rarities, and apply logic.
 * Upgrades can stack and have multiple levels.
 */

console.log('upgrades.js loading...');

// Rarity configuration
const RARITY = {
    COMMON: {
        name: 'Common',
        color: 0x888888,
        colorHex: '#888888',
        glowColor: 0xaaaaaa,
        weight: 60
    },
    RARE: {
        name: 'Rare',
        color: 0x4488ff,
        colorHex: '#4488ff',
        glowColor: 0x6699ff,
        weight: 30
    },
    EPIC: {
        name: 'Epic',
        color: 0xaa44ff,
        colorHex: '#aa44ff',
        glowColor: 0xcc66ff,
        weight: 10
    }
};

// Upgrade definitions - 24 unique upgrades
const UPGRADE_DEFINITIONS = {
    // === COMMON UPGRADES ===
    damage_up: {
        id: 'damage_up',
        name: 'Power Surge',
        description: 'Increase damage by 15%',
        icon: '⚡',
        rarity: RARITY.COMMON,
        maxLevel: 10,
        apply: (stats, level) => {
            stats.damageMultiplier += 0.15;
        }
    },
    
    attack_speed: {
        id: 'attack_speed',
        name: 'Rapid Fire',
        description: 'Increase attack speed by 12%',
        icon: '🔥',
        rarity: RARITY.COMMON,
        maxLevel: 8,
        apply: (stats, level) => {
            stats.attackSpeedMultiplier += 0.12;
        }
    },
    
    max_hp: {
        id: 'max_hp',
        name: 'Vitality',
        description: 'Increase max HP by 20',
        icon: '❤️',
        rarity: RARITY.COMMON,
        maxLevel: 10,
        apply: (stats, level) => {
            stats.maxHp += 20;
        }
    },
    
    move_speed: {
        id: 'move_speed',
        name: 'Swift Feet',
        description: 'Increase movement speed by 8%',
        icon: '👟',
        rarity: RARITY.COMMON,
        maxLevel: 6,
        apply: (stats, level) => {
            stats.moveSpeedMultiplier += 0.08;
        }
    },
    
    dash_cooldown: {
        id: 'dash_cooldown',
        name: 'Quick Dash',
        description: 'Reduce dash cooldown by 10%',
        icon: '💨',
        rarity: RARITY.COMMON,
        maxLevel: 6,
        apply: (stats, level) => {
            stats.dashCooldownMultiplier -= 0.10;
        }
    },
    
    xp_gain: {
        id: 'xp_gain',
        name: 'Knowledge',
        description: 'Increase XP gain by 15%',
        icon: '📚',
        rarity: RARITY.COMMON,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.xpGainMultiplier += 0.15;
        }
    },
    
    magnet_range: {
        id: 'magnet_range',
        name: 'Magnetism',
        description: 'Increase pickup range by 25%',
        icon: '🧲',
        rarity: RARITY.COMMON,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.magnetRange += 30;
        }
    },
    
    projectile_size: {
        id: 'projectile_size',
        name: 'Big Shots',
        description: 'Increase projectile size by 20%',
        icon: '🔮',
        rarity: RARITY.COMMON,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.projectileSizeMultiplier += 0.20;
        }
    },
    
    // === RARE UPGRADES ===
    lifesteal: {
        id: 'lifesteal',
        name: 'Vampiric Touch',
        description: 'Heal 3% of damage dealt',
        icon: '🩸',
        rarity: RARITY.RARE,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.lifestealPercent += 0.03;
        }
    },
    
    crit_chance: {
        id: 'crit_chance',
        name: 'Precision',
        description: 'Gain 8% critical hit chance',
        icon: '🎯',
        rarity: RARITY.RARE,
        maxLevel: 6,
        apply: (stats, level) => {
            stats.critChance += 0.08;
        }
    },
    
    crit_damage: {
        id: 'crit_damage',
        name: 'Devastation',
        description: 'Critical hits deal 25% more damage',
        icon: '💥',
        rarity: RARITY.RARE,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.critDamageMultiplier += 0.25;
        }
    },
    
    pierce: {
        id: 'pierce',
        name: 'Piercing Shots',
        description: 'Projectiles pierce +1 enemy',
        icon: '🗡️',
        rarity: RARITY.RARE,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.pierceCount += 1;
        }
    },
    
    bounce: {
        id: 'bounce',
        name: 'Ricochet',
        description: 'Projectiles bounce to +1 enemy',
        icon: '↩️',
        rarity: RARITY.RARE,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.bounceCount += 1;
        }
    },
    
    freeze_chance: {
        id: 'freeze_chance',
        name: 'Frost Touch',
        description: '10% chance to freeze enemies',
        icon: '❄️',
        rarity: RARITY.RARE,
        maxLevel: 4,
        apply: (stats, level) => {
            stats.freezeChance += 0.10;
        }
    },
    
    thorns: {
        id: 'thorns',
        name: 'Thorns',
        description: 'Return 15% damage to attackers',
        icon: '🌵',
        rarity: RARITY.RARE,
        maxLevel: 5,
        apply: (stats, level) => {
            stats.thornsPercent += 0.15;
        }
    },
    
    heal_on_wave: {
        id: 'heal_on_wave',
        name: 'Second Wind',
        description: 'Heal 15 HP when wave ends',
        icon: '🌿',
        rarity: RARITY.RARE,
        maxLevel: 4,
        apply: (stats, level) => {
            stats.healOnWave += 15;
        }
    },
    
    extra_projectile: {
        id: 'extra_projectile',
        name: 'Multi-Shot',
        description: 'Fire +1 additional projectile',
        icon: '🎇',
        rarity: RARITY.RARE,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.extraProjectiles += 1;
        }
    },
    
    // === EPIC UPGRADES ===
    chain_lightning: {
        id: 'chain_lightning',
        name: 'Chain Lightning',
        description: 'Attacks chain to 2 nearby enemies',
        icon: '⛓️',
        rarity: RARITY.EPIC,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.chainLightning += 2;
        }
    },
    
    shield_on_dash: {
        id: 'shield_on_dash',
        name: 'Dash Shield',
        description: 'Gain a 1-hit shield after dashing',
        icon: '🛡️',
        rarity: RARITY.EPIC,
        maxLevel: 1,
        apply: (stats, level) => {
            stats.shieldOnDash = true;
        }
    },
    
    orbiting_blades: {
        id: 'orbiting_blades',
        name: 'Orbital Blades',
        description: '+2 blades orbit around you',
        icon: '🔪',
        rarity: RARITY.EPIC,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.orbitingBlades += 2;
        }
    },
    
    dash_trail_damage: {
        id: 'dash_trail_damage',
        name: 'Blazing Trail',
        description: 'Dash leaves damaging trail',
        icon: '🌟',
        rarity: RARITY.EPIC,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.dashTrailDamage += 10;
        }
    },
    
    overcharge: {
        id: 'overcharge',
        name: 'Overcharge',
        description: '+50% fire rate for 2s after dash',
        icon: '⚡',
        rarity: RARITY.EPIC,
        maxLevel: 2,
        apply: (stats, level) => {
            stats.overchargeBonus += 0.50;
            stats.overchargeDuration += 2000;
        }
    },
    
    barrier: {
        id: 'barrier',
        name: 'Energy Barrier',
        description: 'Absorb 1 hit every 15 seconds',
        icon: '🔰',
        rarity: RARITY.EPIC,
        maxLevel: 2,
        apply: (stats, level) => {
            stats.barrierCharges += 1;
            stats.barrierCooldown = Math.max(8000, 15000 - (level - 1) * 3000);
        }
    },
    
    explosive_kills: {
        id: 'explosive_kills',
        name: 'Volatile',
        description: 'Enemies explode on death for 20 damage',
        icon: '💣',
        rarity: RARITY.EPIC,
        maxLevel: 3,
        apply: (stats, level) => {
            stats.explosiveKillDamage += 20;
        }
    }
};

/**
 * Manages player upgrades during a run
 */
class UpgradeManager {
    constructor() {
        this.reset();
    }
    
    /**
     * Reset all upgrades for a new run
     */
    reset() {
        this.acquired = {}; // { upgradeId: level }
        this.stats = this.getBaseStats();
        this.rerollsUsed = 0;
    }
    
    /**
     * Get base player stats
     */
    getBaseStats() {
        return {
            // Damage
            damageMultiplier: 1.0,
            attackSpeedMultiplier: 1.0,
            critChance: 0.05,
            critDamageMultiplier: 1.5,
            
            // Defense
            maxHp: 100,
            thornsPercent: 0,
            
            // Movement
            moveSpeedMultiplier: 1.0,
            dashCooldownMultiplier: 1.0,
            
            // Projectiles
            pierceCount: 0,
            bounceCount: 0,
            extraProjectiles: 0,
            projectileSizeMultiplier: 1.0,
            chainLightning: 0,
            
            // Special effects
            lifestealPercent: 0,
            freezeChance: 0,
            shieldOnDash: false,
            orbitingBlades: 0,
            dashTrailDamage: 0,
            overchargeBonus: 0,
            overchargeDuration: 0,
            barrierCharges: 0,
            barrierCooldown: 15000,
            explosiveKillDamage: 0,
            
            // Utility
            magnetRange: 60,
            xpGainMultiplier: 1.0,
            healOnWave: 0
        };
    }
    
    /**
     * Apply an upgrade to the player
     */
    applyUpgrade(upgradeId) {
        const def = UPGRADE_DEFINITIONS[upgradeId];
        if (!def) return false;
        
        const currentLevel = this.acquired[upgradeId] || 0;
        if (currentLevel >= def.maxLevel) return false;
        
        // Increment level
        this.acquired[upgradeId] = currentLevel + 1;
        
        // Recalculate all stats
        this.recalculateStats();
        
        return true;
    }
    
    /**
     * Recalculate all stats from base + upgrades
     */
    recalculateStats() {
        this.stats = this.getBaseStats();
        
        for (const [upgradeId, level] of Object.entries(this.acquired)) {
            const def = UPGRADE_DEFINITIONS[upgradeId];
            if (def && def.apply) {
                // Apply upgrade for each level
                for (let i = 0; i < level; i++) {
                    def.apply(this.stats, i + 1);
                }
            }
        }
    }
    
    /**
     * Get upgrade level for a specific upgrade
     */
    getUpgradeLevel(upgradeId) {
        return this.acquired[upgradeId] || 0;
    }
    
    /**
     * Check if upgrade is at max level
     */
    isMaxLevel(upgradeId) {
        const def = UPGRADE_DEFINITIONS[upgradeId];
        if (!def) return true;
        return (this.acquired[upgradeId] || 0) >= def.maxLevel;
    }
    
    /**
     * Get random upgrade choices for the selection screen
     * @param {number} count - Number of choices to generate
     * @returns {Array} Array of upgrade definitions
     */
    getRandomChoices(count = 3) {
        // Get available upgrades (not maxed)
        const available = Object.values(UPGRADE_DEFINITIONS).filter(
            def => !this.isMaxLevel(def.id)
        );
        
        if (available.length === 0) {
            // All maxed - return some anyway for display
            return Object.values(UPGRADE_DEFINITIONS).slice(0, count);
        }
        
        // Weighted random selection based on rarity
        const choices = [];
        const used = new Set();
        
        while (choices.length < count && choices.length < available.length) {
            const selected = this.weightedRandom(available.filter(u => !used.has(u.id)));
            if (selected) {
                choices.push(selected);
                used.add(selected.id);
            }
        }
        
        return choices;
    }
    
    /**
     * Weighted random selection based on rarity
     */
    weightedRandom(upgrades) {
        if (upgrades.length === 0) return null;
        
        const totalWeight = upgrades.reduce((sum, u) => sum + u.rarity.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const upgrade of upgrades) {
            random -= upgrade.rarity.weight;
            if (random <= 0) return upgrade;
        }
        
        return upgrades[0];
    }
    
    /**
     * Get list of acquired upgrades with their levels
     */
    getAcquiredList() {
        return Object.entries(this.acquired).map(([id, level]) => ({
            ...UPGRADE_DEFINITIONS[id],
            currentLevel: level
        }));
    }
    
    /**
     * Check if player can reroll this intermission
     */
    canReroll() {
        return this.rerollsUsed < 1;
    }
    
    /**
     * Use a reroll
     */
    useReroll() {
        if (this.canReroll()) {
            this.rerollsUsed++;
            return true;
        }
        return false;
    }
    
    /**
     * Reset rerolls for new intermission
     */
    resetRerolls() {
        this.rerollsUsed = 0;
    }
}

// Export for use in other files
window.RARITY = RARITY;
window.UPGRADE_DEFINITIONS = UPGRADE_DEFINITIONS;
window.UpgradeManager = UpgradeManager;
