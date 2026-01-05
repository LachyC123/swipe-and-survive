/**
 * ===================================
 * SWIPE & SURVIVE - Main Entry Point
 * ===================================
 * 
 * Phaser 3 configuration, boot sequence, and resize handling.
 */

// ===================================
// GAME CONFIGURATION
// ===================================

const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    
    // Mobile-first responsive scaling
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 700,
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 600,
            height: 1000
        }
    },
    
    // Rendering settings for mobile performance
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true,
        powerPreference: 'high-performance'
    },
    
    // Physics configuration
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
            fps: 60
        }
    },
    
    // Input configuration
    input: {
        activePointers: 2,
        touch: {
            capture: true
        }
    },
    
    // Scenes
    scene: [MenuScene, GameScene],
    
    // Performance settings
    fps: {
        target: 60,
        min: 30,
        forceSetTimeOut: false
    },
    
    // Background color
    backgroundColor: '#0a0a1a',
    
    // Disable context menu on right-click
    disableContextMenu: true,
    
    // Transparent canvas (optional)
    transparent: false,
    
    // Banner disabled
    banner: false
};

// ===================================
// BOOT SEQUENCE
// ===================================

class GameBoot {
    constructor() {
        this.game = null;
        this.loadingProgress = 0;
    }
    
    init() {
        // Update loading progress
        this.updateLoadingProgress(10);
        
        // Initialize audio manager
        window.gameAudioManager = new AudioManager();
        this.updateLoadingProgress(30);
        
        // Detect device capabilities
        this.detectDevice();
        this.updateLoadingProgress(50);
        
        // Apply saved settings
        this.applySettings();
        this.updateLoadingProgress(70);
        
        // Create game instance
        this.createGame();
        this.updateLoadingProgress(100);
    }
    
    updateLoadingProgress(percent) {
        this.loadingProgress = percent;
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }
    
    detectDevice() {
        // Detect if running on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        window.gameDeviceInfo = {
            isMobile,
            isIOS,
            isSafari,
            isIOSSafari: isIOS && isSafari,
            pixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };
        
        console.log('Device Info:', window.gameDeviceInfo);
        
        // Auto-enable reduced effects on older/slower devices
        if (isMobile && window.devicePixelRatio < 2) {
            if (localStorage.getItem('reducedEffects') === null) {
                localStorage.setItem('reducedEffects', 'true');
            }
        }
    }
    
    applySettings() {
        // Apply default settings if not set
        if (localStorage.getItem('soundEnabled') === null) {
            localStorage.setItem('soundEnabled', 'true');
        }
        if (localStorage.getItem('reducedEffects') === null) {
            localStorage.setItem('reducedEffects', 'false');
        }
    }
    
    createGame() {
        try {
            this.game = new Phaser.Game(gameConfig);
            
            // Handle resize events
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.handleResize(), 100);
            });
            
            // Handle visibility change (pause when tab hidden)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (this.game && this.game.scene.scenes.length > 0) {
                        const gameScene = this.game.scene.getScene('GameScene');
                        if (gameScene && gameScene.scene.isActive()) {
                            gameScene.showPauseMenu();
                        }
                    }
                }
            });
            
            // Prevent default touch behaviors
            document.addEventListener('touchmove', (e) => {
                if (e.target.closest('#game-container')) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // iOS Safari address bar fix
            if (window.gameDeviceInfo.isIOSSafari) {
                this.handleIOSSafari();
            }
            
            console.log('Game initialized successfully');
            
        } catch (error) {
            console.error('Failed to create game:', error);
            this.showError(error);
        }
    }
    
    handleResize() {
        if (!this.game) return;
        
        // Force scale manager to update
        this.game.scale.refresh();
    }
    
    handleIOSSafari() {
        // Fix for iOS Safari viewport issues
        const setViewportHeight = () => {
            document.documentElement.style.setProperty(
                '--vh',
                `${window.innerHeight * 0.01}px`
            );
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        
        // Prevent bounce scroll
        document.body.addEventListener('touchmove', (e) => {
            if (!e.target.closest('#game-container canvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    showError(error) {
        const errorOverlay = document.getElementById('error-overlay');
        const errorMessage = document.getElementById('error-message');
        
        if (errorOverlay && errorMessage) {
            errorMessage.textContent = `Initialization Error:\n${error.message}\n\n${error.stack}`;
            errorOverlay.classList.remove('hidden');
        }
    }
}

// ===================================
// INITIALIZATION
// ===================================

// Wait for DOM and Phaser to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        try {
            const boot = new GameBoot();
            boot.init();
        } catch (error) {
            console.error('Boot failed:', error);
            
            // Show error on screen
            const errorOverlay = document.getElementById('error-overlay');
            const errorMessage = document.getElementById('error-message');
            
            if (errorOverlay && errorMessage) {
                errorMessage.textContent = `Boot Error:\n${error.message}\n\n${error.stack}`;
                errorOverlay.classList.remove('hidden');
            }
        }
    }, 100);
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Random float between min and max
 */
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Check if point is inside circle
 */
function pointInCircle(px, py, cx, cy, radius) {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
}

// Export utilities
window.formatNumber = formatNumber;
window.clamp = clamp;
window.lerp = lerp;
window.randomRange = randomRange;
window.pointInCircle = pointInCircle;

console.log('Swipe & Survive - Main module loaded');
