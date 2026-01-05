/**
 * ===================================
 * SWIPE & SURVIVE - UI System
 * ===================================
 * 
 * Handles HUD, menus, upgrade cards, and overlays.
 */

console.log('ui.js loading...');

// ===================================
// HUD CLASS
// ===================================

class GameHUD {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1000);
        this.container.setScrollFactor(0);
        
        this.create();
    }
    
    create() {
        const width = this.scene.cameras.main.width;
        const padding = 15;
        
        // Top bar background
        this.topBar = this.scene.add.graphics();
        this.topBar.fillStyle(0x000000, 0.5);
        this.topBar.fillRect(0, 0, width, 80);
        this.container.add(this.topBar);
        
        // HP Bar
        this.hpBarBg = this.scene.add.graphics();
        this.hpBarBg.fillStyle(0x333333);
        this.hpBarBg.fillRoundedRect(padding, padding, 150, 20, 4);
        this.container.add(this.hpBarBg);
        
        this.hpBar = this.scene.add.graphics();
        this.container.add(this.hpBar);
        
        this.hpText = this.scene.add.text(padding + 75, padding + 10, '100/100', {
            fontFamily: 'Inter, Rubik, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(this.hpText);
        
        // XP Bar
        this.xpBarBg = this.scene.add.graphics();
        this.xpBarBg.fillStyle(0x333333);
        this.xpBarBg.fillRoundedRect(padding, padding + 28, 150, 12, 3);
        this.container.add(this.xpBarBg);
        
        this.xpBar = this.scene.add.graphics();
        this.container.add(this.xpBar);
        
        this.levelText = this.scene.add.text(padding + 160, padding + 34, 'Lv.1', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#44ff44'
        }).setOrigin(0, 0.5);
        this.container.add(this.levelText);
        
        // Wave & Timer (top right)
        this.waveText = this.scene.add.text(width - padding, padding, 'WAVE 1', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(1, 0);
        this.container.add(this.waveText);
        
        this.timerText = this.scene.add.text(width - padding, padding + 24, '30s', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: '600',
            color: '#00ffff'
        }).setOrigin(1, 0);
        this.container.add(this.timerText);
        
        // Essence counter (top center)
        this.essenceIcon = this.scene.add.graphics();
        this.essenceIcon.fillStyle(0xffdd00);
        this.essenceIcon.fillCircle(width / 2 - 30, padding + 20, 10);
        this.essenceIcon.lineStyle(2, 0xaa8800);
        this.essenceIcon.strokeCircle(width / 2 - 30, padding + 20, 10);
        this.container.add(this.essenceIcon);
        
        this.essenceText = this.scene.add.text(width / 2 - 15, padding + 20, '0', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffdd00'
        }).setOrigin(0, 0.5);
        this.container.add(this.essenceText);
        
        // Dash cooldown indicator (bottom center)
        const height = this.scene.cameras.main.height;
        this.dashIndicator = this.scene.add.graphics();
        this.dashIndicator.x = width / 2;
        this.dashIndicator.y = height - 60;
        this.container.add(this.dashIndicator);
        
        this.dashText = this.scene.add.text(width / 2, height - 30, 'SWIPE TO DASH', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: '500',
            color: '#888888'
        }).setOrigin(0.5);
        this.container.add(this.dashText);
        
        // Pause button (top right corner)
        this.pauseBtn = this.createButton(width - 50, padding + 55, '⚙️', () => {
            this.scene.showPauseMenu();
        }, 40);
        this.container.add(this.pauseBtn);
    }
    
    createButton(x, y, text, callback, size = 50) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillCircle(0, 0, size / 2);
        bg.lineStyle(2, 0x444444);
        bg.strokeCircle(0, 0, size / 2);
        container.add(bg);
        
        const label = this.scene.add.text(0, 0, text, {
            fontSize: `${size * 0.5}px`
        }).setOrigin(0.5);
        container.add(label);
        
        container.setSize(size, size);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', callback);
        
        return container;
    }
    
    update(player, wave, timer, essence, xp, level, xpToNext, stats) {
        const width = this.scene.cameras.main.width;
        const padding = 15;
        
        // Update HP bar
        const maxHp = stats?.maxHp || 100;
        const hpPercent = Math.max(0, player.hp / maxHp);
        const hpColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;
        
        this.hpBar.clear();
        this.hpBar.fillStyle(hpColor);
        this.hpBar.fillRoundedRect(padding + 2, padding + 2, 146 * hpPercent, 16, 3);
        this.hpText.setText(`${Math.ceil(player.hp)}/${maxHp}`);
        
        // Update XP bar
        const xpPercent = xpToNext > 0 ? xp / xpToNext : 0;
        this.xpBar.clear();
        this.xpBar.fillStyle(0x8844ff);
        this.xpBar.fillRoundedRect(padding + 1, padding + 29, 148 * xpPercent, 10, 2);
        this.levelText.setText(`Lv.${level}`);
        
        // Update wave & timer
        this.waveText.setText(`WAVE ${wave}`);
        this.timerText.setText(`${Math.ceil(timer)}s`);
        
        // Timer color
        if (timer <= 5) {
            this.timerText.setColor('#ff4444');
        } else if (timer <= 10) {
            this.timerText.setColor('#ffff44');
        } else {
            this.timerText.setColor('#00ffff');
        }
        
        // Update essence
        this.essenceText.setText(essence.toString());
        
        // Update dash indicator
        this.updateDashIndicator(player, stats);
    }
    
    updateDashIndicator(player, stats) {
        const time = this.scene.time.now;
        const cooldownMult = Math.max(0.3, stats?.dashCooldownMultiplier || 1);
        const cooldown = player.dashCooldown * cooldownMult;
        const elapsed = time - player.lastDashTime;
        const ready = elapsed >= cooldown;
        
        this.dashIndicator.clear();
        
        if (ready) {
            // Ready - full circle
            this.dashIndicator.fillStyle(0x00ffff, 0.8);
            this.dashIndicator.fillCircle(0, 0, 20);
            this.dashIndicator.lineStyle(3, 0x00ffff);
            this.dashIndicator.strokeCircle(0, 0, 20);
            this.dashText.setText('DASH READY');
            this.dashText.setColor('#00ffff');
        } else {
            // Cooldown - partial arc
            const progress = elapsed / cooldown;
            this.dashIndicator.fillStyle(0x444444, 0.5);
            this.dashIndicator.fillCircle(0, 0, 20);
            this.dashIndicator.lineStyle(3, 0x00ffff);
            this.dashIndicator.beginPath();
            this.dashIndicator.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            this.dashIndicator.strokePath();
            this.dashText.setText('COOLDOWN');
            this.dashText.setColor('#666666');
        }
    }
    
    destroy() {
        this.container.destroy();
    }
}

// ===================================
// UPGRADE SELECTION UI
// ===================================

class UpgradeSelectionUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.selectedCallback = null;
    }
    
    show(choices, upgradeManager, callback) {
        this.selectedCallback = callback;
        this.selectionMade = false; // Prevent double-selection
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setScrollFactor(0);
        
        // Darkened background - NOT interactive so it won't block clicks
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        this.container.add(overlay);
        
        // Debug text for selection feedback
        this.debugSelectText = this.scene.add.text(width / 2, height - 40, '', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#00ff00',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setDepth(2001);
        this.container.add(this.debugSelectText);
        
        // Title
        const title = this.scene.add.text(width / 2, 60, 'CHOOSE AN UPGRADE', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(title);
        
        // Subtitle
        const subtitle = this.scene.add.text(width / 2, 95, 'Wave completed! Pick your reward.', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);
        this.container.add(subtitle);
        
        // Cards
        const cardWidth = Math.min(140, (width - 60) / 3);
        const cardHeight = 200;
        const cardSpacing = 15;
        const totalWidth = choices.length * cardWidth + (choices.length - 1) * cardSpacing;
        const startX = (width - totalWidth) / 2 + cardWidth / 2;
        
        choices.forEach((upgrade, index) => {
            const cardX = startX + index * (cardWidth + cardSpacing);
            const cardY = height / 2 - 20;
            
            const card = this.createUpgradeCard(
                cardX, cardY, cardWidth, cardHeight,
                upgrade, upgradeManager, index
            );
            this.container.add(card);
        });
        
        // Reroll button (if available)
        if (upgradeManager.canReroll()) {
            const rerollBtn = this.createRerollButton(width / 2, height - 100, () => {
                upgradeManager.useReroll();
                this.hide();
                // Get new choices and show again
                const newChoices = upgradeManager.getRandomChoices(3);
                this.show(newChoices, upgradeManager, callback);
            });
            this.container.add(rerollBtn);
        }
        
        // Entrance animation
        this.container.alpha = 0;
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300
        });
    }
    
    createUpgradeCard(x, y, width, height, upgrade, upgradeManager, index) {
        const container = this.scene.add.container(x, y);
        
        const currentLevel = upgradeManager.getUpgradeLevel(upgrade.id);
        const isMaxed = currentLevel >= upgrade.maxLevel;
        
        // Card background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        
        // Rarity border
        bg.lineStyle(3, upgrade.rarity.color);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        
        // Top rarity glow
        bg.fillStyle(upgrade.rarity.color, 0.2);
        bg.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, 40, 8);
        
        container.add(bg);
        
        // Rarity label
        const rarityLabel = this.scene.add.text(0, -height / 2 + 18, upgrade.rarity.name.toUpperCase(), {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: '600',
            color: upgrade.rarity.colorHex
        }).setOrigin(0.5);
        container.add(rarityLabel);
        
        // Icon
        const icon = this.scene.add.text(0, -height / 2 + 65, upgrade.icon, {
            fontSize: '36px'
        }).setOrigin(0.5);
        container.add(icon);
        
        // Name
        const name = this.scene.add.text(0, -height / 2 + 110, upgrade.name, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff',
            wordWrap: { width: width - 20 },
            align: 'center'
        }).setOrigin(0.5, 0);
        container.add(name);
        
        // Description
        const desc = this.scene.add.text(0, -height / 2 + 135, upgrade.description, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#aaaaaa',
            wordWrap: { width: width - 20 },
            align: 'center'
        }).setOrigin(0.5, 0);
        container.add(desc);
        
        // Level indicator
        const levelText = this.scene.add.text(0, height / 2 - 25, 
            isMaxed ? 'MAX' : `Level ${currentLevel + 1}/${upgrade.maxLevel}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: '600',
            color: isMaxed ? '#ffaa00' : '#666666'
        }).setOrigin(0.5);
        container.add(levelText);
        
        // Make interactive with EXPLICIT hit area rectangle
        // The hit area is centered on the container (0,0), so offset by -width/2, -height/2
        var hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        container.setSize(width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        // Store reference for click handler
        var self = this;
        var upgradeData = upgrade;
        var cardBg = bg;
        
        container.on('pointerover', function() {
            if (!isMaxed && !self.selectionMade) {
                self.scene.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
            }
        });
        
        container.on('pointerout', function() {
            if (!self.selectionMade) {
                self.scene.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            }
        });
        
        container.on('pointerdown', function() {
            console.log('Upgrade card clicked:', upgradeData.id, upgradeData.name);
            
            // Update debug text
            if (self.debugSelectText) {
                self.debugSelectText.setText('Selected: ' + upgradeData.id);
            }
            
            // Visual press feedback
            container.setScale(0.95);
            self.scene.time.delayedCall(100, function() {
                if (container && container.active) {
                    container.setScale(1);
                }
            });
            
            if (!isMaxed && !self.selectionMade) {
                self.selectUpgrade(upgradeData);
            }
        });
        
        // Entrance animation
        container.alpha = 0;
        container.y += 50;
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 400,
            delay: index * 100,
            ease: 'Back.easeOut'
        });
        
        return container;
    }
    
    createRerollButton(x, y, callback) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333344);
        bg.fillRoundedRect(-70, -20, 140, 40, 8);
        bg.lineStyle(2, 0x666677);
        bg.strokeRoundedRect(-70, -20, 140, 40, 8);
        container.add(bg);
        
        const text = this.scene.add.text(0, 0, '🔄 REROLL (1x)', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(text);
        
        // Explicit hit area for container
        var hitArea = new Phaser.Geom.Rectangle(-70, -20, 140, 40);
        container.setSize(140, 40);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerdown', function() {
            console.log('Reroll button clicked');
            container.setScale(0.95);
            callback();
        });
        
        container.on('pointerover', function() {
            container.setScale(1.05);
        });
        
        container.on('pointerout', function() {
            container.setScale(1);
        });
        
        return container;
    }
    
    selectUpgrade(upgrade) {
        // Prevent double-selection
        if (this.selectionMade) {
            console.log('Selection already made, ignoring');
            return;
        }
        this.selectionMade = true;
        
        console.log('selectUpgrade called:', upgrade.id, upgrade.name);
        
        // Play level up sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playLevelUp();
        }
        
        // Store callback before animation (in case container gets destroyed)
        var callback = this.selectedCallback;
        var selectedUpgrade = upgrade;
        var self = this;
        
        // Selection animation
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            onComplete: function() {
                console.log('Upgrade selection animation complete, closing UI');
                self.hide();
                if (callback) {
                    console.log('Calling upgrade callback with:', selectedUpgrade.id);
                    callback(selectedUpgrade);
                }
            }
        });
    }
    
    hide() {
        console.log('UpgradeSelectionUI.hide() called');
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.selectionMade = false;
        this.selectedCallback = null;
    }
}

// ===================================
// PAUSE MENU
// ===================================

class PauseMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
    }
    
    show() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);
        this.container.setScrollFactor(0);
        
        // Background
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, width, height);
        this.container.add(overlay);
        
        // Title
        const title = this.scene.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '36px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(title);
        
        // Resume button
        this.createMenuButton(width / 2, height / 2 - 40, 'RESUME', () => {
            this.hide();
            this.scene.resumeGame();
        });
        
        // Settings section
        const settingsLabel = this.scene.add.text(width / 2, height / 2 + 30, 'SETTINGS', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            color: '#888888'
        }).setOrigin(0.5);
        this.container.add(settingsLabel);
        
        // Reduced Effects toggle
        const reducedEffects = localStorage.getItem('reducedEffects') === 'true';
        this.reducedToggle = this.createToggle(
            width / 2, height / 2 + 70,
            'Reduced Effects',
            reducedEffects,
            (value) => {
                localStorage.setItem('reducedEffects', value.toString());
            }
        );
        
        // Sound toggle
        const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.soundToggle = this.createToggle(
            width / 2, height / 2 + 115,
            'Sound',
            soundEnabled,
            (value) => {
                localStorage.setItem('soundEnabled', value.toString());
                if (this.scene.audioManager) {
                    this.scene.audioManager.setEnabled(value);
                }
            }
        );
        
        // Quit button
        this.createMenuButton(width / 2, height / 2 + 180, 'QUIT RUN', () => {
            this.hide();
            this.scene.quitRun();
        }, 0xff4444);
    }
    
    createMenuButton(x, y, text, callback, color = 0x00ffff) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x222233);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);
        bg.lineStyle(2, color);
        bg.strokeRoundedRect(-100, -25, 200, 50, 10);
        container.add(bg);
        
        const label = this.scene.add.text(0, 0, text, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);
        
        container.setSize(200, 50);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', callback);
        
        this.container.add(container);
        return container;
    }
    
    createToggle(x, y, labelText, initialValue, onChange) {
        const container = this.scene.add.container(x, y);
        
        // Label
        const label = this.scene.add.text(-80, 0, labelText, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        container.add(label);
        
        // Toggle background
        const toggleBg = this.scene.add.graphics();
        container.add(toggleBg);
        
        // Toggle knob
        const knob = this.scene.add.graphics();
        container.add(knob);
        
        let isOn = initialValue;
        
        const updateVisual = () => {
            toggleBg.clear();
            toggleBg.fillStyle(isOn ? 0x00ffff : 0x444444);
            toggleBg.fillRoundedRect(50, -12, 50, 24, 12);
            
            knob.clear();
            knob.fillStyle(0xffffff);
            knob.fillCircle(isOn ? 88 : 62, 0, 9);
        };
        
        updateVisual();
        
        container.setSize(160, 30);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                isOn = !isOn;
                updateVisual();
                onChange(isOn);
            });
        
        this.container.add(container);
        return container;
    }
    
    hide() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}

// ===================================
// GAME OVER SCREEN
// ===================================

class GameOverScreen {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
    }
    
    show(stats) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(4000);
        this.container.setScrollFactor(0);
        
        // Background
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x0a0a1a, 0.95);
        overlay.fillRect(0, 0, width, height);
        this.container.add(overlay);
        
        // Title
        const title = this.scene.add.text(width / 2, 80, 'GAME OVER', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '42px',
            fontWeight: '800',
            color: '#ff4444'
        }).setOrigin(0.5);
        this.container.add(title);
        
        // Stats section
        const statsStartY = 160;
        const statsSpacing = 45;
        
        this.createStatRow(width / 2, statsStartY, 'Waves Survived', stats.wave.toString());
        this.createStatRow(width / 2, statsStartY + statsSpacing, 'Enemies Defeated', stats.kills.toString());
        this.createStatRow(width / 2, statsStartY + statsSpacing * 2, 'Essence Earned', stats.essence.toString());
        this.createStatRow(width / 2, statsStartY + statsSpacing * 3, 'Level Reached', stats.level.toString());
        this.createStatRow(width / 2, statsStartY + statsSpacing * 4, 'Upgrades Taken', stats.upgradesCount.toString());
        
        // Upgrades list
        if (stats.upgrades && stats.upgrades.length > 0) {
            const upgradesLabel = this.scene.add.text(width / 2, statsStartY + statsSpacing * 5.5, 'UPGRADES ACQUIRED:', {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fontWeight: '600',
                color: '#888888'
            }).setOrigin(0.5);
            this.container.add(upgradesLabel);
            
            const upgradeIcons = stats.upgrades.map(u => u.icon).slice(0, 10).join(' ');
            const upgradesText = this.scene.add.text(width / 2, statsStartY + statsSpacing * 6.2, upgradeIcons, {
                fontSize: '20px'
            }).setOrigin(0.5);
            this.container.add(upgradesText);
        }
        
        // Retry button
        const retryBtn = this.createButton(width / 2, height - 100, 'RETRY', () => {
            this.hide();
            this.scene.scene.start('GameScene');
        });
        this.container.add(retryBtn);
        
        // Menu button
        const menuBtn = this.createButton(width / 2, height - 45, 'MAIN MENU', () => {
            this.hide();
            this.scene.scene.start('MenuScene');
        }, true);
        this.container.add(menuBtn);
        
        // Entrance animation
        this.container.alpha = 0;
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 500
        });
    }
    
    createStatRow(x, y, label, value) {
        const labelText = this.scene.add.text(x - 80, y, label, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0, 0.5);
        this.container.add(labelText);
        
        const valueText = this.scene.add.text(x + 80, y, value, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(1, 0.5);
        this.container.add(valueText);
    }
    
    createButton(x, y, text, callback, secondary = false) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        if (secondary) {
            bg.fillStyle(0x333344);
            bg.fillRoundedRect(-100, -22, 200, 44, 10);
        } else {
            bg.fillStyle(0x00aaaa);
            bg.fillRoundedRect(-100, -22, 200, 44, 10);
            bg.lineStyle(2, 0x00ffff);
            bg.strokeRoundedRect(-100, -22, 200, 44, 10);
        }
        container.add(bg);
        
        const label = this.scene.add.text(0, 0, text, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);
        
        container.setSize(200, 44);
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.scene.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
            })
            .on('pointerout', () => {
                this.scene.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            })
            .on('pointerdown', callback);
        
        return container;
    }
    
    hide() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}

// Export classes
window.GameHUD = GameHUD;
window.UpgradeSelectionUI = UpgradeSelectionUI;
window.PauseMenu = PauseMenu;
window.GameOverScreen = GameOverScreen;
