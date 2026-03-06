// Garbage Truck Driving Game
// Drive with keyboard, touch, or Bluetooth controller!

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'playing';
let trashCollected = 0;
let totalTrash = 0;

// Controller state
let gamepad = null;
let controllerConnected = false;

// Keys pressed
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false
};

// Garbage truck
const truck = {
    x: 400,
    y: 300,
    width: 80,
    height: 50,
    angle: 0,
    speed: 0,
    maxSpeed: 4,
    acceleration: 0.15,
    friction: 0.98,
    turnSpeed: 0.05,
    armExtended: false,
    armTimer: 0
};

// Trash cans on the map
let trashCans = [];

// Houses/obstacles
let houses = [];

// Roads (visual only)
let roads = [];

// Celebration particles
let particles = [];

// Initialize game
function initGame() {
    trashCans = [];
    houses = [];
    particles = [];
    trashCollected = 0;
    gameState = 'playing';
    
    // Reset truck position
    truck.x = 100;
    truck.y = 100;
    truck.angle = 0;
    truck.speed = 0;
    
    // Create roads (horizontal and vertical)
    roads = [
        // Horizontal roads
        { x: 0, y: 80, width: canvas.width, height: 60 },
        { x: 0, y: 270, width: canvas.width, height: 60 },
        { x: 0, y: 460, width: canvas.width, height: 60 },
        // Vertical roads
        { x: 80, y: 0, width: 60, height: canvas.height },
        { x: 370, y: 0, width: 60, height: canvas.height },
        { x: 660, y: 0, width: 60, height: canvas.height }
    ];
    
    // Create houses between roads
    const housePositions = [
        { x: 180, y: 180 }, { x: 280, y: 180 },
        { x: 480, y: 180 }, { x: 580, y: 180 },
        { x: 180, y: 370 }, { x: 280, y: 370 },
        { x: 480, y: 370 }, { x: 580, y: 370 }
    ];
    
    housePositions.forEach(pos => {
        houses.push({
            x: pos.x,
            y: pos.y,
            width: 70,
            height: 70,
            color: ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8'][Math.floor(Math.random() * 4)]
        });
    });
    
    // Create trash cans near houses
    const trashPositions = [
        { x: 160, y: 150 }, { x: 260, y: 260 },
        { x: 460, y: 150 }, { x: 560, y: 260 },
        { x: 160, y: 340 }, { x: 260, y: 450 },
        { x: 460, y: 340 }, { x: 560, y: 450 },
        { x: 720, y: 200 }, { x: 720, y: 400 }
    ];
    
    trashPositions.forEach(pos => {
        trashCans.push({
            x: pos.x,
            y: pos.y,
            collected: false,
            shaking: false,
            shakeTimer: 0
        });
    });
    
    totalTrash = trashCans.length;
}

// Gamepad API handling
window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepad = e.gamepad;
    controllerConnected = true;
    updateControllerStatus();
});

window.addEventListener('gamepaddisconnected', (e) => {
    console.log('Gamepad disconnected');
    gamepad = null;
    controllerConnected = false;
    updateControllerStatus();
});

function updateControllerStatus() {
    const statusEl = document.getElementById('controllerStatus');
    if (statusEl) {
        if (controllerConnected) {
            statusEl.textContent = '🎮 Controller Connected!';
            statusEl.className = 'text-green-400 font-bold';
        } else {
            statusEl.textContent = '🎮 No Controller - Use Keyboard';
            statusEl.className = 'text-yellow-400 font-bold';
        }
    }
}

function pollGamepad() {
    // Need to re-get gamepads each frame
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        gamepad = gamepads[0];
        controllerConnected = true;
        
        // Left stick or D-pad for movement
        const deadzone = 0.2;
        
        // Left stick
        const leftX = gamepad.axes[0];
        const leftY = gamepad.axes[1];
        
        // D-pad buttons (varies by controller, usually buttons 12-15)
        const dpadUp = gamepad.buttons[12]?.pressed;
        const dpadDown = gamepad.buttons[13]?.pressed;
        const dpadLeft = gamepad.buttons[14]?.pressed;
        const dpadRight = gamepad.buttons[15]?.pressed;
        
        // Triggers and face buttons
        const buttonA = gamepad.buttons[0]?.pressed; // A/Cross
        const buttonB = gamepad.buttons[1]?.pressed; // B/Circle
        const rightTrigger = gamepad.buttons[7]?.value > 0.1; // RT/R2
        const leftTrigger = gamepad.buttons[6]?.value > 0.1; // LT/L2
        
        // Update keys from gamepad
        keys.up = leftY < -deadzone || dpadUp || rightTrigger;
        keys.down = leftY > deadzone || dpadDown || leftTrigger;
        keys.left = leftX < -deadzone || dpadLeft;
        keys.right = leftX > deadzone || dpadRight;
        keys.action = buttonA || buttonB;
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            e.preventDefault();
            break;
        case ' ':
        case 'Enter':
            keys.action = true;
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
        case ' ':
        case 'Enter':
            keys.action = false;
            break;
    }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    
    keys.left = dx < -20;
    keys.right = dx > 20;
    keys.up = dy < -20;
    keys.down = dy > 20;
});

canvas.addEventListener('touchend', (e) => {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
});

// Update truck physics
function updateTruck() {
    // Acceleration
    if (keys.up) {
        truck.speed += truck.acceleration;
    }
    if (keys.down) {
        truck.speed -= truck.acceleration * 0.7; // Slower reverse
    }
    
    // Apply friction
    truck.speed *= truck.friction;
    
    // Clamp speed
    truck.speed = Math.max(-truck.maxSpeed * 0.5, Math.min(truck.maxSpeed, truck.speed));
    
    // Turning (only when moving)
    if (Math.abs(truck.speed) > 0.1) {
        if (keys.left) {
            truck.angle -= truck.turnSpeed * (truck.speed > 0 ? 1 : -1);
        }
        if (keys.right) {
            truck.angle += truck.turnSpeed * (truck.speed > 0 ? 1 : -1);
        }
    }
    
    // Calculate new position
    const newX = truck.x + Math.cos(truck.angle) * truck.speed;
    const newY = truck.y + Math.sin(truck.angle) * truck.speed;
    
    // Boundary checking
    truck.x = Math.max(30, Math.min(canvas.width - 30, newX));
    truck.y = Math.max(30, Math.min(canvas.height - 30, newY));
    
    // Simple collision with houses
    houses.forEach(house => {
        if (isColliding(truck, house)) {
            truck.speed *= -0.5; // Bounce back
            truck.x -= Math.cos(truck.angle) * 5;
            truck.y -= Math.sin(truck.angle) * 5;
        }
    });
    
    // Update arm animation
    if (truck.armExtended) {
        truck.armTimer++;
        if (truck.armTimer > 30) {
            truck.armExtended = false;
            truck.armTimer = 0;
        }
    }
    
    // Check for trash collection
    if (keys.action || Math.abs(truck.speed) < 0.5) {
        checkTrashCollection();
    }
}

function isColliding(obj1, obj2) {
    return obj1.x - obj1.width/2 < obj2.x + obj2.width &&
           obj1.x + obj1.width/2 > obj2.x &&
           obj1.y - obj1.height/2 < obj2.y + obj2.height &&
           obj1.y + obj1.height/2 > obj2.y;
}

function checkTrashCollection() {
    trashCans.forEach(can => {
        if (!can.collected) {
            const dist = Math.sqrt((truck.x - can.x) ** 2 + (truck.y - can.y) ** 2);
            if (dist < 50) {
                can.shaking = true;
                
                // Collect after shake animation
                if (keys.action || dist < 30) {
                    collectTrash(can);
                }
            }
        }
    });
}

function collectTrash(can) {
    if (can.collected) return;
    
    can.collected = true;
    can.shaking = false;
    trashCollected++;
    truck.armExtended = true;
    truck.armTimer = 0;
    
    // Celebration particles
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: can.x,
            y: can.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            size: Math.random() * 10 + 5,
            emoji: ['⭐', '✨', '🗑️', '♻️'][Math.floor(Math.random() * 4)],
            life: 1
        });
    }
    
    // Play sound
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
    
    // Check win
    if (trashCollected >= totalTrash) {
        gameState = 'complete';
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;
    });
    particles = particles.filter(p => p.life > 0);
}

function updateTrashCans() {
    trashCans.forEach(can => {
        if (can.shaking) {
            can.shakeTimer++;
            if (can.shakeTimer > 30) {
                can.shaking = false;
                can.shakeTimer = 0;
            }
        }
    });
}

// Draw functions
function drawRoads() {
    // Grass background
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Roads
    ctx.fillStyle = '#546E7A';
    roads.forEach(road => {
        ctx.fillRect(road.x, road.y, road.width, road.height);
        
        // Road markings
        ctx.fillStyle = '#FFD54F';
        if (road.width > road.height) {
            // Horizontal road - center line
            for (let x = road.x; x < road.x + road.width; x += 40) {
                ctx.fillRect(x + 5, road.y + road.height/2 - 2, 20, 4);
            }
        } else {
            // Vertical road - center line
            for (let y = road.y; y < road.y + road.height; y += 40) {
                ctx.fillRect(road.x + road.width/2 - 2, y + 5, 4, 20);
            }
        }
        ctx.fillStyle = '#546E7A';
    });
}

function drawHouses() {
    houses.forEach(house => {
        // House shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(house.x + 5, house.y + 5, house.width, house.height);
        
        // House body
        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, house.y, house.width, house.height);
        
        // Roof
        ctx.fillStyle = '#37474F';
        ctx.beginPath();
        ctx.moveTo(house.x - 5, house.y);
        ctx.lineTo(house.x + house.width / 2, house.y - 25);
        ctx.lineTo(house.x + house.width + 5, house.y);
        ctx.closePath();
        ctx.fill();
        
        // Door
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(house.x + house.width/2 - 8, house.y + house.height - 30, 16, 30);
        
        // Window
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(house.x + 10, house.y + 15, 15, 15);
        ctx.fillRect(house.x + house.width - 25, house.y + 15, 15, 15);
    });
}

function drawTrashCans() {
    trashCans.forEach(can => {
        if (can.collected) return;
        
        let offsetX = 0;
        if (can.shaking) {
            offsetX = Math.sin(can.shakeTimer * 0.5) * 3;
        }
        
        ctx.save();
        ctx.translate(can.x + offsetX, can.y);
        
        // Trash can body
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-12, -20, 24, 30);
        
        // Lid
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-14, -25, 28, 8);
        
        // Handle
        ctx.fillStyle = '#263238';
        ctx.fillRect(-8, -8, 16, 3);
        
        // Emoji on can
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🗑️', 0, 25);
        
        ctx.restore();
    });
}

function drawTruck() {
    ctx.save();
    ctx.translate(truck.x, truck.y);
    ctx.rotate(truck.angle);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-35, -18, 70, 40);
    
    // Truck body (garbage compactor)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(-30, -20, 55, 40);
    
    // Compactor details
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(-25, -15, 45, 30);
    
    // Compactor lines
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 + i * 15, -15);
        ctx.lineTo(-20 + i * 15, 15);
        ctx.stroke();
    }
    
    // Cab
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(20, -18, 20, 36);
    
    // Windshield
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(25, -15, 13, 30);
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.fillRect(-25, -25, 15, 8);
    ctx.fillRect(-25, 17, 15, 8);
    ctx.fillRect(15, -25, 15, 8);
    ctx.fillRect(15, 17, 15, 8);
    
    // Trash arm (extends when collecting)
    if (truck.armExtended) {
        ctx.fillStyle = '#FFC107';
        const armExtent = Math.min(truck.armTimer * 2, 25);
        ctx.fillRect(-40 - armExtent, -5, armExtent + 10, 10);
        
        // Claw
        ctx.fillRect(-40 - armExtent - 5, -10, 8, 20);
    }
    
    // Warning lights
    const flashOn = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.fillStyle = flashOn ? '#FF9800' : '#FFC107';
    ctx.beginPath();
    ctx.arc(-20, -23, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -23, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, p.x, p.y);
        ctx.restore();
    });
}

function drawUI() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    // Trash counter
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`🗑️ Collected: ${trashCollected}/${totalTrash}`, 15, 33);
    
    // Controller indicator
    ctx.textAlign = 'right';
    ctx.fillStyle = controllerConnected ? '#4CAF50' : '#FFC107';
    ctx.fillText(controllerConnected ? '🎮 Controller' : '⌨️ Keyboard', canvas.width - 15, 33);
    
    // Progress bar
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width/2 - 100, 15, 200, 20);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(canvas.width/2 - 98, 17, (196 * trashCollected / totalTrash), 16);
}

function drawCompleteScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ROUTE COMPLETE! 🎉', canvas.width/2, 200);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '28px Arial';
    ctx.fillText(`All ${totalTrash} trash cans collected!`, canvas.width/2, 280);
    
    ctx.font = '48px Arial';
    ctx.fillText('🗑️ ♻️ 🚛', canvas.width/2, 360);
    
    ctx.fillStyle = '#FFEB3B';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press any button to play again!', canvas.width/2, 450);
}

// Main game loop
function gameLoop() {
    // Poll gamepad
    pollGamepad();
    
    if (gameState === 'playing') {
        updateTruck();
        updateTrashCans();
        updateParticles();
    } else if (gameState === 'complete') {
        updateParticles();
        if (keys.action || keys.up || keys.down) {
            initGame();
        }
    }
    
    // Draw everything
    drawRoads();
    drawHouses();
    drawTrashCans();
    drawTruck();
    drawParticles();
    drawUI();
    
    if (gameState === 'complete') {
        drawCompleteScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize and start
initGame();
updateControllerStatus();
gameLoop();
