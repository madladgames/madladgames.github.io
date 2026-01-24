// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speed');
const distanceDisplay = document.getElementById('distance');

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameRunning = true;
let gameOver = false;
let roadOffset = 0;
let roadSpeed = 5;
let distance = 0; // Track distance traveled
let displaySpeed = 0; // Smoothed speed for display
let displayDistance = 0; // Smoothed distance for display

// Obstacles array
let obstacles = [];
let obstacleSpawnTimer = 180; // Start with a longer delay for kids
let obstacleSpawnInterval = 300; // Spawn every 5 seconds at 60fps - much more time for kids

// Car properties
const car = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    baseY: canvas.height - 150, // Store the base Y position
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 30, // Much slower for kids
    acceleration: 0.2,
    deceleration: 0.3,
    lateralSpeed: 3, // Slower steering for better control
    color: '#808080' // Gray color
};

// Road properties
const road = {
    width: 520, // Increased by 30% from 400
    laneWidth: 130, // Increased proportionally
    centerX: canvas.width / 2
};

// Track curve properties
let trackCurve = 0;
let curveDirection = 1;
let curveSpeed = 0.01;

// Obstacle types
const obstacleTypes = {
    rock: {
        width: 30,
        height: 25,
        color: '#696969',
        shape: 'rock'
    },
    cone: {
        width: 25,
        height: 35,
        color: '#FF6600',
        shape: 'cone'
    }
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Handle spacebar restart when game is over
    if (gameOver && e.key === ' ') {
        restartGame();
        e.preventDefault();
        return;
    }
    
    // Prevent default behavior for game control keys to stop page scrolling
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' ||
        key === 'w' || key === 'a' || key === 's' || key === 'd' || key === ' ') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    // Prevent default behavior for game control keys
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' ||
        key === 'w' || key === 'a' || key === 's' || key === 'd' || key === ' ') {
        e.preventDefault();
    }
});

// Restart game function
function restartGame() {
    gameOver = false;
    gameRunning = true;
    distance = 0;
    displayDistance = 0;
    displaySpeed = 0;
    car.speed = 0;
    car.x = canvas.width / 2;
    car.y = car.baseY;
    obstacles = [];
    obstacleSpawnTimer = 180;
    obstacleSpawnInterval = 300;
    roadOffset = 0;
    trackCurve = 0;
    // Don't call gameLoop() here - the existing loop will continue
}

// Draw road with perspective
function drawRoad() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    
    // Draw road segments with perspective - fewer, larger segments for stability
    const segments = 10; // Reduced from 20 for less flashing
    for (let i = segments; i >= 0; i--) {
        const y = canvas.height / 2 + (canvas.height / 2) * (i / segments);
        const perspective = i / segments;
        const segmentWidth = road.width * (0.3 + 0.7 * perspective);
        const centerX = road.centerX + Math.sin(trackCurve + i * 0.2) * 80 * perspective; // Gentler curves
        const segmentHeight = 15; // Larger segments for more solid appearance
        
        // Road surface - larger, more solid segments
        ctx.fillStyle = '#333333';
        ctx.fillRect(centerX - segmentWidth / 2, y, segmentWidth, segmentHeight);
        
        // Road stripes - less frequent changes for stability
        if (Math.floor((roadOffset + i * 20) / 80) % 2 === 0) {
            // White edge lines - thicker and more stable
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(centerX - segmentWidth / 2, y, 15, segmentHeight - 2);
            ctx.fillRect(centerX + segmentWidth / 2 - 15, y, 15, segmentHeight - 2);
            
            // Center dashed line - thicker
            ctx.fillRect(centerX - 8, y, 16, segmentHeight - 2);
        }
        
        // Red and white curbs - less frequent changes
        const curbWidth = 25;
        ctx.fillStyle = Math.floor((roadOffset + i * 20) / 60) % 2 === 0 ? '#FF0000' : '#FFFFFF';
        ctx.fillRect(centerX - segmentWidth / 2 - curbWidth, y, curbWidth, segmentHeight);
        ctx.fillRect(centerX + segmentWidth / 2, y, curbWidth, segmentHeight);
    }
}

// Draw car
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-car.width / 2 - 5, car.height / 2 - 5, car.width + 10, 10);
    
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    
    // Car roof
    ctx.fillStyle = '#606060';
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2 + 15, car.width - 10, car.height - 30);
    
    // Windshield
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(-car.width / 2 + 8, -car.height / 2 + 10, car.width - 16, 15);
    
    // Rear window
    ctx.fillRect(-car.width / 2 + 8, car.height / 2 - 20, car.width - 16, 10);
    
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(-car.width / 2 - 3, -car.height / 2 + 5, 6, 15);
    ctx.fillRect(car.width / 2 - 3, -car.height / 2 + 5, 6, 15);
    ctx.fillRect(-car.width / 2 - 3, car.height / 2 - 20, 6, 15);
    ctx.fillRect(car.width / 2 - 3, car.height / 2 - 20, 6, 15);
    
    // Headlights
    ctx.fillStyle = '#FFFF99';
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2, 8, 5);
    ctx.fillRect(car.width / 2 - 13, -car.height / 2, 8, 5);
    
    // Tail lights
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-car.width / 2 + 5, car.height / 2 - 5, 8, 5);
    ctx.fillRect(car.width / 2 - 13, car.height / 2 - 5, 8, 5);
    
    ctx.restore();
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        
        if (obstacle.type.shape === 'rock') {
            // Draw rock
            ctx.fillStyle = obstacle.type.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, obstacle.type.width / 2, obstacle.type.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some texture
            ctx.fillStyle = '#4A4A4A';
            ctx.beginPath();
            ctx.ellipse(-5, -3, 8, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(4, 2, 6, 5, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type.shape === 'cone') {
            // Draw traffic cone
            ctx.fillStyle = obstacle.type.color;
            ctx.beginPath();
            ctx.moveTo(-obstacle.type.width / 2, obstacle.type.height / 2);
            ctx.lineTo(0, -obstacle.type.height / 2);
            ctx.lineTo(obstacle.type.width / 2, obstacle.type.height / 2);
            ctx.closePath();
            ctx.fill();
            
            // White stripes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-obstacle.type.width / 3, -5, obstacle.type.width * 2 / 3, 4);
            ctx.fillRect(-obstacle.type.width / 4, 5, obstacle.type.width / 2, 4);
            
            // Base
            ctx.fillStyle = '#333333';
            ctx.fillRect(-obstacle.type.width / 2 - 5, obstacle.type.height / 2 - 3, obstacle.type.width + 10, 6);
        }
        
        ctx.restore();
    });
}

// Spawn obstacles
function spawnObstacle() {
    const types = Object.keys(obstacleTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const type = obstacleTypes[randomType];
    
    // Random lane position - adjusted for wider road (130px lanes)
    const lanes = [-130, 0, 130];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    
    obstacles.push({
        x: road.centerX + lane,
        y: canvas.height / 2 - 150, // Spawn much further up the road for kids to see
        type: type,
        speed: 1 // Slower obstacle movement for kids
    });
}

// Check collision
function checkCollision() {
    const carLeft = car.x - car.width / 2;
    const carRight = car.x + car.width / 2;
    const carTop = car.y - car.height / 2;
    const carBottom = car.y + car.height / 2;
    
    for (let obstacle of obstacles) {
        const obstacleLeft = obstacle.x - obstacle.type.width / 2;
        const obstacleRight = obstacle.x + obstacle.type.width / 2;
        const obstacleTop = obstacle.y - obstacle.type.height / 2;
        const obstacleBottom = obstacle.y + obstacle.type.height / 2;
        
        if (carLeft < obstacleRight &&
            carRight > obstacleLeft &&
            carTop < obstacleBottom &&
            carBottom > obstacleTop) {
            return true;
        }
    }
    return false;
}

// Draw game over screen
function drawGameOver() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game over text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
    
    // Congratulations message
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Great Job!', canvas.width / 2, canvas.height / 2 - 30);
    
    // Distance traveled
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px Arial';
    ctx.fillText(`You traveled ${distance.toFixed(1)} miles!`, canvas.width / 2, canvas.height / 2 + 10);
    
    // Restart instruction
    ctx.font = '22px Arial';
    ctx.fillStyle = '#87CEEB';
    ctx.fillText('Press SPACEBAR to play again', canvas.width / 2, canvas.height / 2 + 60);
}

// Update game logic
function update() {
    if (gameOver) return;
    
    // Update track curve
    trackCurve += curveDirection * curveSpeed;
    if (Math.abs(trackCurve) > 1) {
        curveDirection *= -1;
    }
    
    // Handle input - Arrow keys and WASD controls
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        car.x -= car.lateralSpeed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        car.x += car.lateralSpeed;
    }
    
    // Check if car is on road for speed calculation
    const roadLeft = road.centerX - road.width / 2 + Math.sin(trackCurve) * 80;
    const roadRight = road.centerX + road.width / 2 + Math.sin(trackCurve) * 80;
    const isOnRoad = car.x >= roadLeft && car.x <= roadRight;
    
    // Speed control with up/down arrows and W/S keys
    let targetSpeed = 15; // Base speed for kids
    
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        targetSpeed = car.maxSpeed; // Full speed when pressing up/W
        // Move car forward slightly for visual feedback
        car.y = car.baseY - 10;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        targetSpeed = 5; // Slow speed when pressing down/S
        // Move car back slightly for visual feedback
        car.y = car.baseY + 10;
    } else {
        // Return car to normal position
        car.y = car.baseY;
    }
    
    // Reduce speed when off-road
    if (!isOnRoad) {
        targetSpeed = Math.min(targetSpeed, 8); // Much slower off-road
    }
    
    // Gradually adjust speed toward target
    if (car.speed < targetSpeed) {
        car.speed += car.acceleration;
    } else if (car.speed > targetSpeed) {
        car.speed -= car.deceleration;
    }
    
    // Ensure speed doesn't go below minimum or above maximum
    car.speed = Math.max(2, Math.min(car.maxSpeed, car.speed));
    
    // Keep car within canvas bounds (can go off-road but not off-screen)
    car.x = Math.max(50, Math.min(canvas.width - 50, car.x));
    
    // Update road offset for movement effect only when car is moving
    if (car.speed > 0) {
        roadOffset += roadSpeed + car.speed / 20;
        // Update distance traveled (convert speed to miles)
        distance += car.speed / 500; // Convert to miles (much smaller increments)
    }
    
    // Spawn obstacles
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer >= obstacleSpawnInterval) {
        spawnObstacle();
        obstacleSpawnTimer = 0;
        // Gradually increase difficulty
        if (obstacleSpawnInterval > 60) {
            obstacleSpawnInterval -= 0.5;
        }
    }
    
    // Update obstacles - only move when car is moving
    obstacles = obstacles.filter(obstacle => {
        if (car.speed > 0) {
            obstacle.y += obstacle.speed + car.speed / 15;
        }
        return obstacle.y < canvas.height + 50;
    });
    
    // Check collision
    if (checkCollision()) {
        gameOver = true;
        gameRunning = false;
        car.speed = 0;
    }
    
    // Smooth number changes for display
    displaySpeed += (car.speed - displaySpeed) * 0.1;
    displayDistance += (distance - displayDistance) * 0.05;
    
    // Update speed and distance displays with smoothed values
    speedDisplay.textContent = Math.floor(displaySpeed);
    distanceDisplay.textContent = displayDistance.toFixed(1);
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    update();
    
    // Draw everything
    drawRoad();
    drawObstacles();
    drawCar();
    
    // Draw game over screen if needed
    if (gameOver) {
        drawGameOver();
    }
    
    // Continue loop
    if (gameRunning || gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game
gameLoop();
