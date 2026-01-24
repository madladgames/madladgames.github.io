// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('firetruckHighScore') || 0;
let gameSpeed = 2;
let roadOffset = 0;
let frameCount = 0;
let gameOver = false;

// Initialize high score display
highScoreElement.textContent = highScore;

// Obstacles array
const obstacles = [];

// Fire truck object
const fireTruck = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 150,
    width: 60,
    height: 100,
    speed: 5,
    moving: {
        left: false,
        right: false,
        up: false,
        down: false
    }
};

// Road properties
const road = {
    x: canvas.width / 4,
    width: canvas.width / 2,
    laneWidth: 10,
    dashHeight: 40,
    dashGap: 20
};

// Obstacle types
const obstacleTypes = {
    CONE: 'cone',
    POTHOLE: 'pothole',
    BARRICADE: 'barricade'
};

// Draw road
function drawRoad() {
    // Draw road surface
    ctx.fillStyle = '#333333';
    ctx.fillRect(road.x, 0, road.width, canvas.height);
    
    // Draw road edges
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(road.x - 5, 0, 5, canvas.height);
    ctx.fillRect(road.x + road.width, 0, 5, canvas.height);
    
    // Draw center lane markings
    ctx.fillStyle = '#FFFF00';
    const centerX = road.x + road.width / 2 - road.laneWidth / 2;
    
    for (let y = roadOffset; y < canvas.height + road.dashHeight; y += road.dashHeight + road.dashGap) {
        ctx.fillRect(centerX, y - road.dashHeight, road.laneWidth, road.dashHeight);
    }
}

// Create new obstacle
function createObstacle() {
    const types = Object.values(obstacleTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const obstacle = {
        type: type,
        x: 0, // Will be set based on type
        y: -50,
        width: 40,
        height: 40
    };
    
    // Adjust size based on type
    if (type === obstacleTypes.BARRICADE) {
        obstacle.width = 80;
        obstacle.height = 20;
    } else if (type === obstacleTypes.POTHOLE) {
        obstacle.width = 50;
        obstacle.height = 30;
    }
    
    // Calculate random position within road boundaries
    // Make sure the obstacle stays fully within the road
    const minX = road.x + obstacle.width / 2;
    const maxX = road.x + road.width - obstacle.width / 2;
    obstacle.x = minX + Math.random() * (maxX - minX);
    
    obstacles.push(obstacle);
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        
        switch(obstacle.type) {
            case obstacleTypes.CONE:
                // Draw traffic cone
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                ctx.lineTo(obstacle.x - obstacle.width/2, obstacle.y + obstacle.height);
                ctx.lineTo(obstacle.x, obstacle.y);
                ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height);
                ctx.closePath();
                ctx.fill();
                
                // White stripes
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(obstacle.x - obstacle.width/4, obstacle.y + obstacle.height/2);
                ctx.lineTo(obstacle.x + obstacle.width/4, obstacle.y + obstacle.height/2);
                ctx.stroke();
                break;
                
            case obstacleTypes.POTHOLE:
                // Draw pothole
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y + obstacle.height/2, obstacle.width/2, obstacle.height/2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner darker area
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y + obstacle.height/2, obstacle.width/3, obstacle.height/3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case obstacleTypes.BARRICADE:
                // Draw barricade
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y, obstacle.width, obstacle.height);
                
                // White stripes
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 4; i++) {
                    if (i % 2 === 0) {
                        ctx.fillRect(obstacle.x - obstacle.width/2 + i * obstacle.width/4, obstacle.y, obstacle.width/4, obstacle.height);
                    }
                }
                break;
        }
        
        ctx.restore();
    });
}

// Update obstacles
function updateObstacles() {
    // Move obstacles down
    obstacles.forEach((obstacle, index) => {
        obstacle.y += gameSpeed;
        
        // Remove obstacles that are off screen
        if (obstacle.y > canvas.height + 50) {
            obstacles.splice(index, 1);
        }
    });
    
    // Create new obstacles
    if (frameCount % 120 === 0) { // Every 2 seconds
        createObstacle();
    }
}

// Check collision
function checkCollision() {
    for (let obstacle of obstacles) {
        // Simple box collision detection
        if (fireTruck.x < obstacle.x + obstacle.width/2 &&
            fireTruck.x + fireTruck.width > obstacle.x - obstacle.width/2 &&
            fireTruck.y < obstacle.y + obstacle.height &&
            fireTruck.y + fireTruck.height > obstacle.y) {
            gameOver = true;
            return true;
        }
    }
    return false;
}

// Draw fire truck
function drawFireTruck() {
    // Main body (red)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(fireTruck.x, fireTruck.y, fireTruck.width, fireTruck.height);
    
    // Cabin (darker red)
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(fireTruck.x + 5, fireTruck.y + 60, fireTruck.width - 10, 30);
    
    // Windows (light blue)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(fireTruck.x + 10, fireTruck.y + 65, fireTruck.width - 20, 20);
    
    // Ladder (silver)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(fireTruck.x + 15, fireTruck.y + 10, fireTruck.width - 30, 40);
    
    // Ladder details
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(fireTruck.x + 15, fireTruck.y + 15 + i * 10);
        ctx.lineTo(fireTruck.x + fireTruck.width - 15, fireTruck.y + 15 + i * 10);
        ctx.stroke();
    }
    
    // Emergency lights (flashing)
    const lightOn = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.fillStyle = lightOn ? '#FF0000' : '#FFFF00';
    ctx.fillRect(fireTruck.x + 10, fireTruck.y + 5, 15, 8);
    ctx.fillRect(fireTruck.x + fireTruck.width - 25, fireTruck.y + 5, 15, 8);
    
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(fireTruck.x + 5, fireTruck.y + fireTruck.height - 10, 15, 10);
    ctx.fillRect(fireTruck.x + fireTruck.width - 20, fireTruck.y + fireTruck.height - 10, 15, 10);
    ctx.fillRect(fireTruck.x + 5, fireTruck.y + 10, 15, 10);
    ctx.fillRect(fireTruck.x + fireTruck.width - 20, fireTruck.y + 10, 15, 10);
}

// Update fire truck position
function updateFireTruck() {
    // Horizontal movement
    if (fireTruck.moving.left && fireTruck.x > road.x + 10) {
        fireTruck.x -= fireTruck.speed;
    }
    if (fireTruck.moving.right && fireTruck.x < road.x + road.width - fireTruck.width - 10) {
        fireTruck.x += fireTruck.speed;
    }
    
    // Vertical movement
    if (fireTruck.moving.up && fireTruck.y > 50) {
        fireTruck.y -= fireTruck.speed;
    }
    if (fireTruck.moving.down && fireTruck.y < canvas.height - fireTruck.height - 50) {
        fireTruck.y += fireTruck.speed;
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            e.preventDefault();
            fireTruck.moving.left = true;
            break;
        case 'd':
        case 'arrowright':
            e.preventDefault();
            fireTruck.moving.right = true;
            break;
        case 'w':
        case 'arrowup':
            e.preventDefault();
            fireTruck.moving.up = true;
            break;
        case 's':
        case 'arrowdown':
            e.preventDefault();
            fireTruck.moving.down = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            e.preventDefault();
            fireTruck.moving.left = false;
            break;
        case 'd':
        case 'arrowright':
            e.preventDefault();
            fireTruck.moving.right = false;
            break;
        case 'w':
        case 'arrowup':
            e.preventDefault();
            fireTruck.moving.up = false;
            break;
        case 's':
        case 'arrowdown':
            e.preventDefault();
            fireTruck.moving.down = false;
            break;
    }
});

// Update score
function updateScore() {
    score += 1;
    document.getElementById('score').textContent = score;
}

// Draw game over screen
function drawGameOver() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('firetruckHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mission Complete!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    
    startButton.textContent = 'Start New Mission';
}

// Start game function
function startGame() {
    // Reset game state
    gameRunning = true;
    score = 0;
    gameSpeed = 2;
    roadOffset = 0;
    frameCount = 0;
    gameOver = false;
    obstacles.length = 0;
    fireTruck.x = canvas.width / 2 - 30;
    fireTruck.y = canvas.height - 150;
    
    // Reset movement
    fireTruck.moving.left = false;
    fireTruck.moving.right = false;
    fireTruck.moving.up = false;
    fireTruck.moving.down = false;
    
    scoreElement.textContent = score;
    startButton.textContent = 'Mission in Progress...';
    
    // Focus canvas for keyboard input
    canvas.focus();
}

// Game loop
function gameLoop() {
    if (!gameRunning) {
        // Draw static initial state
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        drawFireTruck();
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ready for Emergency Response!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '18px Arial';
        ctx.fillText('Press Start to Begin Mission', canvas.width / 2, canvas.height / 2 + 50);
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear canvas
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!gameOver) {
        // Update road animation
        roadOffset += gameSpeed;
        if (roadOffset > road.dashHeight + road.dashGap) {
            roadOffset = 0;
        }
        
        // Draw game elements
        drawRoad();
        drawObstacles();
        drawFireTruck();
        
        // Update game state
        updateFireTruck();
        updateObstacles();
        
        if (checkCollision()) {
            drawGameOver();
            return;
        }
        
        // Update score every 60 frames (approximately 1 second)
        frameCount++;
        if (frameCount % 60 === 0) {
            score += 1;
            scoreElement.textContent = score;
            // Increase difficulty
            if (score % 10 === 0) {
                gameSpeed = Math.min(gameSpeed + 0.5, 8);
            }
        }
    } else {
        // Draw static game state
        drawRoad();
        drawObstacles();
        drawFireTruck();
        drawGameOver();
    }
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    startGame();
    document.body.focus();
});

// Make canvas focusable
canvas.tabIndex = 1;

// Start the game loop
gameLoop();
