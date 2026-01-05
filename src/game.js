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
// CHARACTER DEFINITIONS
// ===================================

var CHARACTER_DEFS = {
    starter: {
        id: 'starter',
        name: 'Recruit',
        icon: '🎮',
        description: 'Balanced starter character',
        costGems: 0,
        challenge: null, // Always unlocked
        stats: {
            maxHpMult: 1.0,
            moveSpeedMult: 1.0,
            damageMult: 1.0,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: null,
        perkDesc: 'No special abilities'
    },
    tank: {
        id: 'tank',
        name: 'Tank',
        icon: '🛡️',
        description: '+50% HP, -20% speed',
        costGems: 25,
        challenge: { id: 'survive_5_waves', desc: 'Survive 5 waves' },
        stats: {
            maxHpMult: 1.5,
            moveSpeedMult: 0.8,
            damageMult: 1.0,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'thorns',
        perkDesc: 'Reflects 10% damage to attackers'
    },
    glass_cannon: {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        icon: '💥',
        description: '+50% damage, -40% HP',
        costGems: 30,
        challenge: { id: 'kill_50', desc: 'Kill 50 enemies in one run' },
        stats: {
            maxHpMult: 0.6,
            moveSpeedMult: 1.0,
            damageMult: 1.5,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'crit_boost',
        perkDesc: '+10% crit chance'
    },
    runner: {
        id: 'runner',
        name: 'Runner',
        icon: '🏃',
        description: '+30% speed, -20% damage',
        costGems: 20,
        challenge: { id: 'survive_10_waves', desc: 'Survive 10 waves' },
        stats: {
            maxHpMult: 1.0,
            moveSpeedMult: 1.3,
            damageMult: 0.8,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 0.8
        },
        perk: 'dash_trail',
        perkDesc: 'Dash leaves damaging trail'
    },
    magnet: {
        id: 'magnet',
        name: 'Collector',
        icon: '🧲',
        description: '+80% pickup range, -20% HP',
        costGems: 25,
        challenge: { id: 'level_5', desc: 'Reach level 5' },
        stats: {
            maxHpMult: 0.8,
            moveSpeedMult: 1.0,
            damageMult: 1.0,
            fireRateMult: 1.0,
            pickupRangeMult: 1.8,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'auto_collect',
        perkDesc: 'Pickups fly to you faster'
    },
    scholar: {
        id: 'scholar',
        name: 'Scholar',
        icon: '📚',
        description: '+40% XP gain, -25% damage',
        costGems: 35,
        challenge: { id: 'level_10', desc: 'Reach level 10' },
        stats: {
            maxHpMult: 1.0,
            moveSpeedMult: 1.0,
            damageMult: 0.75,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.4,
            dashCooldownMult: 1.0
        },
        perk: 'extra_upgrade_choice',
        perkDesc: '+1 upgrade choice'
    },
    gunner: {
        id: 'gunner',
        name: 'Gunner',
        icon: '🔫',
        description: '+40% fire rate, -15% damage',
        costGems: 30,
        challenge: { id: 'kill_100', desc: 'Kill 100 enemies in one run' },
        stats: {
            maxHpMult: 1.0,
            moveSpeedMult: 1.0,
            damageMult: 0.85,
            fireRateMult: 1.4,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'extra_projectile',
        perkDesc: 'Fires an extra projectile'
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        icon: '💚',
        description: 'HP regen, -20% damage',
        costGems: 40,
        challenge: { id: 'upgrades_5', desc: 'Get 5 upgrades in one run' },
        stats: {
            maxHpMult: 1.0,
            moveSpeedMult: 1.0,
            damageMult: 0.8,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'regen',
        perkDesc: 'Regenerate 1 HP every 3 seconds'
    },
    gambler: {
        id: 'gambler',
        name: 'Gambler',
        icon: '🎲',
        description: '+2 rerolls, -15% HP',
        costGems: 35,
        challenge: { id: 'upgrades_10', desc: 'Get 10 upgrades in one run' },
        stats: {
            maxHpMult: 0.85,
            moveSpeedMult: 1.0,
            damageMult: 1.0,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'extra_rerolls',
        perkDesc: '+2 upgrade rerolls per wave'
    },
    sniper: {
        id: 'sniper',
        name: 'Sniper',
        icon: '🎯',
        description: '+60% damage, -35% fire rate',
        costGems: 45,
        challenge: { id: 'survive_15_waves', desc: 'Survive 15 waves' },
        stats: {
            maxHpMult: 0.9,
            moveSpeedMult: 1.0,
            damageMult: 1.6,
            fireRateMult: 0.65,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'pierce',
        perkDesc: 'Projectiles pierce 1 enemy'
    },
    berserker: {
        id: 'berserker',
        name: 'Berserker',
        icon: '😤',
        description: 'More damage when low HP, -25% max HP',
        costGems: 50,
        challenge: { id: 'kill_200', desc: 'Kill 200 enemies in one run' },
        stats: {
            maxHpMult: 0.75,
            moveSpeedMult: 1.0,
            damageMult: 1.0,
            fireRateMult: 1.0,
            pickupRangeMult: 1.0,
            xpGainMult: 1.0,
            dashCooldownMult: 1.0
        },
        perk: 'rage',
        perkDesc: '+50% damage when below 30% HP'
    }
};

// Make available globally
window.CHARACTER_DEFS = CHARACTER_DEFS;

// ===================================
// SAVE/LOAD HELPERS
// ===================================

function getPlayerProgress() {
    return {
        gemsYellow: parseInt(localStorage.getItem('gemsYellow') || '0'),
        unlockedCharacterIds: JSON.parse(localStorage.getItem('unlockedCharacterIds') || '["starter"]'),
        completedChallengeIds: JSON.parse(localStorage.getItem('completedChallengeIds') || '[]'),
        selectedCharacterId: localStorage.getItem('selectedCharacterId') || 'starter'
    };
}

function savePlayerProgress(progress) {
    localStorage.setItem('gemsYellow', progress.gemsYellow.toString());
    localStorage.setItem('unlockedCharacterIds', JSON.stringify(progress.unlockedCharacterIds));
    localStorage.setItem('completedChallengeIds', JSON.stringify(progress.completedChallengeIds));
    localStorage.setItem('selectedCharacterId', progress.selectedCharacterId);
}

function unlockCharacter(characterId) {
    var progress = getPlayerProgress();
    var character = CHARACTER_DEFS[characterId];
    
    if (!character) {
        console.error('Character not found:', characterId);
        return false;
    }
    
    if (progress.unlockedCharacterIds.indexOf(characterId) !== -1) {
        console.log('Character already unlocked:', characterId);
        return false;
    }
    
    if (progress.gemsYellow < character.costGems) {
        console.log('Not enough gems to unlock:', characterId);
        return false;
    }
    
    // Check if challenge is completed (if character has one)
    if (character.challenge && progress.completedChallengeIds.indexOf(character.challenge.id) === -1) {
        console.log('Challenge not completed for:', characterId);
        return false;
    }
    
    // Deduct gems and unlock
    progress.gemsYellow -= character.costGems;
    progress.unlockedCharacterIds.push(characterId);
    savePlayerProgress(progress);
    
    console.log('Character unlocked:', characterId);
    return true;
}

window.getPlayerProgress = getPlayerProgress;
window.savePlayerProgress = savePlayerProgress;
window.unlockCharacter = unlockCharacter;

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
        
        this.progress = getPlayerProgress();
        this.showingCharacterSelect = false;
        this.interactiveElements = [];
        
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        
        // Background
        this.createBackground();
        
        // Title
        var title = this.add.text(width / 2, height * 0.15, 'SWIPE &\nSURVIVE', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '42px',
            fontWeight: '800',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
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
        
        // Gems display (top right)
        this.gemsText = this.add.text(width - 15, 15, '💎 ' + this.progress.gemsYellow, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffdd00'
        }).setOrigin(1, 0);
        
        // Selected character display
        var selectedChar = CHARACTER_DEFS[this.progress.selectedCharacterId] || CHARACTER_DEFS.starter;
        this.selectedCharText = this.add.text(width / 2, height * 0.32, selectedChar.icon + ' ' + selectedChar.name, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#00ffff'
        }).setOrigin(0.5);
        
        this.selectedCharDesc = this.add.text(width / 2, height * 0.37, selectedChar.description, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);
        
        // Character select button
        var self = this;
        var charSelectBtn = this.createMenuButton(width / 2, height * 0.45, 'SELECT CHARACTER', function() {
            self.showCharacterSelect();
        }, 180, 36);
        this.interactiveElements.push(charSelectBtn);
        
        // Play button
        var playBtn = this.createPlayButton(width / 2, height * 0.58);
        this.interactiveElements.push(playBtn);
        
        // How to play
        this.add.text(width / 2, height * 0.73, 'HOW TO PLAY:', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: '600',
            color: '#888888'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height * 0.80, '• Swipe anywhere to DASH\n• Auto-attack nearest enemy\n• Survive waves & get upgrades!', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#666666',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);
        
        // Version
        this.add.text(width / 2, height - 20, 'v1.1.0', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#444444'
        }).setOrigin(0.5);
        
        // Build label (bottom-left)
        var buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
        this.add.text(10, height - 15, 'BUILD: ' + buildDate, {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#333333'
        }).setOrigin(0, 1);
        
        // Initialize audio on first interaction
        this.input.once('pointerdown', function() {
            if (window.gameAudioManager) {
                window.gameAudioManager.ensureContext();
            }
        });
    }
    
    createBackground() {
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        
        // Gradient background
        var bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x1a1a3a);
        bg.fillRect(0, 0, width, height);
        
        // Animated particles (stars)
        var reduced = localStorage.getItem('reducedEffects') === 'true';
        var particleCount = reduced ? 15 : 30;
        
        for (var i = 0; i < particleCount; i++) {
            var star = this.add.graphics();
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
    
    createMenuButton(x, y, text, callback, btnWidth, btnHeight) {
        var container = this.add.container(x, y);
        var halfW = btnWidth / 2;
        var halfH = btnHeight / 2;
        
        var bg = this.add.graphics();
        bg.fillStyle(0x333355);
        bg.fillRoundedRect(-halfW, -halfH, btnWidth, btnHeight, 8);
        bg.lineStyle(2, 0x5555aa);
        bg.strokeRoundedRect(-halfW, -halfH, btnWidth, btnHeight, 8);
        container.add(bg);
        
        var label = this.add.text(0, 0, text, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);
        
        var hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, btnWidth, btnHeight);
        container.setSize(btnWidth, btnHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        container.on('pointerdown', function() {
            console.log('Menu button tapped:', text);
            container.setScale(0.95);
            self.time.delayedCall(100, function() {
                if (container && container.active) container.setScale(1);
                if (callback) callback();
            });
        });
        
        return container;
    }
    
    createPlayButton(x, y) {
        var container = this.add.container(x, y);
        
        // Button background
        var bg = this.add.graphics();
        bg.fillStyle(0x00aaaa);
        bg.fillRoundedRect(-80, -28, 160, 56, 14);
        bg.lineStyle(3, 0x00ffff);
        bg.strokeRoundedRect(-80, -28, 160, 56, 14);
        container.add(bg);
        
        // Glow effect
        var glow = this.add.graphics();
        glow.fillStyle(0x00ffff, 0.3);
        glow.fillRoundedRect(-85, -33, 170, 66, 16);
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
        var text = this.add.text(0, 0, 'PLAY', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '26px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(text);
        
        // Make interactive with explicit hit area
        var hitArea = new Phaser.Geom.Rectangle(-80, -28, 160, 56);
        container.setSize(160, 56);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        container.on('pointerover', function() {
            self.tweens.add({
                targets: container,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        container.on('pointerout', function() {
            self.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        container.on('pointerdown', function() {
            console.log('PLAY button tapped');
            self.startGame();
        });
        
        return container;
    }
    
    showCharacterSelect() {
        if (this.showingCharacterSelect) return;
        this.showingCharacterSelect = true;
        
        console.log('Showing character select');
        
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var self = this;
        
        // Overlay container
        this.charSelectContainer = this.add.container(0, 0);
        this.charSelectContainer.setDepth(1000);
        this.charSelectButtons = [];
        
        // Dark background
        var overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, width, height);
        this.charSelectContainer.add(overlay);
        
        // Title
        var title = this.add.text(width / 2, 30, 'SELECT CHARACTER', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.charSelectContainer.add(title);
        
        // Gems display
        var gemsDisplay = this.add.text(width / 2, 55, '💎 ' + this.progress.gemsYellow + ' Gems', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffdd00'
        }).setOrigin(0.5);
        this.charSelectContainer.add(gemsDisplay);
        
        // Character list (scrollable area)
        var startY = 85;
        var cardHeight = 70;
        var cardSpacing = 8;
        var cardWidth = width - 30;
        
        var charIds = Object.keys(CHARACTER_DEFS);
        
        charIds.forEach(function(charId, index) {
            var character = CHARACTER_DEFS[charId];
            var y = startY + index * (cardHeight + cardSpacing);
            
            var isUnlocked = self.progress.unlockedCharacterIds.indexOf(charId) !== -1;
            var isSelected = self.progress.selectedCharacterId === charId;
            var challengeCompleted = !character.challenge || 
                self.progress.completedChallengeIds.indexOf(character.challenge.id) !== -1;
            var canUnlock = !isUnlocked && challengeCompleted && self.progress.gemsYellow >= character.costGems;
            
            var card = self.createCharacterCard(
                width / 2, y,
                cardWidth, cardHeight,
                character,
                isUnlocked,
                isSelected,
                challengeCompleted,
                canUnlock
            );
            self.charSelectButtons.push(card);
        });
        
        // Close button
        var closeBtn = this.createCharSelectButton(width / 2, height - 35, 'BACK', function() {
            self.hideCharacterSelect();
        }, 120, 40, 0x555577);
        this.charSelectButtons.push(closeBtn);
        
        // Entrance animation
        this.charSelectContainer.alpha = 0;
        this.tweens.add({
            targets: this.charSelectContainer,
            alpha: 1,
            duration: 200
        });
    }
    
    createCharacterCard(x, y, cardWidth, cardHeight, character, isUnlocked, isSelected, challengeCompleted, canUnlock) {
        var container = this.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(1001);
        
        var halfW = cardWidth / 2;
        var halfH = cardHeight / 2;
        
        // Card background
        var bg = this.add.graphics();
        if (isSelected) {
            bg.fillStyle(0x005555);
            bg.lineStyle(2, 0x00ffff);
        } else if (isUnlocked) {
            bg.fillStyle(0x2a2a4a);
            bg.lineStyle(1, 0x4a4a6a);
        } else {
            bg.fillStyle(0x1a1a2a);
            bg.lineStyle(1, 0x3a3a4a);
        }
        bg.fillRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 8);
        bg.strokeRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 8);
        container.add(bg);
        
        // Icon
        var icon = this.add.text(-halfW + 30, 0, character.icon, {
            fontSize: '28px'
        }).setOrigin(0.5);
        if (!isUnlocked) icon.setAlpha(0.5);
        container.add(icon);
        
        // Name
        var name = this.add.text(-halfW + 60, -halfH + 12, character.name, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: isUnlocked ? '#ffffff' : '#888888'
        }).setOrigin(0, 0);
        container.add(name);
        
        // Description
        var desc = this.add.text(-halfW + 60, -halfH + 30, character.description, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#aaaaaa'
        }).setOrigin(0, 0);
        container.add(desc);
        
        // Perk
        if (character.perkDesc) {
            var perk = this.add.text(-halfW + 60, -halfH + 45, '⭐ ' + character.perkDesc, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '9px',
                color: '#ffdd00'
            }).setOrigin(0, 0);
            container.add(perk);
        }
        
        // Status text (right side)
        var statusText;
        if (isSelected) {
            statusText = this.add.text(halfW - 10, 0, 'SELECTED', {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#00ffff'
            }).setOrigin(1, 0.5);
        } else if (isUnlocked) {
            statusText = this.add.text(halfW - 10, 0, 'TAP TO SELECT', {
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                color: '#666666'
            }).setOrigin(1, 0.5);
        } else if (canUnlock) {
            statusText = this.add.text(halfW - 10, 0, '💎 ' + character.costGems + '\nUNLOCK', {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#ffdd00',
                align: 'right'
            }).setOrigin(1, 0.5);
        } else if (!challengeCompleted) {
            statusText = this.add.text(halfW - 10, 0, '🔒 ' + character.challenge.desc, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '9px',
                color: '#ff6666',
                align: 'right'
            }).setOrigin(1, 0.5);
        } else {
            statusText = this.add.text(halfW - 10, 0, '💎 ' + character.costGems + '\nNeed gems', {
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                color: '#888888',
                align: 'right'
            }).setOrigin(1, 0.5);
        }
        container.add(statusText);
        
        // Make interactive
        var hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, cardWidth, cardHeight);
        container.setSize(cardWidth, cardHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        container.on('pointerdown', function() {
            console.log('Character card tapped:', character.id);
            container.setScale(0.98);
            self.time.delayedCall(100, function() {
                if (container && container.active) container.setScale(1);
            });
            
            if (isUnlocked) {
                // Select this character
                self.progress.selectedCharacterId = character.id;
                savePlayerProgress(self.progress);
                console.log('Character selected:', character.id);
                self.hideCharacterSelect();
                self.updateSelectedCharDisplay();
            } else if (canUnlock) {
                // Try to unlock
                if (unlockCharacter(character.id)) {
                    self.progress = getPlayerProgress();
                    self.hideCharacterSelect();
                    self.showCharacterSelect(); // Refresh
                    self.updateGemsDisplay();
                }
            }
        });
        
        return container;
    }
    
    createCharSelectButton(x, y, text, callback, btnWidth, btnHeight, color) {
        var container = this.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(1002);
        
        var halfW = btnWidth / 2;
        var halfH = btnHeight / 2;
        
        var bg = this.add.graphics();
        bg.fillStyle(color || 0x333355);
        bg.fillRoundedRect(-halfW, -halfH, btnWidth, btnHeight, 8);
        container.add(bg);
        
        var label = this.add.text(0, 0, text, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);
        
        var hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, btnWidth, btnHeight);
        container.setSize(btnWidth, btnHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        container.on('pointerdown', function() {
            container.setScale(0.95);
            self.time.delayedCall(100, function() {
                if (container && container.active) container.setScale(1);
                if (callback) callback();
            });
        });
        
        return container;
    }
    
    hideCharacterSelect() {
        console.log('Hiding character select');
        this.showingCharacterSelect = false;
        
        if (this.charSelectButtons) {
            this.charSelectButtons.forEach(function(btn) {
                if (btn && btn.destroy) btn.destroy();
            });
            this.charSelectButtons = [];
        }
        
        if (this.charSelectContainer) {
            this.charSelectContainer.destroy();
            this.charSelectContainer = null;
        }
    }
    
    updateSelectedCharDisplay() {
        var selectedChar = CHARACTER_DEFS[this.progress.selectedCharacterId] || CHARACTER_DEFS.starter;
        if (this.selectedCharText) {
            this.selectedCharText.setText(selectedChar.icon + ' ' + selectedChar.name);
        }
        if (this.selectedCharDesc) {
            this.selectedCharDesc.setText(selectedChar.description);
        }
    }
    
    updateGemsDisplay() {
        if (this.gemsText) {
            this.gemsText.setText('💎 ' + this.progress.gemsYellow);
        }
    }
    
    startGame() {
        console.log('Starting game with character:', this.progress.selectedCharacterId);
        
        // Transition effect
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        var selectedCharId = this.progress.selectedCharacterId;
        var self = this;
        
        this.time.delayedCall(300, function() {
            self.scene.start('GameScene', { selectedCharacterId: selectedCharId });
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
    
    init(data) {
        console.log('GameScene.init() with data:', data);
        
        // Character selection
        this.selectedCharacterId = (data && data.selectedCharacterId) || 
            localStorage.getItem('selectedCharacterId') || 'starter';
        this.selectedCharacter = CHARACTER_DEFS[this.selectedCharacterId] || CHARACTER_DEFS.starter;
        console.log('Selected character:', this.selectedCharacter.name);
        
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
        
        // Character perk: extra rerolls
        this.extraRerolls = this.selectedCharacter.perk === 'extra_rerolls' ? 2 : 0;
        
        // Spawn tracking
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
        
        // Arena size
        this.arenaWidth = 800;
        this.arenaHeight = 600;
    }
    
    create() {
        console.log('GameScene.create() called');
        
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
        
        // Apply character stat modifiers to upgrade manager base stats
        this.applyCharacterModifiers();
        
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
        
        // Create player at center with character modifiers
        this.player = new Player(this, this.arenaWidth / 2, this.arenaHeight / 2);
        this.applyCharacterToPlayer();
        
        // Setup camera to follow player
        this.cameras.main.startFollow(this.player.container, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
        this.cameras.main.setZoom(1);
        
        // Create UI (guard against duplicates)
        if (this.hud) this.hud.destroy();
        this.hud = new GameHUD(this);
        
        if (this.upgradeUI) this.upgradeUI.hide();
        this.upgradeUI = new UpgradeSelectionUI(this);
        
        if (this.pauseMenu) this.pauseMenu.hide();
        this.pauseMenu = new PauseMenu(this);
        
        if (this.gameOverScreen) this.gameOverScreen.hide();
        this.gameOverScreen = new GameOverScreen(this);
        
        // Setup input
        this.setupInput();
        
        // Setup collisions
        this.setupCollisions();
        
        // Debug mode flag (press G to toggle)
        this.debugMode = false;
        
        // Player damage invulnerability tracking
        this.playerInvulnTime = 0;
        this.playerInvulnDuration = 400; // ms of i-frames after taking damage
        
        // Start regen timer for Survivor perk
        if (this.selectedCharacter.perk === 'regen') {
            this.startRegenTimer();
        }
        
        // Start first wave
        this.startWave();
    }
    
    /**
     * Apply character stat modifiers to upgrade manager
     */
    applyCharacterModifiers() {
        var charStats = this.selectedCharacter.stats;
        var um = this.upgradeManager.stats;
        
        // Apply multipliers
        um.maxHp = Math.round(um.maxHp * (charStats.maxHpMult || 1));
        um.damage = um.damage * (charStats.damageMult || 1);
        um.fireRate = um.fireRate * (charStats.fireRateMult || 1);
        um.magnetRange = um.magnetRange * (charStats.pickupRangeMult || 1);
        um.xpGainMultiplier = um.xpGainMultiplier * (charStats.xpGainMult || 1);
        
        // Store character multipliers for runtime use
        this.charMoveSpeedMult = charStats.moveSpeedMult || 1;
        this.charDashCooldownMult = charStats.dashCooldownMult || 1;
        
        // Character perks
        if (this.selectedCharacter.perk === 'crit_boost') {
            um.critChance = (um.critChance || 0) + 0.1;
        }
        if (this.selectedCharacter.perk === 'pierce') {
            um.pierceCount = (um.pierceCount || 0) + 1;
        }
        if (this.selectedCharacter.perk === 'extra_projectile') {
            um.extraProjectiles = (um.extraProjectiles || 0) + 1;
        }
        if (this.selectedCharacter.perk === 'dash_trail') {
            um.dashTrailDamage = (um.dashTrailDamage || 0) + 15;
        }
        
        console.log('Character modifiers applied:', um);
    }
    
    /**
     * Apply character stats to player object
     */
    applyCharacterToPlayer() {
        if (!this.player) return;
        
        var stats = this.selectedCharacter.stats;
        
        // Apply max HP modifier
        this.player.maxHp = Math.round(this.player.maxHp * (stats.maxHpMult || 1));
        this.player.hp = this.player.maxHp;
        
        // Apply speed modifier
        this.player.speed = this.player.speed * (stats.moveSpeedMult || 1);
        
        // Apply dash cooldown modifier
        this.player.dashCooldown = Math.round(this.player.dashCooldown * (stats.dashCooldownMult || 1));
        
        console.log('Player stats after character modifiers:', {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            speed: this.player.speed,
            dashCooldown: this.player.dashCooldown
        });
    }
    
    /**
     * Regen timer for Survivor perk
     */
    startRegenTimer() {
        var self = this;
        this.regenTimer = this.time.addEvent({
            delay: 3000, // Every 3 seconds
            callback: function() {
                if (self.player && !self.gameOver && !self.isPaused) {
                    var maxHp = self.upgradeManager.stats.maxHp || self.player.maxHp;
                    if (self.player.hp < maxHp) {
                        self.player.hp = Math.min(self.player.hp + 1, maxHp);
                        console.log('Regen +1 HP, now:', self.player.hp);
                    }
                }
            },
            loop: true
        });
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
        
        // Thorns perk: reflect 10% damage to attacker (Tank character)
        if (this.selectedCharacter && this.selectedCharacter.perk === 'thorns' && source) {
            var thornsDamage = Math.round(amount * 0.1);
            if (thornsDamage > 0 && source.takeDamage) {
                source.takeDamage(thornsDamage, null, false);
                console.log('Thorns reflected', thornsDamage, 'damage to enemy');
            }
        }
        
        // Log damage for debugging
        console.log('DAMAGE APPLIED:', amount, '| HP:', Math.ceil(this.player.hp), '/', maxHp, '| debugHpText exists:', !!this.debugHpText);
        
        // Update debug text if it exists (optional)
        if (this.debugHpText && this.debugHpText.setText) {
            this.debugHpText.setText('HP: ' + Math.ceil(this.player.hp) + '/' + maxHp);
        }
        
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
        
        // Allow input to pass through to UI elements (important for upgrade menu)
        this.input.topOnly = true;
        
        this.input.on('pointerdown', (pointer) => {
            // Skip if UI is active (pause, upgrade menu, game over)
            if (this.isPaused || this.isIntermission || this.gameOver) {
                console.log('Game input blocked - UI active (isPaused:', this.isPaused, 'isIntermission:', this.isIntermission, 'gameOver:', this.gameOver, ')');
                return;
            }
            
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
        
        // Give small starting XP on wave 1
        if (this.wave === 1) {
            this.xpCurrency = 5; // Small head start, need to earn the rest
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
        
        // Add extra rerolls from Gambler perk
        if (this.extraRerolls > 0) {
            this.upgradeManager.rerollsLeft = (this.upgradeManager.rerollsLeft || 1) + this.extraRerolls;
            console.log('Gambler perk: added', this.extraRerolls, 'extra rerolls');
        }
        
        // Calculate number of upgrade choices (Scholar perk adds 1)
        var choiceCount = 3;
        if (this.selectedCharacter && this.selectedCharacter.perk === 'extra_upgrade_choice') {
            choiceCount = 4;
            console.log('Scholar perk: showing 4 upgrade choices');
        }
        
        // Show upgrade selection with XP currency system
        console.log('Showing upgrade selection UI, XP currency:', this.xpCurrency);
        var choices = this.upgradeManager.getRandomChoices(choiceCount);
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
    
    /**
     * Clean up when scene is shutdown (restart/quit)
     */
    shutdown() {
        console.log('GameScene shutdown - cleaning up');
        
        // Destroy HUD
        if (this.hud) {
            this.hud.destroy();
            this.hud = null;
        }
        
        // Hide/destroy UI overlays
        if (this.upgradeUI) {
            this.upgradeUI.hide();
            this.upgradeUI = null;
        }
        if (this.pauseMenu) {
            this.pauseMenu.hide();
            this.pauseMenu = null;
        }
        if (this.gameOverScreen) {
            this.gameOverScreen.hide();
            this.gameOverScreen = null;
        }
        
        // Clear object arrays
        this.enemyObjects = [];
        this.playerProjectileObjects = [];
        this.enemyProjectileObjects = [];
        this.pickupObjects = [];
    }
}

// Export scenes to window for Phaser config
window.AudioManager = AudioManager;
window.MenuScene = MenuScene;
window.GameScene = GameScene;

console.log('game.js loaded - MenuScene:', typeof MenuScene, 'GameScene:', typeof GameScene);
