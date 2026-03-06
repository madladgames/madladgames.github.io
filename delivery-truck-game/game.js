// Delivery Truck Game
// Click on trucks to select them, drive to matching delivery locations!

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
canvas.width = 700;
canvas.height = 700;

// Game state
let selectedTruck = null;
let gameState = 'selecting'; // selecting, driving, delivering, complete
let deliveriesComplete = 0;
let celebrationParticles = [];
let celebrationTimer = 0;

// Grid settings
const CELL_SIZE = 70;
const GRID_COLS = 10;
const GRID_ROWS = 10;

// Truck types with emojis
const truckTypes = [
    { id: 'pizza', emoji: '🍕', truckEmoji: '🚚', color: '#FF5722', name: 'Pizza' },
    { id: 'package', emoji: '📦', truckEmoji: '🚛', color: '#795548', name: 'Package' },
    { id: 'flowers', emoji: '💐', truckEmoji: '🚐', color: '#E91E63', name: 'Flower' },
    { id: 'garbage', emoji: '🗑️', truckEmoji: '🚛', color: '#607D8B', name: 'Garbage' }
];

// Trucks
let trucks = [];

// Delivery locations
let deliveryLocations = [];

// Race car (AI controlled)
const raceCar = {
    x: 0,
    y: 0,
    pathIndex: 0,
    speed: 3,
    path: []
};

// City maze layout (0 = road, 1 = building)
const maze = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Generate race car path (all road cells in a loop)
function generateRaceCarPath() {
    raceCar.path = [];
    // Create a simple loop around the perimeter
    const pathPoints = [
        {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, 
        {x: 5, y: 0}, {x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0}, {x: 9, y: 0},
        {x: 9, y: 2}, {x: 9, y: 4}, {x: 9, y: 6}, {x: 9, y: 8}, {x: 9, y: 9},
        {x: 8, y: 9}, {x: 7, y: 9}, {x: 6, y: 9}, {x: 5, y: 9}, {x: 4, y: 9},
        {x: 3, y: 9}, {x: 2, y: 9}, {x: 1, y: 9}, {x: 0, y: 9},
        {x: 0, y: 8}, {x: 0, y: 6}, {x: 0, y: 4}, {x: 0, y: 2}
    ];
    raceCar.path = pathPoints;
    if (raceCar.path.length > 0) {
        raceCar.x = raceCar.path[0].x * CELL_SIZE + CELL_SIZE / 2;
        raceCar.y = raceCar.path[0].y * CELL_SIZE + CELL_SIZE / 2;
    }
}

// Initialize game
function initGame() {
    trucks = [];
    deliveryLocations = [];
    deliveriesComplete = 0;
    selectedTruck = null;
    gameState = 'selecting';
    
    // Place trucks at starting positions (left side)
    const truckStartPositions = [
        {gridX: 0, gridY: 2},
        {gridX: 0, gridY: 4},
        {gridX: 0, gridY: 6},
        {gridX: 0, gridY: 8}
    ];
    
    // Place delivery locations (right side or scattered)
    const deliveryPositions = [
        {gridX: 9, gridY: 2},
        {gridX: 9, gridY: 4},
        {gridX: 9, gridY: 6},
        {gridX: 5, gridY: 9} // Garbage dump at bottom
    ];
    
    truckTypes.forEach((type, i) => {
        const startPos = truckStartPositions[i];
        trucks.push({
            ...type,
            gridX: startPos.gridX,
            gridY: startPos.gridY,
            x: startPos.gridX * CELL_SIZE,
            y: startPos.gridY * CELL_SIZE,
            targetX: startPos.gridX * CELL_SIZE,
            targetY: startPos.gridY * CELL_SIZE,
            moving: false,
            delivered: false,
            direction: 'right',
            doorsOpen: false
        });
        
        const deliveryPos = deliveryPositions[i];
        deliveryLocations.push({
            id: type.id,
            emoji: type.emoji,
            gridX: deliveryPos.gridX,
            gridY: deliveryPos.gridY,
            delivered: false
        });
    });
    
    generateRaceCarPath();
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameState !== 'driving' || !selectedTruck) return;
    if (selectedTruck.moving) return;
    
    let newX = selectedTruck.gridX;
    let newY = selectedTruck.gridY;
    let direction = selectedTruck.direction;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            newY--;
            direction = 'up';
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            newY++;
            direction = 'down';
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            newX--;
            direction = 'left';
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            newX++;
            direction = 'right';
            e.preventDefault();
            break;
    }
    
    // Check valid move
    if (newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS) {
        if (maze[newY][newX] === 0) {
            selectedTruck.direction = direction;
            selectedTruck.gridX = newX;
            selectedTruck.gridY = newY;
            selectedTruck.targetX = newX * CELL_SIZE;
            selectedTruck.targetY = newY * CELL_SIZE;
            selectedTruck.moving = true;
        }
    }
});

// Handle mouse/touch input
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (gameState === 'selecting' || gameState === 'driving') {
        // Check if clicked on a truck
        trucks.forEach(truck => {
            if (!truck.delivered) {
                const truckCenterX = truck.x + CELL_SIZE / 2;
                const truckCenterY = truck.y + CELL_SIZE / 2;
                const dist = Math.sqrt((x - truckCenterX) ** 2 + (y - truckCenterY) ** 2);
                
                if (dist < CELL_SIZE / 2) {
                    selectedTruck = truck;
                    gameState = 'driving';
                }
            }
        });
        
        // If driving and clicked on adjacent cell, move there
        if (gameState === 'driving' && selectedTruck && !selectedTruck.moving) {
            const clickGridX = Math.floor(x / CELL_SIZE);
            const clickGridY = Math.floor(y / CELL_SIZE);
            
            const dx = clickGridX - selectedTruck.gridX;
            const dy = clickGridY - selectedTruck.gridY;
            
            // Only allow adjacent moves
            if (Math.abs(dx) + Math.abs(dy) === 1) {
                if (clickGridX >= 0 && clickGridX < GRID_COLS && 
                    clickGridY >= 0 && clickGridY < GRID_ROWS &&
                    maze[clickGridY][clickGridX] === 0) {
                    
                    if (dx > 0) selectedTruck.direction = 'right';
                    else if (dx < 0) selectedTruck.direction = 'left';
                    else if (dy > 0) selectedTruck.direction = 'down';
                    else if (dy < 0) selectedTruck.direction = 'up';
                    
                    selectedTruck.gridX = clickGridX;
                    selectedTruck.gridY = clickGridY;
                    selectedTruck.targetX = clickGridX * CELL_SIZE;
                    selectedTruck.targetY = clickGridY * CELL_SIZE;
                    selectedTruck.moving = true;
                }
            }
        }
    }
    
    // Check for complete screen restart
    if (gameState === 'complete') {
        initGame();
    }
});

// Start celebration
function startDeliveryCelebration(truck, location) {
    gameState = 'delivering';
    celebrationParticles = [];
    celebrationTimer = 90;
    truck.doorsOpen = true;
    
    const centerX = location.gridX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = location.gridY * CELL_SIZE + CELL_SIZE / 2;
    
    for (let i = 0; i < 30; i++) {
        celebrationParticles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            size: Math.random() * 12 + 8,
            emoji: ['⭐', '✨', '🎉', '💫', truck.emoji][Math.floor(Math.random() * 5)],
            life: 1,
            rotation: Math.random() * Math.PI * 2
        });
    }
    
    // Play sound (simple beep using Web Audio)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        // Audio not supported
    }
}

// Update celebration
function updateCelebration() {
    celebrationTimer--;
    
    celebrationParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.015;
        p.rotation += 0.1;
    });
    
    celebrationParticles = celebrationParticles.filter(p => p.life > 0);
    
    if (celebrationTimer <= 0) {
        if (selectedTruck) {
            selectedTruck.delivered = true;
            selectedTruck.doorsOpen = false;
            deliveriesComplete++;
            
            // Mark delivery location as delivered
            deliveryLocations.forEach(loc => {
                if (loc.id === selectedTruck.id) {
                    loc.delivered = true;
                }
            });
        }
        
        selectedTruck = null;
        
        if (deliveriesComplete >= trucks.length) {
            gameState = 'complete';
        } else {
            gameState = 'selecting';
        }
    }
}

// Update race car
function updateRaceCar() {
    if (raceCar.path.length === 0) return;
    
    const target = raceCar.path[raceCar.pathIndex];
    const targetX = target.x * CELL_SIZE + CELL_SIZE / 2;
    const targetY = target.y * CELL_SIZE + CELL_SIZE / 2;
    
    const dx = targetX - raceCar.x;
    const dy = targetY - raceCar.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < raceCar.speed) {
        raceCar.pathIndex = (raceCar.pathIndex + 1) % raceCar.path.length;
    } else {
        raceCar.x += (dx / dist) * raceCar.speed;
        raceCar.y += (dy / dist) * raceCar.speed;
    }
}

// Update trucks
function updateTrucks() {
    trucks.forEach(truck => {
        if (truck.moving) {
            const dx = truck.targetX - truck.x;
            const dy = truck.targetY - truck.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 6;
            
            if (dist < speed) {
                truck.x = truck.targetX;
                truck.y = truck.targetY;
                truck.moving = false;
                
                // Check if reached delivery location
                if (truck === selectedTruck) {
                    deliveryLocations.forEach(loc => {
                        if (loc.id === truck.id && 
                            truck.gridX === loc.gridX && 
                            truck.gridY === loc.gridY &&
                            !loc.delivered) {
                            startDeliveryCelebration(truck, loc);
                        }
                    });
                }
            } else {
                truck.x += (dx / dist) * speed;
                truck.y += (dy / dist) * speed;
            }
        }
    });
}

// Draw functions
function drawRoads() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            if (maze[row][col] === 0) {
                // Road
                ctx.fillStyle = '#546E7A';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                
                // Road markings
                ctx.fillStyle = '#FFD54F';
                ctx.fillRect(x + CELL_SIZE/2 - 2, y + 5, 4, CELL_SIZE - 10);
                ctx.fillRect(x + 5, y + CELL_SIZE/2 - 2, CELL_SIZE - 10, 4);
            } else {
                // Building
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                
                // Windows
                ctx.fillStyle = '#FFF59D';
                ctx.fillRect(x + 10, y + 15, 12, 12);
                ctx.fillRect(x + 48, y + 15, 12, 12);
                ctx.fillRect(x + 10, y + 42, 12, 12);
                ctx.fillRect(x + 48, y + 42, 12, 12);
            }
        }
    }
}

function drawDeliveryLocations() {
    deliveryLocations.forEach(loc => {
        const x = loc.gridX * CELL_SIZE;
        const y = loc.gridY * CELL_SIZE;
        
        // Delivery zone highlight
        ctx.fillStyle = loc.delivered ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 235, 59, 0.5)';
        ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        
        // Border
        ctx.strokeStyle = loc.delivered ? '#4CAF50' : '#FFC107';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        
        // Emoji
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(loc.emoji, x + CELL_SIZE/2, y + CELL_SIZE/2);
        
        if (loc.delivered) {
            ctx.fillText('✅', x + CELL_SIZE - 15, y + 15);
        }
    });
}

function drawTruck(truck) {
    ctx.save();
    ctx.translate(truck.x + CELL_SIZE/2, truck.y + CELL_SIZE/2);
    
    // Rotate based on direction
    switch(truck.direction) {
        case 'up': ctx.rotate(-Math.PI/2); break;
        case 'down': ctx.rotate(Math.PI/2); break;
        case 'left': ctx.rotate(Math.PI); break;
    }
    
    // Truck body
    ctx.fillStyle = truck.delivered ? '#9E9E9E' : truck.color;
    ctx.fillRect(-25, -18, 50, 36);
    
    // Cabin
    ctx.fillStyle = truck.delivered ? '#757575' : (truck.color === '#607D8B' ? '#455A64' : '#333');
    ctx.fillRect(15, -15, 12, 30);
    
    // Windshield
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(18, -12, 8, 24);
    
    // Cargo area with emoji
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-22, -15, 35, 30);
    
    // Truck emoji on side
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(truck.emoji, -5, 0);
    
    // Doors (open when delivering)
    if (truck.doorsOpen) {
        ctx.fillStyle = '#DDD';
        ctx.fillRect(-25, -20, 10, 15);
        ctx.fillRect(-25, 5, 10, 15);
    }
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.fillRect(-18, -22, 12, 6);
    ctx.fillRect(-18, 16, 12, 6);
    ctx.fillRect(10, -22, 12, 6);
    ctx.fillRect(10, 16, 12, 6);
    
    ctx.restore();
    
    // Selection indicator
    if (truck === selectedTruck && !truck.delivered) {
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(truck.x + 5, truck.y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        ctx.setLineDash([]);
    }
}

function drawRaceCar() {
    ctx.save();
    ctx.translate(raceCar.x, raceCar.y);
    
    // Calculate rotation based on movement
    const nextIndex = (raceCar.pathIndex + 1) % raceCar.path.length;
    const next = raceCar.path[nextIndex];
    const dx = next.x * CELL_SIZE + CELL_SIZE/2 - raceCar.x;
    const dy = next.y * CELL_SIZE + CELL_SIZE/2 - raceCar.y;
    const angle = Math.atan2(dy, dx);
    ctx.rotate(angle);
    
    // Race car body
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Racing stripe
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-15, -2, 30, 4);
    
    // Cockpit
    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.fillRect(-15, -15, 8, 5);
    ctx.fillRect(-15, 10, 8, 5);
    ctx.fillRect(7, -15, 8, 5);
    ctx.fillRect(7, 10, 8, 5);
    
    ctx.restore();
    
    // Racing emoji indicator
    ctx.font = '16px Arial';
    ctx.fillText('🏎️', raceCar.x - 8, raceCar.y - 25);
}

function drawCelebration() {
    celebrationParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
    });
}

function drawUI() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`🚚 Deliveries: ${deliveriesComplete}/${trucks.length}`, 15, 33);
    
    // Instructions
    ctx.textAlign = 'right';
    if (gameState === 'selecting') {
        ctx.fillStyle = '#FFEB3B';
        ctx.fillText('Click a truck to start delivering!', canvas.width - 15, 33);
    } else if (gameState === 'driving') {
        ctx.fillStyle = '#4CAF50';
        ctx.fillText('Arrow keys or click to drive!', canvas.width - 15, 33);
    }
    
    // Truck indicators at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    
    trucks.forEach((truck, i) => {
        const indicatorX = 30 + i * 170;
        const indicatorY = canvas.height - 35;
        
        ctx.fillStyle = truck.delivered ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(indicatorX - 20, indicatorY - 22, 150, 44, 10);
        ctx.fill();
        
        ctx.font = '28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(truck.emoji, indicatorX, indicatorY + 8);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText(truck.delivered ? '✅ Done!' : `→ ${truck.emoji}`, indicatorX + 40, indicatorY + 5);
    });
}

function drawCompleteScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ALL DELIVERED! 🎉', canvas.width/2, 200);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '28px Arial';
    ctx.fillText('Great job delivering everything!', canvas.width/2, 280);
    
    // Show all trucks
    ctx.font = '48px Arial';
    trucks.forEach((truck, i) => {
        ctx.fillText(truck.emoji + ' ✅', 200 + i * 100, 380);
    });
    
    ctx.fillStyle = '#FFEB3B';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Click anywhere to play again!', canvas.width/2, 500);
}

// Main game loop
function gameLoop() {
    // Clear
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawRoads();
    drawDeliveryLocations();
    
    // Update and draw race car
    updateRaceCar();
    drawRaceCar();
    
    // Update and draw trucks
    updateTrucks();
    trucks.forEach(truck => {
        if (!truck.delivered) {
            drawTruck(truck);
        }
    });
    
    // Handle celebration
    if (gameState === 'delivering') {
        updateCelebration();
        drawCelebration();
    }
    
    // Draw UI
    drawUI();
    
    // Complete screen
    if (gameState === 'complete') {
        drawCompleteScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize and start
initGame();
gameLoop();
