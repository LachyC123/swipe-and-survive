/**
 * ===================================
 * SWIPE & SURVIVE - Main Entry Point
 * ===================================
 * 
 * Phaser 3 configuration, boot sequence, and resize handling.
 */

console.log('main.js loading...');

// ===================================
// GAME CONFIGURATION
// ===================================

var gameConfig = {
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
            debug: false
        }
    },
    
    // Input configuration
    input: {
        activePointers: 2,
        touch: {
            capture: true
        }
    },
    
    // Scenes - use window references to ensure they're defined
    scene: [window.MenuScene, window.GameScene],
    
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
    
    // Transparent canvas
    transparent: false,
    
    // Banner disabled
    banner: false,
    
    // Callbacks for debugging
    callbacks: {
        preBoot: function(game) {
            console.log('Phaser preBoot');
        },
        postBoot: function(game) {
            console.log('Phaser postBoot - game ready');
            // Hide loading screen
            var loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }
    }
};

// ===================================
// INITIALIZATION FUNCTION
// ===================================

function initGame() {
    console.log('initGame called');
    
    // Verify dependencies
    if (typeof Phaser === 'undefined') {
        window.reportError('Phaser is not defined', 'main.js', 0, 0, null);
        return;
    }
    
    if (typeof window.MenuScene === 'undefined') {
        window.reportError('MenuScene is not defined', 'main.js', 0, 0, null);
        return;
    }
    
    if (typeof window.GameScene === 'undefined') {
        window.reportError('GameScene is not defined', 'main.js', 0, 0, null);
        return;
    }
    
    try {
        // Initialize audio manager
        window.gameAudioManager = new AudioManager();
        console.log('AudioManager created');
        
        // Detect device
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        window.gameDeviceInfo = {
            isMobile: isMobile,
            isIOS: isIOS,
            isSafari: isSafari,
            isIOSSafari: isIOS && isSafari,
            pixelRatio: window.devicePixelRatio || 1
        };
        console.log('Device info:', window.gameDeviceInfo);
        
        // Apply default settings
        if (localStorage.getItem('soundEnabled') === null) {
            localStorage.setItem('soundEnabled', 'true');
        }
        if (localStorage.getItem('reducedEffects') === null) {
            localStorage.setItem('reducedEffects', isMobile ? 'false' : 'false');
        }
        
        // Create the Phaser game
        console.log('Creating Phaser.Game...');
        window.game = new Phaser.Game(gameConfig);
        console.log('Phaser.Game created successfully');
        
        // Handle resize
        window.addEventListener('resize', function() {
            if (window.game) {
                window.game.scale.refresh();
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                if (window.game) {
                    window.game.scale.refresh();
                }
            }, 100);
        });
        
        // Prevent default touch behaviors on game container
        document.addEventListener('touchmove', function(e) {
            if (e.target.closest && e.target.closest('#game-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // iOS Safari fixes
        if (window.gameDeviceInfo.isIOSSafari) {
            var setVh = function() {
                document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
            };
            setVh();
            window.addEventListener('resize', setVh);
        }
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        if (window.reportError) {
            window.reportError('Game initialization failed: ' + error.message, 'main.js', 0, 0, error);
        }
    }
}

// ===================================
// START THE GAME
// ===================================

// Check if DOM is already ready
if (document.readyState === 'loading') {
    // DOM not ready, wait for it
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded fired');
        initGame();
    });
} else {
    // DOM is already ready, init immediately
    console.log('DOM already ready, initializing...');
    initGame();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

window.formatNumber = formatNumber;
window.clamp = clamp;
window.lerp = lerp;
window.randomRange = randomRange;

console.log('main.js loaded');
