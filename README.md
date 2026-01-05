# Swipe & Survive 🎮

A mobile-first 2D roguelite game built with Phaser 3. Survive waves of enemies, collect upgrades, and see how long you can last!

![Game Preview](https://img.shields.io/badge/Phaser-3.70.0-blue) ![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-green) ![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Compatible-orange)

## 🎯 Game Overview

**Swipe & Survive** is an action-packed roguelite where you control a sci-fi hero in an arena. Use one-thumb swipe controls to dash around while your character auto-attacks the nearest enemy. Survive timed waves, defeat bosses, and choose from 24 unique upgrades to build powerful combinations.

### Core Features

- **One-Thumb Controls**: Swipe anywhere to dash with i-frames
- **Auto-Attack System**: Automatically target and fire at nearest enemy
- **24 Unique Upgrades**: Common, Rare, and Epic upgrades that stack
- **5 Enemy Types**: Chasers, Shooters, Tanks, Splitters, and Bombers
- **Boss Fights**: Face the Brute boss every 5 waves
- **Roguelite Progression**: Each run is different with random upgrade choices

## 🕹️ How to Play

### Controls

| Platform | Action | How To |
|----------|--------|--------|
| Mobile | Dash | Swipe in any direction |
| Desktop | Move | Arrow keys or WASD |
| Desktop | Dash | Spacebar (dashes in facing direction) |
| Both | Pause | Tap ⚙️ button or press ESC |

### Gameplay Tips

1. **Dash has i-frames**: You're invulnerable during the dash animation
2. **Auto-attack is automatic**: Just get within range of enemies
3. **Collect XP orbs**: Green orbs level you up for more upgrades
4. **Grab Essence coins**: Gold coins are your score currency
5. **Synergize upgrades**: Chain Lightning + Multi-Shot = devastation!

## 🚀 Quick Start

### Play Online (GitHub Pages)

1. Fork this repository
2. Go to Settings → Pages
3. Set Source to "Deploy from a branch"
4. Select `main` branch and `/ (root)` folder
5. Click Save and wait for deployment
6. Access at `https://[username].github.io/[repo-name]/`

### Run Locally

```bash
# Clone the repository
git clone https://github.com/[username]/swipe-and-survive.git
cd swipe-and-survive

# Option 1: Python 3
python -m http.server 8000

# Option 2: Node.js (if you have npx)
npx serve .

# Option 3: PHP
php -S localhost:8000

# Then open http://localhost:8000 in your browser
```

### Test on Mobile Device

1. Start a local server (see above)
2. Find your computer's local IP (e.g., `192.168.1.100`)
3. On your phone, visit `http://192.168.1.100:8000`
4. For best experience, add to home screen on iOS

## 📁 Project Structure

```
/
├── index.html          # Main HTML entry point
├── style.css           # Global styles and loading screen
├── README.md           # This file
└── src/
    ├── main.js         # Phaser config, boot, resize handling
    ├── game.js         # Game scenes (Menu, Game) and audio
    ├── entities.js     # Player, enemies, projectiles, pickups
    ├── upgrades.js     # 24 upgrade definitions and manager
    └── ui.js           # HUD, upgrade cards, menus
```

## ⚔️ Enemies

| Enemy | Behavior | Threat |
|-------|----------|--------|
| 🔴 **Chaser** | Fast melee, rushes at you | Medium |
| 🟣 **Shooter** | Keeps distance, fires telegraphed shots | Medium |
| 🟢 **Tank** | Slow, high HP, hits hard | Low-Medium |
| 🟠 **Splitter** | Splits into 2 minis on death | Medium |
| 🟡 **Bomber** | Rushes in, explodes on death | High |
| 👹 **Brute Boss** | Slam AOE + projectile ring | Very High |

## 🔧 Upgrades (24 Total)

### Common (Gray)
- Power Surge (Damage +15%)
- Rapid Fire (Attack Speed +12%)
- Vitality (Max HP +20)
- Swift Feet (Move Speed +8%)
- Quick Dash (Dash Cooldown -10%)
- Knowledge (XP Gain +15%)
- Magnetism (Pickup Range +25%)
- Big Shots (Projectile Size +20%)

### Rare (Blue)
- Vampiric Touch (3% Lifesteal)
- Precision (8% Crit Chance)
- Devastation (Crit Damage +25%)
- Piercing Shots (+1 Pierce)
- Ricochet (+1 Bounce)
- Frost Touch (10% Freeze Chance)
- Thorns (15% Damage Return)
- Second Wind (Heal 15 on Wave Clear)
- Multi-Shot (+1 Projectile)

### Epic (Purple)
- Chain Lightning (Chain to 2 enemies)
- Dash Shield (1-hit shield after dash)
- Orbital Blades (+2 orbiting blades)
- Blazing Trail (Damaging dash trail)
- Overcharge (+50% fire rate after dash)
- Energy Barrier (Auto-shield every 15s)
- Volatile (Enemies explode on death)

## ⚙️ Settings

Access settings from the pause menu (⚙️ button):

- **Reduced Effects**: Disables screen shake, reduces particles (better performance)
- **Sound**: Toggle WebAudio sound effects

Settings are saved to localStorage.

## 📱 Performance Tips

For best performance on mobile:

1. **Enable "Reduced Effects"** in settings
2. **Close other apps** to free memory
3. **Use Safari** on iOS (best WebGL support)
4. **Disable Low Power Mode** for consistent 60fps

## 🛠️ Technical Details

- **Engine**: Phaser 3.70.0 (via CDN)
- **Rendering**: WebGL with Canvas fallback
- **Audio**: WebAudio API (generated sounds)
- **Storage**: localStorage for settings
- **Target**: 60fps on iPhone Safari

## 🧪 Testing Checklist

- [ ] Game loads without errors
- [ ] Title screen displays correctly
- [ ] "Play" button starts the game
- [ ] Swipe gesture triggers dash
- [ ] Player auto-attacks enemies
- [ ] Enemies spawn and chase/attack
- [ ] Damage numbers appear on hits
- [ ] Pickups are collected with magnet effect
- [ ] Wave timer counts down
- [ ] Upgrade selection appears between waves
- [ ] Upgrades apply correctly (check damage, speed, etc.)
- [ ] Boss spawns on wave 5
- [ ] Game over shows stats
- [ ] Retry restarts the game
- [ ] Pause menu works
- [ ] Settings toggle correctly
- [ ] Reduced effects setting reduces particles
- [ ] Sound toggle works
- [ ] Game runs at 60fps on mobile

## 📄 License

MIT License - Feel free to modify and use for your own projects!

## 🙏 Credits

- Built with [Phaser 3](https://phaser.io/)
- Fonts: [Rubik](https://fonts.google.com/specimen/Rubik) & [Inter](https://fonts.google.com/specimen/Inter)

---

**Enjoy the game! 🎮**

*Swipe smart, survive long!*
