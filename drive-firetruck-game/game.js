// Fire Truck City Maze Game
// Drive the fire truck through the city maze to reach the fire station!

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// Canvas dimensions - extra space at bottom for UI
canvas.width = 640;
canvas.height = 700;

// Game board offset
const BOARD_OFFSET_Y = 0;

// Game state
let gameState = 'ready'; // ready, playing, celebrating, won
let level = 1;
let moves = 0;
let bestMoves = localStorage.getItem('firetruckMazeBest') || 999;
let celebrationParticles = [];
let celebrationTimer = 0;

// Grid settings
const CELL_SIZE = 64;
const GRID_COLS = 10;
const GRID_ROWS = 10;

// Fire truck
const truck = {
    gridX: 0,
    gridY: 0,
    x: 0,
    y: 0,
    direction: 'right', // up, down, left, right
    moving: false,
    targetX: 0,
    targetY: 0,
    moveSpeed: 8
};

// Fire station position (top-right corner)
let fireStation = { gridX: 9, gridY: 0 };

// City maze layouts (0 = road, 1 = building)
// Truck starts at bottom-left (row 9), station at top-right (row 0)
const mazes = [
    // Level 1 - Easy (start bottom-left, end top-right)
    [
        [1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ],
    // Level 2 - Medium
    [
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 1, 1, 1, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 1, 0]
    ],
    // Level 3 - Harder
    [
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
    ]
];

let currentMaze = mazes[0];

// Building colors
const buildingColors = ['#5D4037', '#795548', '#6D4C41', '#4E342E', '#3E2723'];

// Generate building details (windows) - pre-generated for consistent look
let buildingDetails = [];

function generateBuildingDetails() {
    buildingDetails = [];
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (currentMaze[row][col] === 1) {
                buildingDetails.push({
                    row, col,
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    windows: Math.floor(Math.random() * 3) + 2,
                    floors: Math.floor(Math.random() * 2) + 2
                });
            }
        }
    }
}

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    if (truck.moving) return;
    
    const key = e.key;
    let newX = truck.gridX;
    let newY = truck.gridY;
    let direction = truck.direction;
    
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        newY--;
        direction = 'up';
        e.preventDefault();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        newY++;
        direction = 'down';
        e.preventDefault();
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        newX--;
        direction = 'left';
        e.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        newX++;
        direction = 'right';
        e.preventDefault();
    }
    
    // Check if move is valid
    if (newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS) {
        if (currentMaze[newY][newX] === 0) {
            truck.direction = direction;
            truck.gridX = newX;
            truck.gridY = newY;
            truck.targetX = newX * CELL_SIZE;
            truck.targetY = newY * CELL_SIZE;
            truck.moving = true;
            moves++;
            updateScore();
        }
    }
});

// Start/Restart button
startButton.addEventListener('click', () => {
    startGame();
});

function startGame() {
    gameState = 'playing';
    level = 1;
    moves = 0;
    currentMaze = mazes[0];
    generateBuildingDetails();
    resetTruck();
    updateScore();
    startButton.textContent = 'Restart';
}

function resetTruck() {
    // Start at bottom-left (row 9, col 0)
    truck.gridX = 0;
    truck.gridY = 9;
    truck.x = 0;
    truck.y = 9 * CELL_SIZE;
    truck.targetX = 0;
    truck.targetY = 9 * CELL_SIZE;
    truck.direction = 'up';
    truck.moving = false;
}

function startCelebration() {
    gameState = 'celebrating';
    celebrationParticles = [];
    celebrationTimer = 120; // 2 seconds at 60fps
    
    // Create lots of particles
    const stationX = fireStation.gridX * CELL_SIZE + CELL_SIZE / 2;
    const stationY = fireStation.gridY * CELL_SIZE + CELL_SIZE / 2;
    
    for (let i = 0; i < 50; i++) {
        celebrationParticles.push({
            x: stationX,
            y: stationY,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15 - 5,
            size: Math.random() * 15 + 10,
            color: ['#FF5722', '#FFEB3B', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'][Math.floor(Math.random() * 6)],
            emoji: ['🎉', '⭐', '✨', '🚒', '🔥', '💫', '🎊'][Math.floor(Math.random() * 7)],
            life: 1,
            rotation: Math.random() * Math.PI * 2
        });
    }
}

function updateCelebration() {
    celebrationTimer--;
    
    celebrationParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life -= 0.01;
        p.rotation += 0.1;
    });
    
    celebrationParticles = celebrationParticles.filter(p => p.life > 0);
    
    if (celebrationTimer <= 0) {
        nextLevel();
    }
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
    
    // Draw "LEVEL COMPLETE!" text
    if (celebrationTimer > 60) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(canvas.width/2 - 180, canvas.height/2 - 50, 360, 100, 20);
        ctx.fill();
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 LEVEL COMPLETE! 🎉', canvas.width/2, canvas.height/2);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText(`Level ${level} cleared!`, canvas.width/2, canvas.height/2 + 35);
    }
}

function nextLevel() {
    level++;
    if (level > mazes.length) {
        // Player wins!
        gameState = 'won';
        if (moves < bestMoves) {
            bestMoves = moves;
            localStorage.setItem('firetruckMazeBest', bestMoves);
        }
    } else {
        currentMaze = mazes[level - 1];
        generateBuildingDetails();
        resetTruck();
        gameState = 'playing';
    }
}

function updateScore() {
    if (scoreDisplay) scoreDisplay.textContent = moves;
    if (highScoreDisplay) highScoreDisplay.textContent = bestMoves < 999 ? bestMoves : '-';
}

// Draw functions
function drawRoads() {
    // Draw all road tiles
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (currentMaze[row][col] === 0) {
                const x = col * CELL_SIZE;
                const y = row * CELL_SIZE;
                
                // Road base
                ctx.fillStyle = '#607D8B';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                
                // Road markings (yellow dashed lines)
                ctx.fillStyle = '#FFC107';
                
                // Check adjacent cells for road connections
                const hasUp = row > 0 && currentMaze[row-1][col] === 0;
                const hasDown = row < GRID_ROWS-1 && currentMaze[row+1][col] === 0;
                const hasLeft = col > 0 && currentMaze[row][col-1] === 0;
                const hasRight = col < GRID_COLS-1 && currentMaze[row][col+1] === 0;
                
                // Draw center dots for intersections
                if ((hasUp || hasDown) && (hasLeft || hasRight)) {
                    ctx.fillRect(x + CELL_SIZE/2 - 3, y + CELL_SIZE/2 - 3, 6, 6);
                }
                
                // Horizontal line
                if (hasLeft || hasRight) {
                    ctx.fillRect(x + 5, y + CELL_SIZE/2 - 1, CELL_SIZE - 10, 2);
                }
                
                // Vertical line
                if (hasUp || hasDown) {
                    ctx.fillRect(x + CELL_SIZE/2 - 1, y + 5, 2, CELL_SIZE - 10);
                }
            }
        }
    }
}

function drawBuildings() {
    buildingDetails.forEach(building => {
        const x = building.col * CELL_SIZE;
        const y = building.row * CELL_SIZE;
        
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 4, y + 4, CELL_SIZE - 4, CELL_SIZE - 4);
        
        // Building main
        ctx.fillStyle = building.color;
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 6, CELL_SIZE - 6);
        
        // Roof
        ctx.fillStyle = '#37474F';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 6, 8);
        
        // Windows - smaller and properly contained within building
        ctx.fillStyle = '#FFF59D';
        const windowSize = 6;
        const windowGapX = 8;
        const windowGapY = 8;
        const startX = x + 8;
        const startY = y + 14;
        const maxWindows = 3;
        const maxFloors = 3;
        
        // Draw windows in a 3x3 grid that fits within the building
        for (let floor = 0; floor < Math.min(building.floors, maxFloors); floor++) {
            for (let win = 0; win < Math.min(building.windows, maxWindows); win++) {
                const winX = startX + win * (windowSize + windowGapX);
                const winY = startY + floor * (windowSize + windowGapY);
                // Only draw if window is within building bounds
                if (winX + windowSize < x + CELL_SIZE - 4 && winY + windowSize < y + CELL_SIZE - 4) {
                    ctx.fillRect(winX, winY, windowSize, windowSize);
                }
            }
        }
    });
}

function drawFireStation() {
    const x = fireStation.gridX * CELL_SIZE;
    const y = fireStation.gridY * CELL_SIZE;
    
    // Station shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 4, CELL_SIZE - 4);
    
    // Station building
    ctx.fillStyle = '#C62828';
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    
    // Garage door
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(x + 10, y + 25, CELL_SIZE - 20, CELL_SIZE - 28);
    
    // Door lines
    ctx.strokeStyle = '#BDBDBD';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 25 + i * 8);
        ctx.lineTo(x + CELL_SIZE - 10, y + 25 + i * 8);
        ctx.stroke();
    }
    
    // Sign
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 8, y + 5, CELL_SIZE - 16, 16);
    
    // Station icon
    ctx.fillStyle = '#C62828';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚒', x + CELL_SIZE/2, y + 17);
    
    // Flashing light effect
    const flash = Math.sin(Date.now() / 200) > 0;
    ctx.fillStyle = flash ? '#FF5722' : '#FFEB3B';
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE/2, y + 5, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawTruck() {
    // Animate truck movement
    if (truck.moving) {
        const dx = truck.targetX - truck.x;
        const dy = truck.targetY - truck.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < truck.moveSpeed) {
            truck.x = truck.targetX;
            truck.y = truck.targetY;
            truck.moving = false;
            
            // Check if reached fire station
            if (truck.gridX === fireStation.gridX && truck.gridY === fireStation.gridY) {
                startCelebration();
            }
        } else {
            truck.x += (dx / dist) * truck.moveSpeed;
            truck.y += (dy / dist) * truck.moveSpeed;
        }
    }
    
    ctx.save();
    ctx.translate(truck.x + CELL_SIZE/2, truck.y + CELL_SIZE/2);
    
    // Rotate based on direction
    switch (truck.direction) {
        case 'up': ctx.rotate(-Math.PI/2); break;
        case 'down': ctx.rotate(Math.PI/2); break;
        case 'left': ctx.rotate(Math.PI); break;
        case 'right': ctx.rotate(0); break;
    }
    
    // Truck shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-22, -12, 44, 28);
    
    // Truck body
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(-25, -15, 50, 30);
    
    // Truck cabin
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(15, -12, 12, 24);
    
    // Windshield
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(20, -9, 6, 18);
    
    // Ladder on top
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(-20, -8, 35, 4);
    ctx.fillRect(-20, 4, 35, 4);
    
    // Ladder rungs
    ctx.fillStyle = '#757575';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-18 + i * 8, -8, 2, 16);
    }
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.fillRect(-18, -18, 10, 6);
    ctx.fillRect(-18, 12, 10, 6);
    ctx.fillRect(8, -18, 10, 6);
    ctx.fillRect(8, 12, 10, 6);
    
    // Emergency lights
    const lightFlash = Math.sin(Date.now() / 100) > 0;
    ctx.fillStyle = lightFlash ? '#F44336' : '#2196F3';
    ctx.fillRect(-10, -12, 8, 5);
    ctx.fillStyle = lightFlash ? '#2196F3' : '#F44336';
    ctx.fillRect(2, -12, 8, 5);
    
    ctx.restore();
}

function drawUI() {
    // UI area at the bottom (below the game board)
    const uiY = GRID_ROWS * CELL_SIZE + 10;
    
    // UI background bar
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, GRID_ROWS * CELL_SIZE, canvas.width, 60);
    
    // Level indicator (bottom left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(15, uiY, 140, 40, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`🏢 Level ${level}/${mazes.length}`, 25, uiY + 28);
    
    // Moves counter (bottom right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 155, uiY, 140, 40, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'right';
    ctx.fillText(`🚒 Moves: ${moves}`, canvas.width - 25, uiY + 28);
    
    // Goal hint in center
    ctx.fillStyle = '#FFEB3B';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Find the 🚒 Station!', canvas.width / 2, uiY + 28);
    
    // Instructions (when ready)
    if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚒 Fire Truck Maze 🏢', canvas.width/2, 150);
        
        ctx.font = '24px Arial';
        ctx.fillText('Drive to the Fire Station!', canvas.width/2, 220);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFEB3B';
        ctx.fillText('Use ARROW KEYS to drive', canvas.width/2, 300);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🏠 Find the 🚒 Station!', canvas.width/2, 380);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('Click START to Play!', canvas.width/2, 480);
    }
    
    // Win screen
    if (gameState === 'won') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 YOU WIN! 🎉', canvas.width/2, 200);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '28px Arial';
        ctx.fillText(`Completed in ${moves} moves!`, canvas.width/2, 280);
        
        if (moves <= bestMoves) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('🏆 NEW BEST SCORE! 🏆', canvas.width/2, 340);
        }
        
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Click RESTART to play again!', canvas.width/2, 420);
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawRoads();
    drawBuildings();
    drawFireStation();
    
    if (gameState === 'playing' || gameState === 'celebrating') {
        drawTruck();
    }
    
    // Handle celebrating state
    if (gameState === 'celebrating') {
        updateCelebration();
        drawCelebration();
    }
    
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

// Initialize
generateBuildingDetails();
updateScore();
gameLoop();
