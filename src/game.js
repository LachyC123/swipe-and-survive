/**
 * ===================================
 * SWIPE & SURVIVE - Game Scenes
 * ===================================
 * 
 * Contains MenuScene, GameScene, and related logic.
 */

console.log('game.js loading...');

// ===================================
// AUDIO MANAGER
// ===================================

class AudioManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.audioContext = null;
        this.initContext();
    }
    
    initContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('WebAudio not supported');
        }
    }
    
    ensureContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setEnabled(value) {
        this.enabled = value;
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        this.ensureContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playDash() {
        this.playTone(200, 0.15, 'sine', 0.2);
        setTimeout(() => this.playTone(400, 0.1, 'sine', 0.15), 50);
    }
    
    playShoot() {
        this.playTone(800, 0.08, 'square', 0.1);
    }
    
    playHit() {
        this.playTone(150, 0.1, 'square', 0.15);
    }
    
    playPickup() {
        this.playTone(600, 0.08, 'sine', 0.15);
        setTimeout(() => this.playTone(900, 0.08, 'sine', 0.1), 50);
    }
    
    playLevelUp() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.2), 200);
    }
    
    playExplosion() {
        this.playTone(100, 0.3, 'sawtooth', 0.25);
        this.playTone(80, 0.4, 'square', 0.15);
    }
    
    playWaveComplete() {
        this.playTone(500, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(1000, 0.2, 'sine', 0.2), 200);
    }
}

// ===================================
// MENU SCENE
// ===================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        console.log('MenuScene constructor called');
    }
    
    create() {
        console.log('MenuScene.create() called');
        
        // Hide loading screen immediately
        var loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            console.log('Loading screen hidden');
        }
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.createBackground();
        
        // Title
        const title = this.add.text(width / 2, height * 0.25, 'SWIPE &\nSURVIVE', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '48px',
            fontWeight: '800',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        // Title glow animation
        this.tweens.add({
            targets: title,
            alpha: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Subtitle
        this.add.text(width / 2, height * 0.42, 'A MOBILE ROGUELITE', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            color: '#00ffff',
            letterSpacing: 4
        }).setOrigin(0.5);
        
        // Play button
        const playBtn = this.createPlayButton(width / 2, height * 0.6);
        
        // How to play
        this.add.text(width / 2, height * 0.78, 'HOW TO PLAY:', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#888888'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height * 0.84, '• Swipe anywhere to DASH\n• Auto-attack nearest enemy\n• Survive waves & get upgrades!', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#666666',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);
        
        // Version
        this.add.text(width / 2, height - 20, 'v1.0.0', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#444444'
        }).setOrigin(0.5);
        
        // Initialize audio on first interaction
        this.input.once('pointerdown', () => {
            if (window.gameAudioManager) {
                window.gameAudioManager.ensureContext();
            }
        });
    }
    
    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x1a1a3a);
        bg.fillRect(0, 0, width, height);
        
        // Animated particles (stars)
        const reduced = localStorage.getItem('reducedEffects') === 'true';
        const particleCount = reduced ? 15 : 30;
        
        for (let i = 0; i < particleCount; i++) {
            const star = this.add.graphics();
            star.fillStyle(0x00ffff, Math.random() * 0.5 + 0.2);
            star.fillCircle(0, 0, Math.random() * 2 + 1);
            star.x = Math.random() * width;
            star.y = Math.random() * height;
            
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
            
            this.tweens.add({
                targets: star,
                y: star.y + 50,
                duration: 5000 + Math.random() * 5000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    createPlayButton(x, y) {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0x00aaaa);
        bg.fillRoundedRect(-80, -30, 160, 60, 15);
        bg.lineStyle(3, 0x00ffff);
        bg.strokeRoundedRect(-80, -30, 160, 60, 15);
        container.add(bg);
        
        // Glow effect
        const glow = this.add.graphics();
        glow.fillStyle(0x00ffff, 0.3);
        glow.fillRoundedRect(-85, -35, 170, 70, 18);
        container.addAt(glow, 0);
        
        // Pulse animation
        this.tweens.add({
            targets: glow,
            alpha: 0.1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Text
        const text = this.add.text(0, 0, 'PLAY', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(text);
        
        // Make interactive
        container.setSize(160, 60);
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            })
            .on('pointerdown', () => {
                this.startGame();
            });
        
        return container;
    }
    
    startGame() {
        // Transition effect
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        this.time.delayedCall(300, () => {
            this.scene.start('GameScene');
        });
    }
}

// ===================================
// GAME SCENE
// ===================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init() {
        // Game state
        this.wave = 0;
        this.waveTimer = 0;
        this.waveDuration = 25; // seconds
        this.essence = 0;
        this.kills = 0;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.level = 1;
        this.isPaused = false;
        this.isIntermission = false;
        this.gameOver = false;
        
        // XP Currency - single source of truth for upgrade purchases
        this.xpCurrency = 0;
        
        // Spawn tracking
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
        
        // Arena size
        this.arenaWidth = 800;
        this.arenaHeight = 600;
    }
    
    create() {
        // Setup camera and world
        this.cameras.main.fadeIn(300);
        this.cameras.main.setBackgroundColor(0x0a0a1a);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
        
        // Audio manager
        this.audioManager = window.gameAudioManager || new AudioManager();
        window.gameAudioManager = this.audioManager;
        
        // Upgrade manager
        this.upgradeManager = new UpgradeManager();
        
        // Create arena
        this.createArena();
        
        // Create groups
        this.enemies = this.physics.add.group();
        this.enemyObjects = [];
        this.playerProjectiles = this.physics.add.group();
        this.playerProjectileObjects = [];
        this.enemyProjectiles = this.physics.add.group();
        this.enemyProjectileObjects = [];
        this.pickups = this.physics.add.group();
        this.pickupObjects = [];
        this.dashTrails = this.physics.add.group();
        
        // Create player at center
        this.player = new Player(this, this.arenaWidth / 2, this.arenaHeight / 2);
        
        // Setup camera to follow player
        this.cameras.main.startFollow(this.player.container, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
        this.cameras.main.setZoom(1);
        
        // Create UI
        this.hud = new GameHUD(this);
        this.upgradeUI = new UpgradeSelectionUI(this);
        this.pauseMenu = new PauseMenu(this);
        this.gameOverScreen = new GameOverScreen(this);
        
        // Setup input
        this.setupInput();
        
        // Setup collisions
        this.setupCollisions();
        
        // Debug HP text (top-left, always visible)
        this.debugHpText = this.add.text(10, 10, 'HP: 100/100 | XP: 0 | Invuln: false', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#00ff00',
            backgroundColor: '#000000cc',
            padding: { x: 5, y: 3 }
        }).setScrollFactor(0).setDepth(9999);
        
        // Active upgrades display (below HP)
        this.debugUpgradesText = this.add.text(10, 35, 'Upgrades: none', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#88ffff',
            backgroundColor: '#000000cc',
            padding: { x: 5, y: 2 }
        }).setScrollFactor(0).setDepth(9999);
        
        // Player damage invulnerability tracking
        this.playerInvulnTime = 0;
        this.playerInvulnDuration = 400; // ms of i-frames after taking damage
        
        // Start first wave
        this.startWave();
    }
    
    /**
     * Single source of truth for applying damage to player
     * @param {number} amount - Damage amount
     * @param {object} source - Optional source for knockback direction
     * @returns {boolean} - True if player died
     */
    applyPlayerDamage(amount, source) {
        if (!this.player) return false;
        
        // Check invulnerability
        var now = this.time.now;
        if (this.player.isInvulnerable || this.player.isDashing) {
            return false;
        }
        if (now < this.playerInvulnTime) {
            return false;
        }
        
        // Clamp damage to valid range
        amount = Math.max(0, amount || 0);
        if (amount <= 0) return false;
        
        // Get max HP from upgrades
        var stats = this.upgradeManager ? this.upgradeManager.stats : {};
        var maxHp = stats.maxHp || this.player.maxHp || 100;
        
        // Apply damage
        this.player.hp -= amount;
        
        // Clamp HP to 0
        if (this.player.hp < 0) this.player.hp = 0;
        
        // Set invulnerability window
        this.playerInvulnTime = now + this.playerInvulnDuration;
        this.player.isInvulnerable = true;
        
        // Reset invulnerability after duration
        var self = this;
        this.time.delayedCall(this.playerInvulnDuration, function() {
            if (self.player && !self.player.isDashing) {
                self.player.isInvulnerable = false;
            }
        });
        
        // Visual feedback - hit flash
        this.player.createHitFlash(0xff0000);
        
        // Knockback from source
        if (source && source.container && this.player.body) {
            var knockDir = Math.atan2(
                this.player.container.y - source.container.y,
                this.player.container.x - source.container.x
            );
            this.player.body.setVelocity(
                Math.cos(knockDir) * 150,
                Math.sin(knockDir) * 150
            );
        }
        
        // Screen shake
        var reduced = localStorage.getItem('reducedEffects') === 'true';
        if (!reduced) {
            this.cameras.main.shake(100, 0.01);
        }
        
        // Play hit sound
        if (this.audioManager) {
            this.audioManager.playHit();
        }
        
        // Update debug text immediately
        this.debugHpText.setText('HP: ' + Math.ceil(this.player.hp) + '/' + maxHp);
        
        // Check death
        if (this.player.hp <= 0) {
            return true;
        }
        
        return false;
    }
    
    createArena() {
        // Floor
        const floor = this.add.graphics();
        floor.setDepth(0);
        
        // Base floor color
        floor.fillStyle(0x12121e);
        floor.fillRect(0, 0, this.arenaWidth, this.arenaHeight);
        
        // Grid pattern
        floor.lineStyle(1, 0x1a1a2a, 0.5);
        const gridSize = 50;
        
        for (let x = 0; x <= this.arenaWidth; x += gridSize) {
            floor.lineBetween(x, 0, x, this.arenaHeight);
        }
        for (let y = 0; y <= this.arenaHeight; y += gridSize) {
            floor.lineBetween(0, y, this.arenaWidth, y);
        }
        
        // Arena border glow
        const border = this.add.graphics();
        border.setDepth(1);
        border.lineStyle(4, 0x00ffff, 0.3);
        border.strokeRect(2, 2, this.arenaWidth - 4, this.arenaHeight - 4);
        border.lineStyle(2, 0x00ffff, 0.6);
        border.strokeRect(5, 5, this.arenaWidth - 10, this.arenaHeight - 10);
        
        // Corner accents
        const cornerSize = 40;
        border.lineStyle(3, 0x00ffff, 0.8);
        // Top-left
        border.lineBetween(0, cornerSize, 0, 0);
        border.lineBetween(0, 0, cornerSize, 0);
        // Top-right
        border.lineBetween(this.arenaWidth - cornerSize, 0, this.arenaWidth, 0);
        border.lineBetween(this.arenaWidth, 0, this.arenaWidth, cornerSize);
        // Bottom-left
        border.lineBetween(0, this.arenaHeight - cornerSize, 0, this.arenaHeight);
        border.lineBetween(0, this.arenaHeight, cornerSize, this.arenaHeight);
        // Bottom-right
        border.lineBetween(this.arenaWidth - cornerSize, this.arenaHeight, this.arenaWidth, this.arenaHeight);
        border.lineBetween(this.arenaWidth, this.arenaHeight - cornerSize, this.arenaWidth, this.arenaHeight);
    }
    
    setupInput() {
        // Swipe detection
        this.swipeStart = null;
        this.swipeThreshold = 30;
        
        this.input.on('pointerdown', (pointer) => {
            if (this.isPaused || this.isIntermission || this.gameOver) return;
            
            this.swipeStart = { x: pointer.x, y: pointer.y, time: this.time.now };
            
            // Ensure audio context is active
            if (this.audioManager) {
                this.audioManager.ensureContext();
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (!this.swipeStart || this.isPaused || this.isIntermission || this.gameOver) return;
            
            const dx = pointer.x - this.swipeStart.x;
            const dy = pointer.y - this.swipeStart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const duration = this.time.now - this.swipeStart.time;
            
            // Valid swipe: enough distance, quick enough
            if (dist > this.swipeThreshold && duration < 500) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                this.player.dash(dirX, dirY);
            }
            
            this.swipeStart = null;
        });
        
        // Keyboard support for testing
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Debug mode toggle (press D key)
        this.debugMode = false;
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(5000);
        this.debugText = this.add.text(10, 100, '', {
            fontSize: '12px',
            color: '#00ff00',
            backgroundColor: '#000000'
        }).setScrollFactor(0).setDepth(5001).setVisible(false);
    }
    
    setupCollisions() {
        var self = this;
        
        // Player projectiles hit enemies
        this.physics.add.overlap(
            this.playerProjectiles,
            this.enemies,
            this.handlePlayerProjectileHit,
            null,
            this
        );
        
        // Enemy projectiles hit player - use callback to process manually
        // This ensures the overlap is detected even if argument order varies
        this.physics.add.overlap(
            this.enemyProjectiles,
            this.player.container,
            function(obj1, obj2) {
                // Determine which is the projectile
                var projGraphics = null;
                if (self.enemyProjectileObjects.find(function(p) { return p.graphics === obj1; })) {
                    projGraphics = obj1;
                } else if (self.enemyProjectileObjects.find(function(p) { return p.graphics === obj2; })) {
                    projGraphics = obj2;
                }
                if (projGraphics) {
                    self.handleEnemyProjectileHit.call(self, projGraphics, self.player.container);
                }
            },
            null,
            this
        );
        
        // Enemies touch player
        this.physics.add.overlap(
            this.enemies,
            this.player.container,
            this.handleEnemyPlayerCollision,
            null,
            this
        );
        
        // Dash trails hit enemies
        this.physics.add.overlap(
            this.dashTrails,
            this.enemies,
            this.handleDashTrailHit,
            null,
            this
        );
    }
    
    handlePlayerProjectileHit(projectileGraphics, enemyContainer) {
        // Safeguard: validate graphics object
        if (!projectileGraphics || !projectileGraphics.active) return;
        if (!enemyContainer || !enemyContainer.active) return;
        
        // Find the projectile object
        const projectile = this.playerProjectileObjects.find(p => p.graphics === projectileGraphics);
        if (!projectile || !projectile.graphics) return;
        
        // Find the enemy object
        const enemy = this.enemyObjects.find(e => e.container === enemyContainer);
        if (!enemy || !enemy.active) return;
        
        // Safeguard: validate positions exist
        if (!enemy.container || !projectile.graphics) return;
        
        // Apply damage with safeguarded angle calculation
        var enemyX = enemy.container.x || 0;
        var enemyY = enemy.container.y || 0;
        var projX = projectile.graphics.x || 0;
        var projY = projectile.graphics.y || 0;
        
        var angle = Math.atan2(enemyY - projY, enemyX - projX);
        // Safeguard against NaN
        if (!isFinite(angle)) angle = 0;
        
        const died = enemy.takeDamage(projectile.damage || 0, angle, projectile.isCrit);
        
        // Lifesteal with safeguards
        if (this.upgradeManager && this.upgradeManager.stats && this.player) {
            const stats = this.upgradeManager.stats;
            if (stats.lifestealPercent > 0 && projectile.damage > 0) {
                this.player.heal(projectile.damage * stats.lifestealPercent);
            }
        }
        
        if (died) {
            this.kills++;
            this.removeEnemy(enemy);
        }
        
        // Handle projectile pierce/bounce
        try {
            if (projectile.onHit && projectile.onHit(enemy)) {
                this.removePlayerProjectile(projectile);
            }
        } catch (e) {
            // Safeguard: remove projectile if error
            this.removePlayerProjectile(projectile);
        }
    }
    
    handleEnemyProjectileHit(projectileGraphics, playerContainer) {
        console.log('handleEnemyProjectileHit called');
        
        // Safeguard: validate objects
        if (!projectileGraphics || !projectileGraphics.active) {
            console.log('  Invalid projectile graphics');
            return;
        }
        if (!this.player) {
            console.log('  No player');
            return;
        }
        
        var projectile = this.enemyProjectileObjects.find(function(p) { return p.graphics === projectileGraphics; });
        if (!projectile) {
            console.log('  Projectile not found in objects array');
            return;
        }
        
        // Apply damage using centralized function
        var damage = projectile.damage || 10;
        console.log('  Applying damage:', damage, 'Player HP before:', this.player.hp);
        
        var died = this.applyPlayerDamage(damage, null);
        
        console.log('  Player HP after:', this.player.hp, 'died:', died);
        
        // Always despawn the bullet on hit
        this.removeEnemyProjectile(projectile);
        
        if (died && !this.gameOver) {
            this.handleGameOver();
        }
    }
    
    handleEnemyPlayerCollision(enemyContainer, playerContainer) {
        // Safeguard: validate objects
        if (!enemyContainer || !enemyContainer.active) return;
        if (!this.player) return;
        
        var enemy = this.enemyObjects.find(e => e.container === enemyContainer);
        if (!enemy || !enemy.active) return;
        
        // Contact damage - the applyPlayerDamage handles i-frames
        var damage = enemy.damage || 10;
        var died = this.applyPlayerDamage(damage, enemy);
        
        console.log('Enemy contact with player, damage:', damage, 'died:', died);
        
        if (died && !this.gameOver) {
            this.handleGameOver();
        }
    }
    
    handleDashTrailHit(trailZone, enemyContainer) {
        // Safeguard: validate objects
        if (!trailZone || !enemyContainer || !enemyContainer.active) return;
        
        const enemy = this.enemyObjects.find(e => e.container === enemyContainer);
        if (!enemy || !enemy.active) return;
        
        if (!enemy.trailHitCooldown) {
            enemy.takeDamage(trailZone.damage || 0, null, false);
            enemy.trailHitCooldown = true;
            
            this.time.delayedCall(200, () => {
                if (enemy.active) enemy.trailHitCooldown = false;
            });
        }
    }
    
    update(time, delta) {
        if (this.isPaused || this.gameOver) return;
        
        // Update player
        this.player.update(time, delta, this.upgradeManager.stats);
        
        // Keyboard movement (for testing)
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;
        
        if (vx !== 0 || vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            this.player.move(vx / len, vy / len);
        } else if (!this.player.isDashing) {
            this.player.move(0, 0);
        }
        
        // Space to dash in facing direction
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.player.dash(this.player.facing.x, this.player.facing.y);
        }
        
        // ESC to pause
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.showPauseMenu();
        }
        
        // Debug mode toggle (G key)
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.debugMode = !this.debugMode;
            this.debugText.setVisible(this.debugMode);
            console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
        }
        
        // Auto-attack nearest enemy
        this.handleAutoAttack();
        
        // Debug: draw targeting line and show projectile info
        if (this.debugMode) {
            this.updateDebugDisplay();
        } else if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
        
        // Update enemies
        for (const enemy of this.enemyObjects) {
            if (enemy.active) {
                enemy.update(time, delta, this.player);
            }
        }
        
        // Update projectiles
        for (const projectile of this.playerProjectileObjects) {
            projectile.update();
        }
        for (const projectile of this.enemyProjectileObjects) {
            projectile.update();
        }
        
        // Update pickups
        const magnetRange = this.upgradeManager.stats.magnetRange;
        for (const pickup of this.pickupObjects) {
            if (!pickup.collected) {
                pickup.update(this.player, magnetRange);
                
                // Check if collected
                if (pickup.collected) {
                    this.handlePickupCollected(pickup);
                }
            }
        }
        
        // Orbiting blades damage
        this.player.checkOrbitBladeDamage(this.enemies);
        
        // Clean up destroyed objects
        this.cleanupObjects();
        
        // Wave logic
        if (!this.isIntermission) {
            this.waveTimer -= delta / 1000;
            
            // Spawn enemies
            this.handleSpawning(time);
            
            // Check wave complete
            if (this.waveTimer <= 0) {
                this.completeWave();
            }
        }
        
        // Update HUD
        this.hud.update(
            this.player,
            this.wave,
            Math.max(0, this.waveTimer),
            this.essence,
            this.xp,
            this.level,
            this.xpToNextLevel,
            this.upgradeManager.stats,
            this.xpCurrency
        );
        
        // Update debug HP text every frame
        if (this.debugHpText && this.player) {
            var stats = this.upgradeManager ? this.upgradeManager.stats : {};
            var maxHp = stats.maxHp || this.player.maxHp || 100;
            var currentHp = Math.ceil(this.player.hp);
            var invuln = this.player.isInvulnerable || this.player.isDashing;
            this.debugHpText.setText('HP: ' + currentHp + '/' + maxHp + ' | XP: ' + this.xpCurrency + ' | Invuln: ' + invuln);
            // Color based on HP
            if (currentHp <= maxHp * 0.25) {
                this.debugHpText.setColor('#ff4444');
            } else if (currentHp <= maxHp * 0.5) {
                this.debugHpText.setColor('#ffff44');
            } else {
                this.debugHpText.setColor('#44ff44');
            }
        }
        
        // Update active upgrades display
        if (this.debugUpgradesText && this.upgradeManager) {
            var acquired = this.upgradeManager.getAcquiredList();
            if (acquired.length > 0) {
                var upgradeStr = acquired.map(function(u) { 
                    return u.icon + u.currentLevel; 
                }).join(' ');
                this.debugUpgradesText.setText('Upgrades: ' + upgradeStr);
            } else {
                this.debugUpgradesText.setText('Upgrades: none');
            }
        }
    }
    
    handleAutoAttack() {
        if (!this.player.canAttack() || this.enemyObjects.length === 0) return;
        
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of this.enemyObjects) {
            if (!enemy.active) continue;
            
            const dist = Phaser.Math.Distance.Between(
                this.player.container.x, this.player.container.y,
                enemy.container.x, enemy.container.y
            );
            
            if (dist < nearestDist && dist < 300) { // Attack range
                nearest = enemy;
                nearestDist = dist;
            }
        }
        
        if (nearest) {
            this.player.attack(nearest);
        }
    }
    
    updateDebugDisplay() {
        this.debugGraphics.clear();
        
        // Find nearest enemy and draw targeting line
        var nearest = null;
        var nearestDist = Infinity;
        
        for (var i = 0; i < this.enemyObjects.length; i++) {
            var enemy = this.enemyObjects[i];
            if (!enemy.active) continue;
            
            var dist = Phaser.Math.Distance.Between(
                this.player.container.x, this.player.container.y,
                enemy.container.x, enemy.container.y
            );
            
            if (dist < nearestDist && dist < 300) {
                nearest = enemy;
                nearestDist = dist;
            }
        }
        
        // Draw line to target
        if (nearest) {
            this.debugGraphics.lineStyle(2, 0x00ff00, 0.5);
            this.debugGraphics.lineBetween(
                this.player.container.x, this.player.container.y,
                nearest.container.x, nearest.container.y
            );
        }
        
        // Show projectile info
        var debugInfo = 'DEBUG MODE (G to toggle)\n';
        debugInfo += 'Projectiles: ' + this.playerProjectileObjects.length + '\n';
        
        if (this.playerProjectileObjects.length > 0) {
            var p = this.playerProjectileObjects[0];
            if (p && p.graphics && p.body) {
                debugInfo += 'P0 pos: ' + Math.round(p.graphics.x) + ',' + Math.round(p.graphics.y) + '\n';
                debugInfo += 'P0 vel: ' + Math.round(p.body.velocity.x) + ',' + Math.round(p.body.velocity.y) + '\n';
                debugInfo += 'P0 speed: ' + Math.round(Math.sqrt(p.body.velocity.x*p.body.velocity.x + p.body.velocity.y*p.body.velocity.y));
            }
        }
        
        debugInfo += '\nTarget dist: ' + (nearest ? Math.round(nearestDist) : 'none');
        debugInfo += '\nEnemies: ' + this.enemyObjects.filter(function(e) { return e.active; }).length;
        debugInfo += '\nEnemy bullets: ' + this.enemyProjectileObjects.length;
        debugInfo += '\nPlayer HP: ' + Math.round(this.player.hp);
        debugInfo += '\nInvuln: ' + (this.player.isInvulnerable || this.player.isDashing);
        
        this.debugText.setText(debugInfo);
    }
    
    handleSpawning(time) {
        if (time - this.lastSpawnTime < this.spawnInterval) return;
        this.lastSpawnTime = time;
        
        // Calculate spawn parameters based on wave
        const waveMultiplier = 1 + (this.wave - 1) * 0.15;
        const spawnCount = Math.min(1 + Math.floor(this.wave / 3), 4);
        
        for (let i = 0; i < spawnCount; i++) {
            this.spawnEnemy(waveMultiplier);
        }
        
        // Decrease spawn interval as wave progresses
        this.spawnInterval = Math.max(800, 2000 - this.wave * 100);
    }
    
    spawnEnemy(waveMultiplier) {
        // Choose spawn position (outside arena edges)
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        
        switch (side) {
            case 0: // Top
                x = Phaser.Math.Between(50, this.arenaWidth - 50);
                y = 30;
                break;
            case 1: // Right
                x = this.arenaWidth - 30;
                y = Phaser.Math.Between(50, this.arenaHeight - 50);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(50, this.arenaWidth - 50);
                y = this.arenaHeight - 30;
                break;
            case 3: // Left
                x = 30;
                y = Phaser.Math.Between(50, this.arenaHeight - 50);
                break;
        }
        
        // Choose enemy type based on wave
        const types = ['chaser'];
        if (this.wave >= 2) types.push('shooter');
        if (this.wave >= 3) types.push('tank');
        if (this.wave >= 4) types.push('splitter');
        if (this.wave >= 5) types.push('bomber');
        
        const type = types[Phaser.Math.Between(0, types.length - 1)];
        
        let enemy;
        switch (type) {
            case 'chaser':
                enemy = new ChaserEnemy(this, x, y, waveMultiplier);
                break;
            case 'shooter':
                enemy = new ShooterEnemy(this, x, y, waveMultiplier);
                break;
            case 'tank':
                enemy = new TankEnemy(this, x, y, waveMultiplier);
                break;
            case 'splitter':
                enemy = new SplitterEnemy(this, x, y, waveMultiplier, false);
                break;
            case 'bomber':
                enemy = new BomberEnemy(this, x, y, waveMultiplier);
                break;
        }
        
        this.enemies.add(enemy.container);
        this.enemyObjects.push(enemy);
    }
    
    spawnBoss() {
        const boss = new BruteBoss(
            this,
            this.arenaWidth / 2,
            100,
            1 + Math.floor(this.wave / 5) * 0.3
        );
        
        this.enemies.add(boss.container);
        this.enemyObjects.push(boss);
        
        // Boss announcement
        const announcement = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '⚠️ BOSS WAVE ⚠️',
            {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '32px',
                fontWeight: '800',
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
        
        this.tweens.add({
            targets: announcement,
            alpha: 0,
            scale: 1.5,
            duration: 2000,
            onComplete: () => announcement.destroy()
        });
    }
    
    createPlayerProjectile(x, y, angle, damage, isCrit, stats) {
        const projectile = new Projectile(
            this, x, y, angle, 400, damage, false, {
                pierceCount: stats.pierceCount || 0,
                bounceCount: stats.bounceCount || 0,
                chainLightning: stats.chainLightning || 0,
                isCrit: isCrit,
                sizeMultiplier: stats.projectileSizeMultiplier || 1
            }
        );
        
        this.playerProjectiles.add(projectile.graphics);
        this.playerProjectileObjects.push(projectile);
    }
    
    createEnemyProjectile(x, y, angle, damage, speed) {
        var projectile = new Projectile(this, x, y, angle, speed, damage, true);
        
        this.enemyProjectiles.add(projectile.graphics);
        this.enemyProjectileObjects.push(projectile);
        
        console.log('Enemy projectile created at', Math.round(x), Math.round(y), 'dmg:', damage, 'total:', this.enemyProjectileObjects.length);
    }
    
    createDamageNumber(x, y, amount, isCrit) {
        const color = isCrit ? '#ffff00' : '#ffffff';
        const size = isCrit ? '18px' : '14px';
        
        const text = this.add.text(x, y, Math.round(amount).toString(), {
            fontFamily: 'Rubik, sans-serif',
            fontSize: size,
            fontWeight: '700',
            color: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(200);
        
        this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => text.destroy()
        });
    }
    
    spawnPickup(x, y, type, value) {
        const pickup = new Pickup(this, x, y, type, value);
        this.pickups.add(pickup.graphics);
        this.pickupObjects.push(pickup);
    }
    
    handlePickupCollected(pickup) {
        if (pickup.type === 'xp') {
            var xpMult = this.upgradeManager.stats.xpGainMultiplier || 1;
            var xpGained = Math.round(pickup.value * xpMult);
            
            // Add to XP currency (for upgrades)
            this.xpCurrency += xpGained;
            
            // Also add to level XP
            this.xp += xpGained;
            
            // Level up check
            while (this.xp >= this.xpToNextLevel) {
                this.xp -= this.xpToNextLevel;
                this.level++;
                this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.2);
                
                // Level up effect
                if (this.audioManager) {
                    this.audioManager.playLevelUp();
                }
            }
        } else if (pickup.type === 'essence') {
            this.essence += pickup.value;
        }
    }
    
    removeEnemy(enemy) {
        const index = this.enemyObjects.indexOf(enemy);
        if (index > -1) {
            this.enemyObjects.splice(index, 1);
        }
    }
    
    removePlayerProjectile(projectile) {
        const index = this.playerProjectileObjects.indexOf(projectile);
        if (index > -1) {
            this.playerProjectileObjects.splice(index, 1);
            projectile.destroy();
        }
    }
    
    removeEnemyProjectile(projectile) {
        const index = this.enemyProjectileObjects.indexOf(projectile);
        if (index > -1) {
            this.enemyProjectileObjects.splice(index, 1);
            projectile.destroy();
        }
    }
    
    cleanupObjects() {
        // Clean up inactive enemies
        this.enemyObjects = this.enemyObjects.filter(e => e.active);
        
        // Clean up collected pickups
        this.pickupObjects = this.pickupObjects.filter(p => !p.collected);
        
        // Clean up destroyed projectiles
        this.playerProjectileObjects = this.playerProjectileObjects.filter(p => p.graphics && p.graphics.active);
        this.enemyProjectileObjects = this.enemyProjectileObjects.filter(p => p.graphics && p.graphics.active);
    }
    
    startWave() {
        this.wave++;
        this.waveTimer = this.waveDuration;
        this.spawnInterval = 2000;
        this.lastSpawnTime = 0;
        this.isIntermission = false;
        
        // Give starting XP on wave 1 so players can test upgrades
        if (this.wave === 1) {
            this.xpCurrency = 15; // Enough for 1 common upgrade
        }
        
        // Boss wave every 5 waves
        if (this.wave % 5 === 0) {
            this.waveDuration = 40; // Longer boss waves
            this.waveTimer = this.waveDuration;
            this.spawnBoss();
        } else {
            this.waveDuration = 25 + Math.min(this.wave, 10);
            this.waveTimer = this.waveDuration;
        }
        
        // Wave start announcement
        const waveText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            `WAVE ${this.wave}`,
            {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '36px',
                fontWeight: '800',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
        
        this.tweens.add({
            targets: waveText,
            alpha: 0,
            y: waveText.y - 30,
            duration: 1500,
            onComplete: () => waveText.destroy()
        });
    }
    
    completeWave() {
        this.isIntermission = true;
        
        // Kill remaining enemies
        for (const enemy of this.enemyObjects) {
            if (enemy.active) {
                enemy.die();
            }
        }
        this.enemyObjects = [];
        
        // Clear projectiles
        for (const projectile of this.enemyProjectileObjects) {
            projectile.destroy();
        }
        this.enemyProjectileObjects = [];
        
        // Heal on wave clear
        const healAmount = this.upgradeManager.stats.healOnWave || 0;
        if (healAmount > 0) {
            this.player.heal(healAmount);
        }
        
        // Play wave complete sound
        if (this.audioManager) {
            this.audioManager.playWaveComplete();
        }
        
        // Reset rerolls for this intermission
        this.upgradeManager.resetRerolls();
        
        // Show upgrade selection with XP currency system
        console.log('Showing upgrade selection UI, XP currency:', this.xpCurrency);
        var choices = this.upgradeManager.getRandomChoices(3);
        var self = this;
        
        // Pass scene reference for XP access
        this.upgradeUI.show(choices, this.upgradeManager, this, function(upgrade, cost) {
            console.log('Upgrade callback received:', upgrade ? upgrade.id : 'SKIP', 'cost:', cost);
            
            if (upgrade) {
                // Deduct XP cost
                self.xpCurrency -= cost;
                console.log('XP deducted:', cost, 'remaining:', self.xpCurrency);
                
                // Apply the upgrade
                self.upgradeManager.applyUpgrade(upgrade.id);
                console.log('Upgrade applied:', upgrade.id);
                
                // Update player max HP if needed
                var stats = self.upgradeManager.stats;
                if (stats.maxHp > self.player.maxHp) {
                    self.player.maxHp = stats.maxHp;
                }
            }
            
            // Resume gameplay - start next wave
            console.log('Starting next wave, isIntermission will be set to false');
            self.startWave();
        });
    }
    
    showPauseMenu() {
        this.isPaused = true;
        this.physics.pause();
        this.pauseMenu.show();
    }
    
    resumeGame() {
        this.isPaused = false;
        this.physics.resume();
    }
    
    quitRun() {
        this.scene.start('MenuScene');
    }
    
    handleGameOver() {
        this.gameOver = true;
        this.physics.pause();
        
        // Compile stats
        const stats = {
            wave: this.wave,
            kills: this.kills,
            essence: this.essence,
            level: this.level,
            upgradesCount: Object.keys(this.upgradeManager.acquired).length,
            upgrades: this.upgradeManager.getAcquiredList()
        };
        
        // Show game over screen after a brief delay
        this.time.delayedCall(500, () => {
            this.gameOverScreen.show(stats);
        });
    }
}

// Export scenes to window for Phaser config
window.AudioManager = AudioManager;
window.MenuScene = MenuScene;
window.GameScene = GameScene;

console.log('game.js loaded - MenuScene:', typeof MenuScene, 'GameScene:', typeof GameScene);
