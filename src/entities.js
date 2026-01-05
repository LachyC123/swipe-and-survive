/**
 * ===================================
 * SWIPE & SURVIVE - Entities System
 * ===================================
 * 
 * Defines player, enemies, projectiles, and pickups.
 * Uses Phaser Graphics for procedural art (no external assets).
 */

console.log('entities.js loading...');

// ===================================
// PLAYER CLASS
// ===================================

class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create container for the player
        this.container = scene.add.container(x, y);
        this.container.setDepth(100);
        
        // Stats (will be modified by upgrades)
        this.baseSpeed = 180;
        this.hp = 100;
        this.maxHp = 100;
        this.baseDamage = 20;
        this.attackCooldown = 500; // ms
        this.lastAttackTime = 0;
        this.dashCooldown = 600; // Reduced from 800ms for better feel
        this.lastDashTime = -1000; // Allow immediate first dash
        this.dashSpeed = 500;
        this.dashDuration = 150;
        
        // State
        this.isDashing = false;
        this.isInvulnerable = false;
        this.hasShield = false;
        this.hasBarrier = false;
        this.barrierTimer = 0;
        this.overchargeTimer = 0;
        this.velocity = { x: 0, y: 0 };
        this.facing = { x: 1, y: 0 };
        
        // Orbiting blades
        this.orbitAngle = 0;
        this.orbitBlades = [];
        
        // Create visual representation
        this.createVisuals();
        
        // Physics body
        scene.physics.add.existing(this.container);
        this.body = this.container.body;
        this.body.setCircle(16, -16, -16);
        this.body.setCollideWorldBounds(true);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 20, 28, 10);
        
        // Body (cyan/teal hero)
        g.fillStyle(0x00cccc);
        g.fillRoundedRect(-14, -8, 28, 32, 6);
        
        // Body highlight
        g.fillStyle(0x00ffff, 0.5);
        g.fillRoundedRect(-10, -6, 10, 28, 4);
        
        // Head
        g.fillStyle(0x00aaaa);
        g.fillCircle(0, -14, 12);
        
        // Visor
        g.fillStyle(0x00ffff);
        g.fillRoundedRect(-8, -18, 16, 6, 2);
        
        // Visor glow
        g.fillStyle(0xffffff, 0.8);
        g.fillRoundedRect(-6, -17, 6, 4, 1);
        
        // Weapon arm
        g.fillStyle(0x008888);
        g.fillRoundedRect(10, -4, 10, 16, 3);
        
        // Weapon tip (blaster)
        g.fillStyle(0x00ffff);
        g.fillCircle(18, 2, 4);
        
        this.container.add(g);
        this.graphics = g;
        
        // Shield visual (hidden by default)
        this.shieldVisual = this.scene.add.graphics();
        this.shieldVisual.lineStyle(3, 0x00ffff, 0.8);
        this.shieldVisual.strokeCircle(0, 4, 26);
        this.shieldVisual.visible = false;
        this.container.add(this.shieldVisual);
        
        // Barrier visual
        this.barrierVisual = this.scene.add.graphics();
        this.barrierVisual.lineStyle(2, 0xffff00, 0.6);
        this.barrierVisual.strokeCircle(0, 4, 30);
        this.barrierVisual.visible = false;
        this.container.add(this.barrierVisual);
    }
    
    update(time, delta, stats) {
        // Safeguard: validate stats
        if (!stats) stats = {};
        
        // Safeguard: clamp delta to prevent huge jumps
        if (!isFinite(delta) || delta < 0) delta = 16;
        if (delta > 100) delta = 100;
        
        // Update overcharge timer
        if (this.overchargeTimer > 0) {
            this.overchargeTimer -= delta;
            if (this.overchargeTimer < 0) this.overchargeTimer = 0;
        }
        
        // Update barrier timer
        if (!this.hasBarrier && stats.barrierCharges > 0) {
            this.barrierTimer += delta;
            if (this.barrierTimer >= (stats.barrierCooldown || 15000)) {
                this.hasBarrier = true;
                this.barrierTimer = 0;
                if (this.barrierVisual) this.barrierVisual.visible = true;
            }
        }
        
        // Update shield visual
        if (this.shieldVisual) {
            this.shieldVisual.visible = this.hasShield;
        }
        
        // Update orbiting blades
        if (stats.orbitingBlades > 0 && this.scene) {
            this.updateOrbitingBlades(stats.orbitingBlades, delta);
        }
        
        // Orbit angle rotation with safeguard
        this.orbitAngle += delta * 0.003;
        // Prevent angle from growing infinitely
        if (this.orbitAngle > Math.PI * 2) {
            this.orbitAngle -= Math.PI * 2;
        }
    }
    
    updateOrbitingBlades(count, delta) {
        // Safeguard: validate scene
        if (!this.scene || !this.scene.add) return;
        
        // Ensure correct number of blades
        while (this.orbitBlades.length < count) {
            var blade = this.scene.add.graphics();
            blade.fillStyle(0x00ffff);
            blade.fillTriangle(0, -8, 4, 8, -4, 8);
            blade.lineStyle(1, 0xffffff);
            blade.strokeTriangle(0, -8, 4, 8, -4, 8);
            this.orbitBlades.push(blade);
        }
        
        // Update blade positions
        const radius = 45;
        for (let i = 0; i < this.orbitBlades.length; i++) {
            const angle = this.orbitAngle + (i * Math.PI * 2 / count);
            const blade = this.orbitBlades[i];
            blade.x = this.container.x + Math.cos(angle) * radius;
            blade.y = this.container.y + Math.sin(angle) * radius;
            blade.rotation = angle + Math.PI / 2;
            blade.setDepth(99);
        }
    }
    
    move(vx, vy) {
        if (this.isDashing) return;
        
        const stats = this.scene.upgradeManager?.stats || {};
        const speedMult = stats.moveSpeedMultiplier || 1;
        
        this.body.setVelocity(vx * this.baseSpeed * speedMult, vy * this.baseSpeed * speedMult);
        
        if (vx !== 0 || vy !== 0) {
            this.facing = { x: vx, y: vy };
        }
    }
    
    dash(dirX, dirY) {
        // Safeguard: validate scene and time
        if (!this.scene || !this.scene.time) return false;
        
        const time = this.scene.time.now;
        const stats = (this.scene.upgradeManager && this.scene.upgradeManager.stats) ? this.scene.upgradeManager.stats : {};
        const cooldownMult = Math.max(0.3, stats.dashCooldownMultiplier || 1);
        
        // Prevent double-dash
        if (this.isDashing) return false;
        if (time - this.lastDashTime < this.dashCooldown * cooldownMult) return false;
        
        this.lastDashTime = time;
        this.isDashing = true;
        this.isInvulnerable = true;
        
        // Normalize direction with safeguards
        var len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0 && isFinite(len)) {
            dirX /= len;
            dirY /= len;
        } else {
            // Default to facing direction if invalid
            dirX = this.facing.x || 1;
            dirY = this.facing.y || 0;
        }
        
        // Clamp direction values
        if (!isFinite(dirX)) dirX = 1;
        if (!isFinite(dirY)) dirY = 0;
        
        this.facing = { x: dirX, y: dirY };
        
        // Apply dash velocity with safeguard
        if (this.body) {
            this.body.setVelocity(dirX * this.dashSpeed, dirY * this.dashSpeed);
        }
        
        // Create dash trail
        this.createDashTrail();
        
        // Play dash sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playDash();
        }
        
        // Store reference to this for callbacks
        var self = this;
        var dashStats = stats; // Capture stats at dash time
        
        // End dash after duration - with safeguards
        try {
            this.scene.time.delayedCall(this.dashDuration, function() {
                // Safeguard: check if player/scene still valid
                if (!self || !self.scene) return;
                
                self.isDashing = false;
                if (self.body) {
                    self.body.setVelocity(0, 0);
                }
                
                // End invulnerability slightly after dash
                try {
                    self.scene.time.delayedCall(50, function() {
                        if (self) self.isInvulnerable = false;
                    });
                } catch (e) {
                    self.isInvulnerable = false;
                }
                
                // Shield on dash
                if (dashStats.shieldOnDash && !self.hasShield) {
                    self.hasShield = true;
                }
                
                // Overcharge
                if (dashStats.overchargeDuration > 0) {
                    self.overchargeTimer = dashStats.overchargeDuration;
                }
            });
        } catch (e) {
            // Reset dash state if delayed call fails
            this.isDashing = false;
            this.isInvulnerable = false;
        }
        
        // Dash trail damage
        if (stats.dashTrailDamage > 0) {
            this.createDamageTrail(dirX, dirY, stats.dashTrailDamage);
        }
        
        return true;
    }
    
    createDashTrail() {
        // Safeguard: validate scene
        if (!this.scene || !this.scene.add || !this.container) return;
        
        const reduced = localStorage.getItem('reducedEffects') === 'true';
        if (reduced) return;
        
        var self = this;
        
        // Create afterimages
        for (var i = 0; i < 3; i++) {
            (function(index) {
                try {
                    self.scene.time.delayedCall(index * 30, function() {
                        // Safeguard: check scene and container still exist
                        if (!self.scene || !self.scene.add || !self.container) return;
                        
                        var ghost = self.scene.add.graphics();
                        ghost.fillStyle(0x00ffff, 0.4 - index * 0.1);
                        ghost.fillRoundedRect(-14, -8, 28, 32, 6);
                        ghost.fillCircle(0, -14, 12);
                        ghost.x = self.container.x || 0;
                        ghost.y = self.container.y || 0;
                        ghost.setDepth(50);
                        
                        self.scene.tweens.add({
                            targets: ghost,
                            alpha: 0,
                            duration: 200,
                            onComplete: function() {
                                if (ghost && ghost.active !== false) {
                                    ghost.destroy();
                                }
                            }
                        });
                    });
                } catch (e) {
                    // Ignore errors from delayed calls
                }
            })(i);
        }
    }
    
    createDamageTrail(dirX, dirY, damage) {
        // Safeguard: validate scene
        if (!this.scene || !this.scene.add || !this.container) return;
        
        try {
            var trailZone = this.scene.add.zone(
                this.container.x || 0,
                this.container.y || 0,
                this.dashSpeed * this.dashDuration / 1000 * 2,
                40
            );
            trailZone.damage = damage;
            
            var rotation = Math.atan2(dirY, dirX);
            if (!isFinite(rotation)) rotation = 0;
            trailZone.setRotation(rotation);
            
            this.scene.physics.add.existing(trailZone, true);
            if (this.scene.dashTrails) {
                this.scene.dashTrails.add(trailZone);
            }
            
            // Visual
            var trailGraphics = this.scene.add.graphics();
            trailGraphics.fillStyle(0xff8800, 0.4);
            trailGraphics.fillRect(-trailZone.width / 2, -20, trailZone.width, 40);
            trailGraphics.x = trailZone.x;
            trailGraphics.y = trailZone.y;
            trailGraphics.rotation = trailZone.rotation;
            
            this.scene.time.delayedCall(300, function() {
                if (trailZone && trailZone.active !== false) trailZone.destroy();
                if (trailGraphics && trailGraphics.active !== false) trailGraphics.destroy();
            });
        } catch (e) {
            // Ignore errors
        }
    }
    
    canAttack() {
        const time = this.scene.time.now;
        const stats = this.scene.upgradeManager?.stats || {};
        let cooldown = this.attackCooldown / (stats.attackSpeedMultiplier || 1);
        
        // Overcharge bonus
        if (this.overchargeTimer > 0 && stats.overchargeBonus > 0) {
            cooldown /= (1 + stats.overchargeBonus);
        }
        
        return time - this.lastAttackTime >= cooldown;
    }
    
    attack(target) {
        if (!this.canAttack()) return;
        
        this.lastAttackTime = this.scene.time.now;
        const stats = this.scene.upgradeManager?.stats || {};
        
        // Calculate damage
        let damage = this.baseDamage * (stats.damageMultiplier || 1);
        
        // Berserker rage perk: +50% damage when below 30% HP
        if (this.scene.selectedCharacter && this.scene.selectedCharacter.perk === 'rage') {
            var maxHp = stats.maxHp || this.maxHp || 100;
            if (this.hp < maxHp * 0.3) {
                damage *= 1.5;
            }
        }
        
        const isCrit = Math.random() < (stats.critChance || 0.05);
        if (isCrit) {
            damage *= (stats.critDamageMultiplier || 1.5);
        }
        
        // Fire projectile(s)
        const projectileCount = 1 + (stats.extraProjectiles || 0);
        const spreadAngle = projectileCount > 1 ? Math.PI / 8 : 0;
        
        const baseAngle = Math.atan2(
            target.container.y - this.container.y,
            target.container.x - this.container.x
        );
        
        for (let i = 0; i < projectileCount; i++) {
            const angleOffset = projectileCount > 1 
                ? spreadAngle * (i - (projectileCount - 1) / 2) 
                : 0;
            const angle = baseAngle + angleOffset;
            
            this.scene.createPlayerProjectile(
                this.container.x + 18 * Math.cos(angle),
                this.container.y + 18 * Math.sin(angle),
                angle,
                damage,
                isCrit,
                stats
            );
        }
        
        // Play attack sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playShoot();
        }
    }
    
    takeDamage(amount, source) {
        if (this.isInvulnerable) return false;
        
        const stats = (this.scene && this.scene.upgradeManager) ? this.scene.upgradeManager.stats : {};
        
        // Check barrier first
        if (this.hasBarrier) {
            this.hasBarrier = false;
            if (this.barrierVisual) this.barrierVisual.visible = false;
            this.barrierTimer = 0;
            this.createHitFlash(0xffff00);
            return false;
        }
        
        // Check shield
        if (this.hasShield) {
            this.hasShield = false;
            this.createHitFlash(0x00ffff);
            return false;
        }
        
        this.hp -= amount;
        this.createHitFlash(0xff0000);
        
        // Brief invulnerability after taking damage (300ms)
        this.isInvulnerable = true;
        var self = this;
        try {
            this.scene.time.delayedCall(300, function() {
                // Only reset if not dashing (dash has its own invuln)
                if (self && !self.isDashing) {
                    self.isInvulnerable = false;
                }
            });
        } catch(e) {
            // Fallback: reset after timeout
            setTimeout(function() { if (self) self.isInvulnerable = false; }, 300);
        }
        
        // Knockback from damage source
        if (source && source.container && this.body) {
            var knockDir = Math.atan2(
                this.container.y - source.container.y,
                this.container.x - source.container.x
            );
            var knockForce = 150;
            this.body.setVelocity(
                Math.cos(knockDir) * knockForce,
                Math.sin(knockDir) * knockForce
            );
        }
        
        // Thorns damage
        if (stats && stats.thornsPercent > 0 && source && source.takeDamage) {
            var thornsDamage = amount * stats.thornsPercent;
            source.takeDamage(thornsDamage, null, false);
        }
        
        // Screen shake
        var reduced = localStorage.getItem('reducedEffects') === 'true';
        if (!reduced && this.scene && this.scene.cameras) {
            this.scene.cameras.main.shake(100, 0.01);
        }
        
        // Play hit sound
        if (this.scene && this.scene.audioManager) {
            this.scene.audioManager.playHit();
        }
        
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Player died
        }
        
        return false;
    }
    
    heal(amount) {
        const stats = this.scene.upgradeManager?.stats || {};
        const maxHp = stats.maxHp || this.maxHp;
        this.hp = Math.min(this.hp + amount, maxHp);
    }
    
    createHitFlash(color) {
        // Safeguard: validate scene and container
        if (!this.scene || !this.scene.add || !this.container) return;
        
        try {
            var flash = this.scene.add.graphics();
            flash.fillStyle(color, 0.5);
            flash.fillCircle(0, 0, 30);
            flash.x = this.container.x || 0;
            flash.y = this.container.y || 0;
            flash.setDepth(101);
            
            this.scene.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 1.5,
                duration: 150,
                onComplete: function() {
                    if (flash && flash.active !== false) flash.destroy();
                }
            });
        } catch (e) {
            // Ignore errors
        }
    }
    
    checkOrbitBladeDamage(enemies) {
        if (!this.orbitBlades || this.orbitBlades.length === 0) return;
        if (!enemies || !enemies.getChildren) return;
        
        var bladeDamage = 15;
        
        for (var i = 0; i < this.orbitBlades.length; i++) {
            var blade = this.orbitBlades[i];
            if (!blade) continue;
            
            var children = enemies.getChildren();
            for (var j = 0; j < children.length; j++) {
                var enemy = children[j];
                if (!enemy || !enemy.active) continue;
                
                // Safeguard: validate enemy container
                if (!enemy.container) continue;
                
                var dist = Phaser.Math.Distance.Between(
                    blade.x || 0, blade.y || 0,
                    enemy.container.x || 0, enemy.container.y || 0
                );
                
                if (isFinite(dist) && dist < 25 && !enemy.bladeHitCooldown) {
                    enemy.takeDamage(bladeDamage, null, false);
                    enemy.bladeHitCooldown = true;
                    try {
                        this.scene.time.delayedCall(300, function() {
                            if (enemy && enemy.active) enemy.bladeHitCooldown = false;
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        }
    }
    
    destroy() {
        // Clean up orbiting blades with safeguards
        if (this.orbitBlades) {
            for (var i = 0; i < this.orbitBlades.length; i++) {
                var blade = this.orbitBlades[i];
                if (blade && blade.destroy) {
                    try { blade.destroy(); } catch (e) {}
                }
            }
            this.orbitBlades = [];
        }
        if (this.container && this.container.destroy) {
            try { this.container.destroy(); } catch (e) {}
        }
    }
}

// ===================================
// BASE ENEMY CLASS
// ===================================

class Enemy {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type;
        this.active = true;
        
        // Create container
        this.container = scene.add.container(x, y);
        this.container.setDepth(90);
        
        // Default stats (overridden by subclasses)
        this.hp = 30;
        this.maxHp = 30;
        this.speed = 80;
        this.damage = 10;
        this.xpValue = 3; // Reduced from 10
        this.essenceValue = 1;
        
        // State
        this.isStunned = false;
        this.isFrozen = false;
        this.freezeTimer = 0;
        this.knockbackVelocity = { x: 0, y: 0 };
        this.bladeHitCooldown = false;
        
        // Setup physics
        scene.physics.add.existing(this.container);
        this.body = this.container.body;
    }
    
    update(time, delta, player) {
        if (!this.active) return;
        
        // Safeguard: validate scene exists
        if (!this.scene || !this.body) return;
        
        // Update freeze
        if (this.isFrozen) {
            this.freezeTimer -= delta;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                // Restore alpha when unfreezing (Graphics don't support setTint)
                if (this.graphics && this.graphics.active !== false) {
                    this.graphics.setAlpha(1);
                }
                // Remove freeze overlay if exists
                if (this.freezeOverlay) {
                    this.freezeOverlay.destroy();
                    this.freezeOverlay = null;
                }
            }
            if (this.body) {
                this.body.setVelocity(0, 0);
            }
            return;
        }
        
        // Apply knockback decay with safeguards
        if (this.knockbackVelocity) {
            this.knockbackVelocity.x *= 0.9;
            this.knockbackVelocity.y *= 0.9;
            // Clamp to prevent NaN/Infinity
            if (!isFinite(this.knockbackVelocity.x)) this.knockbackVelocity.x = 0;
            if (!isFinite(this.knockbackVelocity.y)) this.knockbackVelocity.y = 0;
        }
    }
    
    takeDamage(amount, sourceAngle, isCrit) {
        // Safeguard: validate this enemy is still active
        if (!this.active || !this.scene) return false;
        
        // Safeguard: clamp damage to valid number
        if (!isFinite(amount) || amount < 0) amount = 0;
        
        this.hp -= amount;
        
        // Hit flash using alpha (Graphics don't support setTint)
        if (this.graphics && this.graphics.active !== false && this.container && this.container.active !== false) {
            this.graphics.setAlpha(0.5);
            // Use try-catch for delayed call in case scene is destroyed
            try {
                this.scene.time.delayedCall(50, () => {
                    if (this.graphics && this.active && this.graphics.active !== false) {
                        this.graphics.setAlpha(this.isFrozen ? 0.7 : 1);
                    }
                });
            } catch (e) {
                // Scene may have been destroyed
            }
        }
        
        // Damage number with safeguards
        if (this.scene && this.scene.createDamageNumber && this.container) {
            var dmgX = this.container.x || 0;
            var dmgY = (this.container.y || 0) - 20;
            // Clamp position to valid range
            if (isFinite(dmgX) && isFinite(dmgY)) {
                this.scene.createDamageNumber(dmgX, dmgY, Math.round(amount), isCrit);
            }
        }
        
        // Knockback with safeguards
        if (sourceAngle !== null && isFinite(sourceAngle) && this.knockbackVelocity) {
            var knockbackForce = 100;
            this.knockbackVelocity.x = Math.cos(sourceAngle) * knockbackForce;
            this.knockbackVelocity.y = Math.sin(sourceAngle) * knockbackForce;
        }
        
        // Hit particles
        if (this.scene && this.createHitParticles) {
            this.createHitParticles();
        }
        
        // Freeze chance
        var stats = (this.scene && this.scene.upgradeManager) ? this.scene.upgradeManager.stats : {};
        if (stats && stats.freezeChance > 0 && Math.random() < stats.freezeChance) {
            this.freeze(1500);
        }
        
        // Check death
        if (this.hp <= 0) {
            this.die();
            return true;
        }
        
        return false;
    }
    
    freeze(duration) {
        if (!this.active || !this.scene) return;
        
        this.isFrozen = true;
        this.freezeTimer = duration;
        
        // Use alpha change for freeze effect (Graphics don't support setTint)
        if (this.graphics && this.graphics.active !== false) {
            this.graphics.setAlpha(0.7);
        }
        
        // Create blue freeze overlay on container
        if (this.container && this.container.active !== false && !this.freezeOverlay) {
            try {
                this.freezeOverlay = this.scene.add.graphics();
                this.freezeOverlay.fillStyle(0x8888ff, 0.3);
                this.freezeOverlay.fillCircle(0, 0, 20);
                this.container.add(this.freezeOverlay);
            } catch (e) {
                // Scene may not be available
            }
        }
    }
    
    createHitParticles() {
        const reduced = localStorage.getItem('reducedEffects') === 'true';
        const particleCount = reduced ? 2 : 4;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0xff4444);
            particle.fillCircle(0, 0, 3);
            particle.x = this.container.x + Phaser.Math.Between(-10, 10);
            particle.y = this.container.y + Phaser.Math.Between(-10, 10);
            particle.setDepth(95);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-20, 20),
                y: particle.y - Phaser.Math.Between(10, 30),
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    die() {
        this.active = false;
        
        // Drop pickups
        this.scene.spawnPickup(this.container.x, this.container.y, 'xp', this.xpValue);
        
        if (Math.random() < 0.3) {
            this.scene.spawnPickup(this.container.x, this.container.y, 'essence', this.essenceValue);
        }
        
        // Explosive kills
        const stats = this.scene.upgradeManager?.stats || {};
        if (stats.explosiveKillDamage > 0) {
            this.createExplosion(stats.explosiveKillDamage);
        }
        
        // Death effect
        this.createDeathEffect();
        
        // Destroy
        this.container.destroy();
    }
    
    createDeathEffect() {
        const reduced = localStorage.getItem('reducedEffects') === 'true';
        
        // Death flash
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.8);
        flash.fillCircle(0, 0, 20);
        flash.x = this.container.x;
        flash.y = this.container.y;
        flash.setDepth(95);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: reduced ? 1.5 : 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }
    
    createExplosion(damage) {
        const explosionRadius = 60;
        
        // Visual
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0xff8800, 0.6);
        explosion.fillCircle(0, 0, explosionRadius);
        explosion.x = this.container.x;
        explosion.y = this.container.y;
        explosion.setDepth(94);
        
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.3,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Damage nearby enemies
        for (const enemy of this.scene.enemies.getChildren()) {
            if (enemy === this || !enemy.active) continue;
            
            const dist = Phaser.Math.Distance.Between(
                this.container.x, this.container.y,
                enemy.container.x, enemy.container.y
            );
            
            if (dist < explosionRadius) {
                enemy.takeDamage(damage, null, false);
            }
        }
    }
    
    destroy() {
        this.active = false;
        if (this.container) {
            this.container.destroy();
        }
    }
}

// ===================================
// ENEMY TYPES
// ===================================

class ChaserEnemy extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1) {
        super(scene, x, y, 'chaser');
        
        this.hp = Math.round(25 * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = 120;
        this.damage = Math.round(8 * waveMultiplier);
        this.xpValue = 2; // Reduced from 8
        
        this.createVisuals();
        this.body.setCircle(12, -12, -12);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 16, 22, 8);
        
        // Body (red enemy)
        g.fillStyle(0xcc3333);
        g.fillRoundedRect(-10, -6, 20, 24, 5);
        
        // Highlight
        g.fillStyle(0xff4444, 0.5);
        g.fillRoundedRect(-7, -4, 8, 20, 3);
        
        // Head
        g.fillStyle(0xaa2222);
        g.fillCircle(0, -10, 9);
        
        // Eyes (angry)
        g.fillStyle(0xffff00);
        g.fillRect(-6, -12, 4, 3);
        g.fillRect(2, -12, 4, 3);
        
        // Claws
        g.fillStyle(0xff6666);
        g.fillTriangle(-12, 4, -8, 0, -8, 8);
        g.fillTriangle(12, 4, 8, 0, 8, 8);
        
        this.container.add(g);
        this.graphics = g;
    }
    
    update(time, delta, player) {
        super.update(time, delta, player);
        if (!this.active || this.isFrozen) return;
        
        // Move toward player
        const angle = Math.atan2(
            player.container.y - this.container.y,
            player.container.x - this.container.x
        );
        
        this.body.setVelocity(
            Math.cos(angle) * this.speed + this.knockbackVelocity.x,
            Math.sin(angle) * this.speed + this.knockbackVelocity.y
        );
    }
}

class ShooterEnemy extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1) {
        super(scene, x, y, 'shooter');
        
        this.hp = Math.round(35 * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = 50;
        this.damage = Math.round(12 * waveMultiplier);
        this.xpValue = 4; // Reduced from 12
        this.shootCooldown = 2000;
        this.lastShootTime = 0;
        this.preferredDistance = 150;
        
        this.createVisuals();
        this.body.setCircle(14, -14, -14);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 18, 26, 9);
        
        // Body (purple enemy)
        g.fillStyle(0x6644aa);
        g.fillRoundedRect(-12, -6, 24, 28, 6);
        
        // Highlight
        g.fillStyle(0x8866cc, 0.5);
        g.fillRoundedRect(-9, -4, 10, 24, 4);
        
        // Head
        g.fillStyle(0x553399);
        g.fillCircle(0, -12, 10);
        
        // Single eye
        g.fillStyle(0xff00ff);
        g.fillCircle(0, -12, 5);
        g.fillStyle(0xffffff);
        g.fillCircle(-1, -13, 2);
        
        // Weapon
        g.fillStyle(0x8844cc);
        g.fillRect(10, -4, 8, 12);
        g.fillStyle(0xff00ff);
        g.fillCircle(16, 2, 3);
        
        this.container.add(g);
        this.graphics = g;
    }
    
    update(time, delta, player) {
        super.update(time, delta, player);
        if (!this.active || this.isFrozen) return;
        
        const distToPlayer = Phaser.Math.Distance.Between(
            this.container.x, this.container.y,
            player.container.x, player.container.y
        );
        
        const angle = Math.atan2(
            player.container.y - this.container.y,
            player.container.x - this.container.x
        );
        
        // Keep distance
        let moveDir = 0;
        if (distToPlayer < this.preferredDistance - 30) {
            moveDir = -1; // Back away
        } else if (distToPlayer > this.preferredDistance + 30) {
            moveDir = 1; // Get closer
        }
        
        this.body.setVelocity(
            Math.cos(angle) * this.speed * moveDir + this.knockbackVelocity.x,
            Math.sin(angle) * this.speed * moveDir + this.knockbackVelocity.y
        );
        
        // Shoot
        if (time - this.lastShootTime >= this.shootCooldown && distToPlayer < 250) {
            this.shoot(angle);
            this.lastShootTime = time;
        }
    }
    
    shoot(angle) {
        // Telegraph
        const telegraph = this.scene.add.graphics();
        telegraph.lineStyle(2, 0xff00ff, 0.5);
        telegraph.lineBetween(0, 0, Math.cos(angle) * 200, Math.sin(angle) * 200);
        telegraph.x = this.container.x;
        telegraph.y = this.container.y;
        telegraph.setDepth(85);
        
        this.scene.tweens.add({
            targets: telegraph,
            alpha: 0,
            duration: 300,
            onComplete: () => telegraph.destroy()
        });
        
        // Fire after telegraph
        this.scene.time.delayedCall(300, () => {
            if (!this.active) return;
            this.scene.createEnemyProjectile(
                this.container.x + Math.cos(angle) * 16,
                this.container.y + Math.sin(angle) * 16,
                angle,
                this.damage,
                180
            );
        });
    }
}

class TankEnemy extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1) {
        super(scene, x, y, 'tank');
        
        this.hp = Math.round(100 * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = 40;
        this.damage = Math.round(20 * waveMultiplier);
        this.xpValue = 8; // Reduced from 25
        this.essenceValue = 3;
        
        this.createVisuals();
        this.body.setCircle(18, -18, -18);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 24, 34, 12);
        
        // Body (green tank)
        g.fillStyle(0x448844);
        g.fillRoundedRect(-16, -10, 32, 38, 8);
        
        // Armor plates
        g.fillStyle(0x336633);
        g.fillRect(-14, -8, 28, 8);
        g.fillRect(-14, 10, 28, 8);
        
        // Highlight
        g.fillStyle(0x66aa66, 0.4);
        g.fillRoundedRect(-12, -6, 12, 32, 4);
        
        // Head
        g.fillStyle(0x335533);
        g.fillCircle(0, -16, 12);
        
        // Visor
        g.fillStyle(0x88ff88);
        g.fillRoundedRect(-8, -20, 16, 6, 2);
        
        // Spikes
        g.fillStyle(0x557755);
        g.fillTriangle(-20, 0, -14, -6, -14, 6);
        g.fillTriangle(20, 0, 14, -6, 14, 6);
        
        this.container.add(g);
        this.graphics = g;
    }
    
    update(time, delta, player) {
        super.update(time, delta, player);
        if (!this.active || this.isFrozen) return;
        
        // Slow chase
        const angle = Math.atan2(
            player.container.y - this.container.y,
            player.container.x - this.container.x
        );
        
        this.body.setVelocity(
            Math.cos(angle) * this.speed + this.knockbackVelocity.x * 0.5,
            Math.sin(angle) * this.speed + this.knockbackVelocity.y * 0.5
        );
    }
}

class SplitterEnemy extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1, isMini = false) {
        super(scene, x, y, 'splitter');
        
        this.isMini = isMini;
        this.waveMultiplier = waveMultiplier;
        
        if (isMini) {
            this.hp = Math.round(15 * waveMultiplier);
            this.maxHp = this.hp;
            this.speed = 100;
            this.damage = Math.round(5 * waveMultiplier);
            this.xpValue = 1; // Reduced from 4
        } else {
            this.hp = Math.round(45 * waveMultiplier);
            this.maxHp = this.hp;
            this.speed = 70;
            this.damage = Math.round(10 * waveMultiplier);
            this.xpValue = 5; // Reduced from 15
        }
        
        this.createVisuals();
        this.body.setCircle(isMini ? 8 : 14, isMini ? -8 : -14, isMini ? -8 : -14);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        const scale = this.isMini ? 0.6 : 1;
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 18 * scale, 24 * scale, 8 * scale);
        
        // Body (orange slime)
        g.fillStyle(0xdd8800);
        g.fillCircle(0, 4 * scale, 14 * scale);
        
        // Blob details
        g.fillStyle(0xffaa00, 0.6);
        g.fillCircle(-4 * scale, 0, 6 * scale);
        
        // Eyes
        g.fillStyle(0xffffff);
        g.fillCircle(-4 * scale, -2 * scale, 4 * scale);
        g.fillCircle(4 * scale, -2 * scale, 4 * scale);
        g.fillStyle(0x000000);
        g.fillCircle(-4 * scale, -2 * scale, 2 * scale);
        g.fillCircle(4 * scale, -2 * scale, 2 * scale);
        
        this.container.add(g);
        this.graphics = g;
    }
    
    die() {
        // Spawn mini splitters if not already mini
        if (!this.isMini) {
            for (let i = 0; i < 2; i++) {
                const offsetX = (i === 0 ? -20 : 20);
                const mini = new SplitterEnemy(
                    this.scene,
                    this.container.x + offsetX,
                    this.container.y,
                    this.waveMultiplier,
                    true
                );
                this.scene.enemies.add(mini.container);
                this.scene.enemyObjects.push(mini);
            }
        }
        
        super.die();
    }
}

class BomberEnemy extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1) {
        super(scene, x, y, 'bomber');
        
        this.hp = Math.round(20 * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = 130;
        this.damage = Math.round(25 * waveMultiplier);
        this.xpValue = 3; // Reduced from 10
        this.explodeRadius = 70;
        this.isExploding = false;
        
        this.createVisuals();
        this.body.setCircle(12, -12, -12);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(0, 16, 22, 8);
        
        // Body (yellow/orange bomb)
        g.fillStyle(0xddaa00);
        g.fillCircle(0, 2, 12);
        
        // Warning stripes
        g.fillStyle(0x000000);
        g.fillRect(-10, -2, 20, 3);
        g.fillRect(-10, 4, 20, 3);
        
        // Fuse
        g.fillStyle(0x884400);
        g.fillRect(-2, -14, 4, 10);
        
        // Spark
        g.fillStyle(0xff4400);
        g.fillCircle(0, -16, 4);
        
        // Eyes
        g.fillStyle(0xff0000);
        g.fillCircle(-4, 0, 3);
        g.fillCircle(4, 0, 3);
        
        this.container.add(g);
        this.graphics = g;
        
        // Warning ring (hidden initially)
        this.warningRing = this.scene.add.graphics();
        this.warningRing.lineStyle(3, 0xff0000, 0.5);
        this.warningRing.strokeCircle(0, 0, this.explodeRadius);
        this.warningRing.visible = false;
        this.container.add(this.warningRing);
    }
    
    update(time, delta, player) {
        super.update(time, delta, player);
        if (!this.active || this.isFrozen || this.isExploding) return;
        
        const distToPlayer = Phaser.Math.Distance.Between(
            this.container.x, this.container.y,
            player.container.x, player.container.y
        );
        
        // If close, start exploding
        if (distToPlayer < 40) {
            this.startExploding();
            return;
        }
        
        // Rush toward player
        const angle = Math.atan2(
            player.container.y - this.container.y,
            player.container.x - this.container.x
        );
        
        this.body.setVelocity(
            Math.cos(angle) * this.speed + this.knockbackVelocity.x,
            Math.sin(angle) * this.speed + this.knockbackVelocity.y
        );
    }
    
    startExploding() {
        this.isExploding = true;
        this.body.setVelocity(0, 0);
        this.warningRing.visible = true;
        
        // Flash and expand warning
        this.scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 150,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.explode();
            }
        });
        
        // Pulsing warning ring
        this.scene.tweens.add({
            targets: this.warningRing,
            alpha: 1,
            duration: 150,
            yoyo: true,
            repeat: 3
        });
    }
    
    explode() {
        const player = this.scene.player;
        const distToPlayer = Phaser.Math.Distance.Between(
            this.container.x, this.container.y,
            player.container.x, player.container.y
        );
        
        // Damage player if in range
        if (distToPlayer < this.explodeRadius) {
            player.takeDamage(this.damage, this);
        }
        
        // Explosion visual
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0xff8800, 0.7);
        explosion.fillCircle(0, 0, this.explodeRadius);
        explosion.x = this.container.x;
        explosion.y = this.container.y;
        explosion.setDepth(94);
        
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.2,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Screen shake
        const reduced = localStorage.getItem('reducedEffects') === 'true';
        if (!reduced) {
            this.scene.cameras.main.shake(150, 0.015);
        }
        
        // Play explosion sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playExplosion();
        }
        
        // Die without normal death effect
        this.active = false;
        this.scene.spawnPickup(this.container.x, this.container.y, 'xp', this.xpValue);
        this.container.destroy();
    }
    
    die() {
        // Bomber explodes on death too
        if (!this.isExploding) {
            this.startExploding();
        }
    }
}

// ===================================
// BOSS CLASS
// ===================================

class BruteBoSS extends Enemy {
    constructor(scene, x, y, waveMultiplier = 1) {
        super(scene, x, y, 'boss');
        
        this.hp = Math.round(500 * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = 60;
        this.damage = Math.round(30 * waveMultiplier);
        this.xpValue = 50; // Reduced from 200
        this.essenceValue = 20;
        
        // Boss abilities
        this.slamCooldown = 4000;
        this.lastSlamTime = 0;
        this.projectileRingCooldown = 6000;
        this.lastProjectileRingTime = 0;
        this.slamRadius = 100;
        
        this.createVisuals();
        this.body.setCircle(28, -28, -28);
    }
    
    createVisuals() {
        const g = this.scene.add.graphics();
        
        // Shadow
        g.fillStyle(0x000000, 0.4);
        g.fillEllipse(0, 35, 50, 18);
        
        // Body (big red brute)
        g.fillStyle(0x992222);
        g.fillRoundedRect(-24, -15, 48, 55, 10);
        
        // Armor
        g.fillStyle(0x661111);
        g.fillRect(-22, -10, 44, 12);
        g.fillRect(-22, 15, 44, 12);
        
        // Highlight
        g.fillStyle(0xcc4444, 0.4);
        g.fillRoundedRect(-18, -10, 16, 45, 5);
        
        // Head
        g.fillStyle(0x771111);
        g.fillCircle(0, -24, 18);
        
        // Horns
        g.fillStyle(0x553333);
        g.fillTriangle(-20, -30, -12, -22, -8, -38);
        g.fillTriangle(20, -30, 12, -22, 8, -38);
        
        // Eyes (glowing)
        g.fillStyle(0xff0000);
        g.fillCircle(-6, -26, 5);
        g.fillCircle(6, -26, 5);
        g.fillStyle(0xffff00);
        g.fillCircle(-6, -26, 2);
        g.fillCircle(6, -26, 2);
        
        // Arms
        g.fillStyle(0x882222);
        g.fillRoundedRect(-34, -5, 12, 30, 4);
        g.fillRoundedRect(22, -5, 12, 30, 4);
        
        // Fists
        g.fillStyle(0x771111);
        g.fillCircle(-28, 28, 10);
        g.fillCircle(28, 28, 10);
        
        this.container.add(g);
        this.graphics = g;
        
        // HP bar background
        this.hpBarBg = this.scene.add.graphics();
        this.hpBarBg.fillStyle(0x000000, 0.7);
        this.hpBarBg.fillRect(-30, -50, 60, 8);
        this.container.add(this.hpBarBg);
        
        // HP bar
        this.hpBar = this.scene.add.graphics();
        this.updateHpBar();
        this.container.add(this.hpBar);
    }
    
    updateHpBar() {
        this.hpBar.clear();
        const percent = this.hp / this.maxHp;
        const color = percent > 0.5 ? 0x44ff44 : percent > 0.25 ? 0xffff44 : 0xff4444;
        this.hpBar.fillStyle(color);
        this.hpBar.fillRect(-28, -48, 56 * percent, 4);
    }
    
    update(time, delta, player) {
        super.update(time, delta, player);
        if (!this.active || this.isFrozen) return;
        
        const distToPlayer = Phaser.Math.Distance.Between(
            this.container.x, this.container.y,
            player.container.x, player.container.y
        );
        
        // Slam attack when close
        if (distToPlayer < this.slamRadius + 20 && time - this.lastSlamTime >= this.slamCooldown) {
            this.slamAttack(player);
            this.lastSlamTime = time;
        }
        
        // Projectile ring periodically
        if (time - this.lastProjectileRingTime >= this.projectileRingCooldown) {
            this.projectileRing();
            this.lastProjectileRingTime = time;
        }
        
        // Chase player
        const angle = Math.atan2(
            player.container.y - this.container.y,
            player.container.x - this.container.x
        );
        
        this.body.setVelocity(
            Math.cos(angle) * this.speed + this.knockbackVelocity.x * 0.3,
            Math.sin(angle) * this.speed + this.knockbackVelocity.y * 0.3
        );
        
        this.updateHpBar();
    }
    
    slamAttack(player) {
        // Stop movement briefly
        this.body.setVelocity(0, 0);
        
        // Telegraph
        const telegraph = this.scene.add.graphics();
        telegraph.fillStyle(0xff0000, 0.3);
        telegraph.fillCircle(0, 0, this.slamRadius);
        telegraph.x = this.container.x;
        telegraph.y = this.container.y;
        telegraph.setDepth(85);
        
        this.scene.tweens.add({
            targets: telegraph,
            alpha: 0.6,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            onComplete: () => {
                telegraph.destroy();
                
                if (!this.active) return;
                
                // Actual slam damage
                const distToPlayer = Phaser.Math.Distance.Between(
                    this.container.x, this.container.y,
                    player.container.x, player.container.y
                );
                
                if (distToPlayer < this.slamRadius) {
                    player.takeDamage(this.damage, this);
                }
                
                // Slam visual
                const slam = this.scene.add.graphics();
                slam.fillStyle(0xff4400, 0.6);
                slam.fillCircle(0, 0, this.slamRadius);
                slam.x = this.container.x;
                slam.y = this.container.y;
                slam.setDepth(84);
                
                this.scene.tweens.add({
                    targets: slam,
                    alpha: 0,
                    scale: 1.3,
                    duration: 300,
                    onComplete: () => slam.destroy()
                });
                
                // Screen shake
                const reduced = localStorage.getItem('reducedEffects') === 'true';
                if (!reduced) {
                    this.scene.cameras.main.shake(200, 0.02);
                }
                
                // Sound
                if (this.scene.audioManager) {
                    this.scene.audioManager.playExplosion();
                }
            }
        });
    }
    
    projectileRing() {
        const projectileCount = 12;
        
        for (let i = 0; i < projectileCount; i++) {
            const angle = (i / projectileCount) * Math.PI * 2;
            
            this.scene.time.delayedCall(50 * i, () => {
                if (!this.active) return;
                this.scene.createEnemyProjectile(
                    this.container.x + Math.cos(angle) * 30,
                    this.container.y + Math.sin(angle) * 30,
                    angle,
                    this.damage * 0.5,
                    150
                );
            });
        }
    }
    
    takeDamage(amount, sourceAngle, isCrit) {
        const died = super.takeDamage(amount, sourceAngle, isCrit);
        this.updateHpBar();
        return died;
    }
}

// ===================================
// PROJECTILE CLASS
// ===================================

class Projectile {
    constructor(scene, x, y, angle, speed, damage, isEnemy, options = {}) {
        this.scene = scene;
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.angle = angle;
        this.speed = speed;
        this.pierceCount = options.pierceCount || 0;
        this.bounceCount = options.bounceCount || 0;
        this.chainLightning = options.chainLightning || 0;
        this.isCrit = options.isCrit || false;
        this.hitEnemies = new Set();
        this.sizeMultiplier = options.sizeMultiplier || 1;
        this.active = true;
        
        // Store velocity for manual movement
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Create visual
        this.graphics = scene.add.graphics();
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.setDepth(80);
        
        var size = isEnemy ? 6 : (5 * this.sizeMultiplier);
        
        if (isEnemy) {
            // Enemy projectile (purple/pink)
            this.graphics.fillStyle(0xff00ff);
            this.graphics.fillCircle(0, 0, 6);
            this.graphics.fillStyle(0xffffff, 0.8);
            this.graphics.fillCircle(0, 0, 3);
        } else {
            // Player projectile (cyan)
            this.graphics.fillStyle(this.isCrit ? 0xffff00 : 0x00ffff);
            this.graphics.fillCircle(0, 0, size);
            this.graphics.fillStyle(0xffffff, 0.8);
            this.graphics.fillCircle(0, 0, size * 0.5);
        }
        
        // Physics - add to graphics with proper offset for circle
        scene.physics.add.existing(this.graphics);
        this.body = this.graphics.body;
        // Set circular body with offset so it's centered on the drawn circle
        this.body.setCircle(size, -size, -size);
        
        // Set velocity on physics body
        this.body.setVelocity(this.vx, this.vy);
        
        // Destroy after time (2 seconds lifespan)
        this.destroyTimer = scene.time.delayedCall(2000, () => this.destroy());
    }
    
    update(delta) {
        if (!this.active || !this.graphics) return;
        
        // Safeguard: ensure body velocity is maintained (physics should handle this)
        // But also manually update position as fallback for Graphics objects
        if (this.body) {
            // Re-apply velocity if it got reset (shouldn't happen but safeguard)
            if (Math.abs(this.body.velocity.x) < 1 && Math.abs(this.body.velocity.y) < 1) {
                this.body.setVelocity(this.vx, this.vy);
            }
        }
        
        // Check if out of bounds
        var gx = this.graphics.x || 0;
        var gy = this.graphics.y || 0;
        var arenaW = this.scene.arenaWidth || 800;
        var arenaH = this.scene.arenaHeight || 600;
        
        if (gx < -50 || gx > arenaW + 50 || gy < -50 || gy > arenaH + 50) {
            this.destroy();
        }
    }
    
    onHit(target) {
        if (this.hitEnemies.has(target)) return false;
        this.hitEnemies.add(target);
        
        // Chain lightning
        if (this.chainLightning > 0 && !this.isEnemy) {
            this.doChainLightning(target);
        }
        
        // Pierce
        if (this.pierceCount > 0) {
            this.pierceCount--;
            return false; // Don't destroy
        }
        
        // Bounce
        if (this.bounceCount > 0) {
            this.bounceCount--;
            this.bounceToNext(target);
            return false;
        }
        
        return true; // Destroy
    }
    
    doChainLightning(source) {
        const enemies = this.scene.enemyObjects.filter(e => 
            e.active && !this.hitEnemies.has(e)
        );
        
        // Sort by distance
        enemies.sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(
                source.container.x, source.container.y,
                a.container.x, a.container.y
            );
            const distB = Phaser.Math.Distance.Between(
                source.container.x, source.container.y,
                b.container.x, b.container.y
            );
            return distA - distB;
        });
        
        // Chain to nearby enemies
        const chainTargets = enemies.slice(0, this.chainLightning);
        
        for (const target of chainTargets) {
            const dist = Phaser.Math.Distance.Between(
                source.container.x, source.container.y,
                target.container.x, target.container.y
            );
            
            if (dist < 150) {
                // Visual chain
                const chain = this.scene.add.graphics();
                chain.lineStyle(2, 0x00ffff, 0.8);
                chain.lineBetween(
                    source.container.x, source.container.y,
                    target.container.x, target.container.y
                );
                chain.setDepth(79);
                
                this.scene.tweens.add({
                    targets: chain,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => chain.destroy()
                });
                
                // Deal damage
                target.takeDamage(this.damage * 0.5, null, false);
                this.hitEnemies.add(target);
            }
        }
    }
    
    bounceToNext(source) {
        const enemies = this.scene.enemyObjects.filter(e => 
            e.active && !this.hitEnemies.has(e)
        );
        
        if (enemies.length === 0) {
            this.destroy();
            return;
        }
        
        // Find closest enemy
        let closest = null;
        let closestDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                enemy.container.x, enemy.container.y
            );
            if (dist < closestDist && dist < 200) {
                closest = enemy;
                closestDist = dist;
            }
        }
        
        if (closest) {
            const angle = Math.atan2(
                closest.container.y - this.graphics.y,
                closest.container.x - this.graphics.x
            );
            this.body.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        } else {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.destroyTimer) {
            this.destroyTimer.remove();
        }
        if (this.graphics) {
            this.graphics.destroy();
        }
    }
}

// ===================================
// PICKUP CLASS
// ===================================

class Pickup {
    constructor(scene, x, y, type, value) {
        this.scene = scene;
        this.type = type;
        this.value = value;
        this.collected = false;
        
        // Create visual
        this.graphics = scene.add.graphics();
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.setDepth(70);
        
        if (type === 'xp') {
            // XP orb (green)
            this.graphics.fillStyle(0x44ff44);
            this.graphics.fillCircle(0, 0, 6);
            this.graphics.fillStyle(0xaaffaa, 0.8);
            this.graphics.fillCircle(-1, -1, 3);
        } else if (type === 'essence') {
            // Essence coin (gold)
            this.graphics.fillStyle(0xffdd00);
            this.graphics.fillCircle(0, 0, 8);
            this.graphics.fillStyle(0xffffaa, 0.8);
            this.graphics.fillCircle(-2, -2, 4);
            this.graphics.lineStyle(2, 0xaa8800);
            this.graphics.strokeCircle(0, 0, 8);
        }
        
        // Floating animation
        this.scene.tweens.add({
            targets: this.graphics,
            y: y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Physics
        scene.physics.add.existing(this.graphics);
        this.body = this.graphics.body;
        this.body.setCircle(type === 'essence' ? 8 : 6);
    }
    
    update(player, magnetRange) {
        if (this.collected) return;
        
        const dist = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            player.container.x, player.container.y
        );
        
        // Magnet pull
        if (dist < magnetRange) {
            const angle = Math.atan2(
                player.container.y - this.graphics.y,
                player.container.x - this.graphics.x
            );
            const pullSpeed = 300 * (1 - dist / magnetRange);
            this.body.setVelocity(
                Math.cos(angle) * pullSpeed,
                Math.sin(angle) * pullSpeed
            );
        }
        
        // Collect
        if (dist < 20) {
            this.collect(player);
        }
    }
    
    collect(player) {
        this.collected = true;
        
        // Play pickup sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playPickup();
        }
        
        // Effect
        const pop = this.scene.add.graphics();
        pop.fillStyle(this.type === 'xp' ? 0x44ff44 : 0xffdd00, 0.6);
        pop.fillCircle(0, 0, 10);
        pop.x = this.graphics.x;
        pop.y = this.graphics.y;
        pop.setDepth(71);
        
        this.scene.tweens.add({
            targets: pop,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => pop.destroy()
        });
        
        this.graphics.destroy();
        
        return {
            type: this.type,
            value: this.value
        };
    }
    
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
    }
}

// Export classes
window.Player = Player;
window.Enemy = Enemy;
window.ChaserEnemy = ChaserEnemy;
window.ShooterEnemy = ShooterEnemy;
window.TankEnemy = TankEnemy;
window.SplitterEnemy = SplitterEnemy;
window.BomberEnemy = BomberEnemy;
window.BruteBoss = BruteBoSS;
window.Projectile = Projectile;
window.Pickup = Pickup;
