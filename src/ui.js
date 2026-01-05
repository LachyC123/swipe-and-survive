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
        this.upgradeIcons = [];
        this.tooltip = null;
        this.created = false;
        this.lastUpgradeCount = 0;
        
        this.create();
    }
    
    create() {
        // Guard against duplicate creation
        if (this.created) return;
        this.created = true;
        
        var width = this.scene.cameras.main.width;
        var height = this.scene.cameras.main.height;
        var padding = 15;
        
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
        
        // XP Currency display (top center-left)
        this.xpCurrencyBg = this.scene.add.graphics();
        this.xpCurrencyBg.fillStyle(0x004466, 0.8);
        this.xpCurrencyBg.fillRoundedRect(width / 2 - 90, padding, 80, 28, 6);
        this.xpCurrencyBg.lineStyle(2, 0x00aaff);
        this.xpCurrencyBg.strokeRoundedRect(width / 2 - 90, padding, 80, 28, 6);
        this.container.add(this.xpCurrencyBg);
        
        this.xpCurrencyText = this.scene.add.text(width / 2 - 50, padding + 14, '💎 0', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#00ffff'
        }).setOrigin(0.5);
        this.container.add(this.xpCurrencyText);
        
        // Essence counter (top center-right)
        this.essenceIcon = this.scene.add.graphics();
        this.essenceIcon.fillStyle(0xffdd00);
        this.essenceIcon.fillCircle(width / 2 + 30, padding + 14, 8);
        this.essenceIcon.lineStyle(2, 0xaa8800);
        this.essenceIcon.strokeCircle(width / 2 + 30, padding + 14, 8);
        this.container.add(this.essenceIcon);
        
        this.essenceText = this.scene.add.text(width / 2 + 45, padding + 14, '0', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffdd00'
        }).setOrigin(0, 0.5);
        this.container.add(this.essenceText);
        
        // Upgrade icons container (below HP bar, left side)
        this.upgradeIconsContainer = this.scene.add.container(padding, padding + 48);
        this.container.add(this.upgradeIconsContainer);
        
        // Dash cooldown indicator (bottom center)
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
        
        // Build label (bottom-left)
        var buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
        var buildLabel = this.scene.add.text(10, height - 10, 'BUILD: ' + buildDate, {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#444444'
        }).setOrigin(0, 1);
        this.container.add(buildLabel);
        
        // Pause button (top right corner)
        this.pauseBtn = this.createButton(width - 50, padding + 55, '⚙️', function() {
            this.scene.showPauseMenu();
        }.bind(this), 40);
        this.container.add(this.pauseBtn);
    }
    
    /**
     * Update upgrade icons display with tap-to-show-details
     */
    updateUpgradeIcons(upgradeManager) {
        if (!upgradeManager) return;
        
        // Clear existing icons
        this.upgradeIconsContainer.removeAll(true);
        this.upgradeIcons = [];
        
        var acquired = upgradeManager.getAcquiredList();
        var self = this;
        var iconSize = 28;
        var spacing = 4;
        
        acquired.forEach(function(upgrade, index) {
            var x = index * (iconSize + spacing);
            
            // Icon background
            var bg = self.scene.add.graphics();
            bg.fillStyle(upgrade.rarity.color, 0.3);
            bg.fillRoundedRect(0, 0, iconSize, iconSize, 4);
            bg.lineStyle(2, upgrade.rarity.color);
            bg.strokeRoundedRect(0, 0, iconSize, iconSize, 4);
            
            // Icon container
            var iconContainer = self.scene.add.container(x, 0);
            iconContainer.add(bg);
            
            // Icon text
            var iconText = self.scene.add.text(iconSize / 2, iconSize / 2 - 2, upgrade.icon, {
                fontSize: '16px'
            }).setOrigin(0.5);
            iconContainer.add(iconText);
            
            // Level badge
            var levelBadge = self.scene.add.text(iconSize - 2, iconSize - 2, upgrade.currentLevel, {
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: '700',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);
            iconContainer.add(levelBadge);
            
            // Make tappable with proper hitArea
            iconContainer.setSize(iconSize, iconSize);
            var hitArea = new Phaser.Geom.Rectangle(0, 0, iconSize, iconSize);
            iconContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            
            iconContainer.on('pointerdown', function() {
                self.showUpgradeTooltip(upgrade, x + iconSize / 2, iconSize + 10);
            });
            
            self.upgradeIconsContainer.add(iconContainer);
            self.upgradeIcons.push({ container: iconContainer, upgrade: upgrade });
        });
    }
    
    /**
     * Show tooltip for an upgrade
     */
    showUpgradeTooltip(upgrade, x, y) {
        // Close existing tooltip
        this.hideTooltip();
        
        var width = this.scene.cameras.main.width;
        var padding = 15;
        var tooltipW = 200;
        var tooltipH = 130;
        
        // Position tooltip (clamp to screen)
        var tooltipX = Math.min(Math.max(padding + x, tooltipW / 2 + 10), width - tooltipW / 2 - 10);
        var tooltipY = padding + 48 + y + tooltipH / 2;
        
        this.tooltip = this.scene.add.container(tooltipX, tooltipY);
        this.tooltip.setDepth(2000);
        this.tooltip.setScrollFactor(0);
        
        // Background
        var bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-tooltipW / 2, -tooltipH / 2, tooltipW, tooltipH, 8);
        bg.lineStyle(2, upgrade.rarity.color);
        bg.strokeRoundedRect(-tooltipW / 2, -tooltipH / 2, tooltipW, tooltipH, 8);
        this.tooltip.add(bg);
        
        // Close button (X)
        var closeBtn = this.scene.add.text(tooltipW / 2 - 12, -tooltipH / 2 + 8, '✕', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', this.hideTooltip.bind(this));
        this.tooltip.add(closeBtn);
        
        // Rarity + Name
        var rarityColor = upgrade.rarity.colorHex || '#ffffff';
        var title = this.scene.add.text(0, -tooltipH / 2 + 18, upgrade.icon + ' ' + upgrade.name, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: rarityColor
        }).setOrigin(0.5, 0);
        this.tooltip.add(title);
        
        // Rarity label
        var rarityLabel = this.scene.add.text(0, -tooltipH / 2 + 38, upgrade.rarity.name.toUpperCase(), {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: rarityColor
        }).setOrigin(0.5, 0);
        this.tooltip.add(rarityLabel);
        
        // Level
        var levelStr = 'Level ' + upgrade.currentLevel + '/' + upgrade.maxLevel;
        var levelText = this.scene.add.text(0, -tooltipH / 2 + 55, levelStr, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#aaaaaa'
        }).setOrigin(0.5, 0);
        this.tooltip.add(levelText);
        
        // Description
        var desc = this.scene.add.text(0, -tooltipH / 2 + 75, upgrade.description, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#cccccc',
            wordWrap: { width: tooltipW - 20 },
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltip.add(desc);
        
        // Tap outside to close
        var self = this;
        this.tooltipCloseHandler = function(pointer) {
            // Check if tap is outside tooltip bounds
            var localX = pointer.x - tooltipX;
            var localY = pointer.y - tooltipY;
            if (Math.abs(localX) > tooltipW / 2 + 20 || Math.abs(localY) > tooltipH / 2 + 20) {
                self.hideTooltip();
            }
        };
        this.scene.input.on('pointerdown', this.tooltipCloseHandler);
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
        if (this.tooltipCloseHandler) {
            this.scene.input.off('pointerdown', this.tooltipCloseHandler);
            this.tooltipCloseHandler = null;
        }
    }
    
    destroy() {
        this.hideTooltip();
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.upgradeIcons = [];
        this.created = false;
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
    
    update(player, wave, timer, essence, xp, level, xpToNext, stats, xpCurrency) {
        var width = this.scene.cameras.main.width;
        var padding = 15;
        
        // Update HP bar
        var maxHp = stats && stats.maxHp ? stats.maxHp : 100;
        var hpPercent = Math.max(0, player.hp / maxHp);
        var hpColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;
        
        this.hpBar.clear();
        this.hpBar.fillStyle(hpColor);
        this.hpBar.fillRoundedRect(padding + 2, padding + 2, 146 * hpPercent, 16, 3);
        this.hpText.setText(Math.ceil(player.hp) + '/' + maxHp);
        
        // Update XP bar
        var xpPercent = xpToNext > 0 ? xp / xpToNext : 0;
        this.xpBar.clear();
        this.xpBar.fillStyle(0x8844ff);
        this.xpBar.fillRoundedRect(padding + 1, padding + 29, 148 * xpPercent, 10, 2);
        this.levelText.setText('Lv.' + level);
        
        // Update wave & timer
        this.waveText.setText('WAVE ' + wave);
        this.timerText.setText(Math.ceil(timer) + 's');
        
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
        
        // Update XP currency (upgrade points)
        var currency = xpCurrency || 0;
        this.xpCurrencyText.setText('💎 ' + currency);
        
        // Update dash indicator
        this.updateDashIndicator(player, stats);
        
        // Update upgrade icons only when count changes (avoid recreating every frame)
        if (this.scene.upgradeManager) {
            var acquiredCount = Object.keys(this.scene.upgradeManager.acquired).length;
            if (this.lastUpgradeCount !== acquiredCount) {
                this.lastUpgradeCount = acquiredCount;
                this.updateUpgradeIcons(this.scene.upgradeManager);
            }
        }
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
}

// ===================================
// UPGRADE SELECTION UI (with XP Cost System)
// ===================================

// Base XP costs by rarity (scales with wave)
var BASE_UPGRADE_COSTS = {
    'Common': 8,
    'Rare': 16,
    'Epic': 28
};

var BASE_REROLL_COST = 5;

// Get upgrade cost with wave scaling
function getUpgradeCost(rarityName, wave) {
    var baseCost = BASE_UPGRADE_COSTS[rarityName] || 8;
    // Add 1 XP per wave after wave 2
    var waveBonus = Math.max(0, (wave || 1) - 2) * 1;
    return baseCost + waveBonus;
}

function getRerollCost(wave) {
    return BASE_REROLL_COST + Math.max(0, (wave || 1) - 2);
}

class UpgradeSelectionUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.selectedCallback = null;
        this.gameScene = null; // Reference to game scene for XP
        this.interactiveElements = []; // Track interactive elements for cleanup
    }
    
    show(choices, upgradeManager, gameScene, callback) {
        console.log('=== UPGRADE UI SHOW ===');
        console.log('XP Currency:', gameScene.xpCurrency);
        console.log('Wave:', gameScene.wave);
        console.log('Choices:', choices.map(function(c) { return c ? c.id : 'null'; }));
        
        this.selectedCallback = callback;
        this.selectionMade = false;
        this.gameScene = gameScene; // Store for XP access
        this.upgradeManager = upgradeManager;
        
        var width = this.scene.cameras.main.width;
        var height = this.scene.cameras.main.height;
        
        // Destroy any existing container first
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(2000);
        this.container.setScrollFactor(0);
        
        // Darkened background - explicitly NOT interactive
        var overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        this.container.add(overlay);
        
        // Title
        var title = this.scene.add.text(width / 2, 40, 'CHOOSE AN UPGRADE', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '24px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(title);
        
        // XP Currency display
        var currentXP = gameScene.xpCurrency || 0;
        this.xpDisplay = this.scene.add.text(width / 2, 70, '💎 XP: ' + currentXP, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#00ffff'
        }).setOrigin(0.5);
        this.container.add(this.xpDisplay);
        
        // Debug text
        this.debugSelectText = this.scene.add.text(width / 2, height - 20, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#00ff00'
        }).setOrigin(0.5);
        this.container.add(this.debugSelectText);
        
        // Filter valid choices (must have id and apply function)
        var validChoices = choices.filter(function(u) {
            return u && u.id && u.apply && typeof u.apply === 'function';
        });
        
        // If not enough valid choices, get more
        while (validChoices.length < 3) {
            var moreChoices = upgradeManager.getRandomChoices(3);
            for (var i = 0; i < moreChoices.length && validChoices.length < 3; i++) {
                var c = moreChoices[i];
                if (c && c.id && c.apply && !validChoices.find(function(v) { return v.id === c.id; })) {
                    validChoices.push(c);
                }
            }
            if (moreChoices.length === 0) break;
        }
        
        // Cards
        var cardWidth = Math.min(120, (width - 40) / 3);
        var cardHeight = 180;
        var cardSpacing = 10;
        var totalWidth = validChoices.length * cardWidth + (validChoices.length - 1) * cardSpacing;
        var startX = (width - totalWidth) / 2 + cardWidth / 2;
        
        var self = this;
        var currentWave = gameScene.wave || 1;
        
        // Store references to interactive elements for cleanup
        this.interactiveElements = [];
        
        validChoices.forEach(function(upgrade, index) {
            var cardX = startX + index * (cardWidth + cardSpacing);
            var cardY = height / 2 - 30;
            
            var card = self.createUpgradeCard(
                cardX, cardY, cardWidth, cardHeight,
                upgrade, upgradeManager, index, currentXP, currentWave
            );
            // Add to scene directly for better touch handling, NOT to container
            self.interactiveElements.push(card);
        });
        
        // Skip button (always available) - add to scene directly
        var skipBtn = this.createSkipButton(width / 2 - 80, height - 70);
        this.interactiveElements.push(skipBtn);
        
        // Reroll button (costs XP with wave scaling) - add to scene directly
        var rerollCost = getRerollCost(currentWave);
        var rerollBtn = this.createRerollButton(width / 2 + 80, height - 70, currentXP, rerollCost);
        this.interactiveElements.push(rerollBtn);
        
        // Entrance animation
        this.container.alpha = 0;
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300
        });
        
        // DEBUG: Add scene-level input listener to verify events are received
        var debugInputHandler = function(pointer) {
            console.log('SCENE POINTERDOWN at:', Math.round(pointer.x), Math.round(pointer.y));
        };
        this.scene.input.on('pointerdown', debugInputHandler);
        
        // Store for cleanup
        this.debugInputHandler = debugInputHandler;
        
        console.log('Upgrade UI fully initialized, waiting for input...');
    }
    
    createUpgradeCard(x, y, width, height, upgrade, upgradeManager, index, currentXP, currentWave) {
        var container = this.scene.add.container(x, y);
        container.setScrollFactor(0); // Match parent container
        container.setDepth(2001); // Above overlay
        
        var currentLevel = upgradeManager.getUpgradeLevel(upgrade.id);
        var isMaxed = currentLevel >= upgrade.maxLevel;
        
        // Calculate cost based on rarity with wave scaling
        var cost = getUpgradeCost(upgrade.rarity.name, currentWave);
        var canAfford = currentXP >= cost && !isMaxed;
        
        // Card background
        var bg = this.scene.add.graphics();
        if (canAfford) {
            bg.fillStyle(0x1a1a2e);
        } else {
            bg.fillStyle(0x111118); // Darker when can't afford
        }
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        
        // Rarity border
        var borderColor = canAfford ? upgrade.rarity.color : 0x444444;
        bg.lineStyle(2, borderColor);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        
        // Top rarity glow
        bg.fillStyle(upgrade.rarity.color, canAfford ? 0.2 : 0.1);
        bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, 30, 6);
        
        container.add(bg);
        
        // Rarity label
        var rarityLabel = this.scene.add.text(0, -height / 2 + 14, upgrade.rarity.name.toUpperCase(), {
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            fontWeight: '600',
            color: canAfford ? upgrade.rarity.colorHex : '#666666'
        }).setOrigin(0.5);
        container.add(rarityLabel);
        
        // Icon
        var icon = this.scene.add.text(0, -height / 2 + 50, upgrade.icon, {
            fontSize: '28px'
        }).setOrigin(0.5);
        if (!canAfford) icon.setAlpha(0.5);
        container.add(icon);
        
        // Name
        var name = this.scene.add.text(0, -height / 2 + 82, upgrade.name, {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '11px',
            fontWeight: '700',
            color: canAfford ? '#ffffff' : '#888888',
            wordWrap: { width: width - 10 },
            align: 'center'
        }).setOrigin(0.5, 0);
        container.add(name);
        
        // Description
        var desc = this.scene.add.text(0, -height / 2 + 100, upgrade.description, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            color: canAfford ? '#aaaaaa' : '#666666',
            wordWrap: { width: width - 10 },
            align: 'center'
        }).setOrigin(0.5, 0);
        container.add(desc);
        
        // Cost display
        var costText;
        if (isMaxed) {
            costText = this.scene.add.text(0, height / 2 - 20, 'MAXED', {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffaa00'
            }).setOrigin(0.5);
        } else if (canAfford) {
            costText = this.scene.add.text(0, height / 2 - 20, '💎 ' + cost + ' XP', {
                fontFamily: 'Rubik, sans-serif',
                fontSize: '12px',
                fontWeight: '700',
                color: '#00ffff'
            }).setOrigin(0.5);
        } else {
            var needed = cost - currentXP;
            costText = this.scene.add.text(0, height / 2 - 20, 'Need ' + needed + ' more', {
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                color: '#ff6666'
            }).setOrigin(0.5);
        }
        container.add(costText);
        
        // Make interactive with explicit hit area
        var hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        container.setSize(width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        var upgradeData = upgrade;
        var upgradeCost = cost;
        var cardWave = currentWave;
        
        container.on('pointerover', function() {
            // Check affordability in real-time
            var currentXPNow = self.gameScene ? self.gameScene.xpCurrency : 0;
            var canAffordNow = currentXPNow >= upgradeCost && !isMaxed;
            if (canAffordNow && !self.selectionMade) {
                self.scene.tweens.add({
                    targets: container,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 100
                });
            }
        });
        
        container.on('pointerout', function() {
            self.scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        container.on('pointerdown', function() {
            try {
                // Re-check XP in real-time (not from closure)
                var currentXPNow = self.gameScene ? self.gameScene.xpCurrency : 0;
                var canAffordNow = currentXPNow >= upgradeCost && !isMaxed;
                
                console.log('=== UPGRADE CARD CLICKED ===');
                console.log('Upgrade:', upgradeData.id, upgradeData.name);
                console.log('Cost:', upgradeCost, 'Current XP:', currentXPNow);
                console.log('Can afford:', canAffordNow, 'Is maxed:', isMaxed);
                console.log('Selection already made:', self.selectionMade);
                console.log('gameScene ref:', self.gameScene ? 'valid' : 'NULL');
                
                // Visual feedback
                container.setScale(0.95);
                self.scene.time.delayedCall(100, function() {
                    if (container && container.active) container.setScale(1);
                });
                
                if (self.selectionMade) {
                    console.log('BLOCKED: Selection already made');
                    return;
                }
                
                if (isMaxed) {
                    console.log('BLOCKED: Upgrade is maxed');
                    if (self.debugSelectText) {
                        self.debugSelectText.setText('MAXED: ' + upgradeData.id);
                    }
                    return;
                }
                
                if (!canAffordNow) {
                    console.log('BLOCKED: Cannot afford (need ' + upgradeCost + ', have ' + currentXPNow + ')');
                    if (self.debugSelectText) {
                        self.debugSelectText.setText('Need ' + (upgradeCost - currentXPNow) + ' more XP');
                    }
                    return;
                }
                
                // All checks passed - select the upgrade
                console.log('SELECTING upgrade:', upgradeData.id);
                if (self.debugSelectText) {
                    self.debugSelectText.setText('Selected: ' + upgradeData.id + ' (-' + upgradeCost + ' XP)');
                }
                self.selectUpgrade(upgradeData, upgradeCost);
            } catch (err) {
                console.error('ERROR in upgrade card click handler:', err);
                if (self.debugSelectText) {
                    self.debugSelectText.setText('ERROR: ' + err.message);
                }
            }
        });
        
        // Entrance animation
        container.alpha = 0;
        container.y += 40;
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 350,
            delay: index * 80,
            ease: 'Back.easeOut'
        });
        
        return container;
    }
    
    createSkipButton(x, y) {
        var container = this.scene.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(2001);
        
        var bg = this.scene.add.graphics();
        bg.fillStyle(0x444455);
        bg.fillRoundedRect(-60, -18, 120, 36, 8);
        bg.lineStyle(2, 0x666677);
        bg.strokeRoundedRect(-60, -18, 120, 36, 8);
        container.add(bg);
        
        var text = this.scene.add.text(0, 0, 'SKIP →', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(text);
        
        var hitArea = new Phaser.Geom.Rectangle(-60, -18, 120, 36);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        container.on('pointerdown', function() {
            console.log('=== SKIP BUTTON CLICKED ===');
            console.log('Selection already made:', self.selectionMade);
            
            container.setScale(0.95);
            self.scene.time.delayedCall(100, function() {
                if (container && container.active) container.setScale(1);
            });
            
            if (self.selectionMade) {
                console.log('BLOCKED: Selection already made');
                return;
            }
            
            self.selectionMade = true;
            console.log('SKIPPING - closing menu');
            if (self.debugSelectText) {
                self.debugSelectText.setText('Skipped upgrade');
            }
            self.closeAndContinue(null, 0);
        });
        
        container.on('pointerover', function() {
            container.setScale(1.05);
        });
        
        container.on('pointerout', function() {
            container.setScale(1);
        });
        
        return container;
    }
    
    createRerollButton(x, y, currentXP, rerollCost) {
        var container = this.scene.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(2001);
        var cost = rerollCost || BASE_REROLL_COST;
        var canAfford = currentXP >= cost;
        
        var bg = this.scene.add.graphics();
        bg.fillStyle(canAfford ? 0x335533 : 0x333333);
        bg.fillRoundedRect(-60, -18, 120, 36, 8);
        bg.lineStyle(2, canAfford ? 0x44aa44 : 0x555555);
        bg.strokeRoundedRect(-60, -18, 120, 36, 8);
        container.add(bg);
        
        var text = this.scene.add.text(0, 0, '🔄 ' + cost + ' XP', {
            fontFamily: 'Rubik, sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            color: canAfford ? '#88ff88' : '#666666'
        }).setOrigin(0.5);
        container.add(text);
        
        var hitArea = new Phaser.Geom.Rectangle(-60, -18, 120, 36);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        var self = this;
        var rerollCostLocal = cost;
        container.on('pointerdown', function() {
            // Re-check XP in real-time
            var currentXPNow = self.gameScene ? self.gameScene.xpCurrency : 0;
            var canAffordNow = currentXPNow >= rerollCostLocal;
            
            console.log('=== REROLL BUTTON CLICKED ===');
            console.log('Reroll cost:', rerollCostLocal, 'Current XP:', currentXPNow);
            console.log('Can afford:', canAffordNow);
            console.log('Selection already made:', self.selectionMade);
            
            container.setScale(0.95);
            self.scene.time.delayedCall(100, function() {
                if (container && container.active) container.setScale(1);
            });
            
            if (self.selectionMade) {
                console.log('BLOCKED: Selection already made');
                return;
            }
            
            if (!canAffordNow) {
                console.log('BLOCKED: Cannot afford reroll');
                if (self.debugSelectText) {
                    self.debugSelectText.setText('Need ' + (rerollCostLocal - currentXPNow) + ' more XP to reroll');
                }
                return;
            }
            
            // Deduct XP and reroll
            console.log('REROLLING - deducting', rerollCostLocal, 'XP');
            self.gameScene.xpCurrency -= rerollCostLocal;
            if (self.debugSelectText) {
                self.debugSelectText.setText('Rerolled (-' + rerollCostLocal + ' XP)');
            }
            
            // Store callback before destroying
            var savedCallback = self.selectedCallback;
            var savedUpgradeManager = self.upgradeManager;
            var savedGameScene = self.gameScene;
            
            // Hide and show new choices
            self.hide();
            var newChoices = savedUpgradeManager.getRandomChoices(3);
            self.show(newChoices, savedUpgradeManager, savedGameScene, savedCallback);
        });
        
        container.on('pointerover', function() {
            if (canAfford) container.setScale(1.05);
        });
        
        container.on('pointerout', function() {
            container.setScale(1);
        });
        
        return container;
    }
    
    selectUpgrade(upgrade, cost) {
        console.log('=== selectUpgrade CALLED ===');
        console.log('Upgrade:', upgrade ? upgrade.id : 'null');
        console.log('Cost:', cost);
        console.log('selectionMade flag:', this.selectionMade);
        
        if (this.selectionMade) {
            console.log('BLOCKED: selectionMade is already true');
            return;
        }
        this.selectionMade = true;
        
        if (this.scene.audioManager) {
            this.scene.audioManager.playLevelUp();
        }
        
        console.log('Calling closeAndContinue...');
        this.closeAndContinue(upgrade, cost);
    }
    
    closeAndContinue(upgrade, cost) {
        console.log('=== closeAndContinue CALLED ===');
        console.log('Upgrade:', upgrade ? upgrade.id : 'SKIP');
        console.log('Cost:', cost);
        console.log('Has callback:', this.selectedCallback ? 'YES' : 'NO');
        console.log('Has container:', this.container ? 'YES' : 'NO');
        
        var callback = this.selectedCallback;
        var self = this;
        
        if (!this.container) {
            console.log('ERROR: No container to animate!');
            if (callback) {
                console.log('Calling callback directly...');
                callback(upgrade, cost);
            }
            return;
        }
        
        console.log('Starting fade-out animation...');
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            onComplete: function() {
                console.log('Fade-out complete, hiding UI...');
                self.hide();
                if (callback) {
                    console.log('Calling game callback with upgrade:', upgrade ? upgrade.id : 'SKIP');
                    callback(upgrade, cost);
                } else {
                    console.log('WARNING: No callback to call!');
                }
            }
        });
    }
    
    hide() {
        console.log('UpgradeSelectionUI.hide()');
        
        // Remove debug input listener
        if (this.debugInputHandler) {
            this.scene.input.off('pointerdown', this.debugInputHandler);
            this.debugInputHandler = null;
        }
        
        // Destroy interactive elements (cards, buttons)
        if (this.interactiveElements) {
            this.interactiveElements.forEach(function(elem) {
                if (elem && elem.destroy) {
                    elem.destroy();
                }
            });
            this.interactiveElements = [];
        }
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.selectionMade = false;
        this.selectedCallback = null;
        this.gameScene = null;
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
