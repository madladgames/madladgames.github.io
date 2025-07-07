// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;

// Car properties
const car = {
    x: 100,
    y: 250,
    width: 120,
    height: 70,
    velocityY: 0,
    jumping: false,
    color: '#C00',  // Red color for car
    wheelColor: '#333'
};

// Game physics
const gravity = 0.684;  // Reduced by 15% total to make jumps last longer
const jumpPower = -15;
const groundY = 300;

// Visual feedback
let jumpAttempted = false;
let jumpAttemptTimer = 0;

// Obstacles
let obstacles = [];
const obstacleSpeed = 5;
let obstacleTimer = 0;
const obstacleInterval = 150;  // Increased interval between obstacles
const obstacleStartDelay = 100;  // Delay before first obstacle

// Background elements
let clouds = [];
let trees = [];

// Initialize background elements
function initBackground() {
    // Create clouds
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100 + 20,
            width: 80,
            height: 40,
            speed: 0.5 + Math.random() * 0.5
        });
    }
    
    // Create trees
    for (let i = 0; i < 5; i++) {
        trees.push({
            x: Math.random() * canvas.width,
            y: groundY - 60,
            width: 40,
            height: 60,
            speed: 2
        });
    }
}

// Draw functions
function drawCar() {
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x + 10, car.y + 20, 100, 40);

    // Car roof
    ctx.fillStyle = '#B22222';
    ctx.beginPath();
    ctx.moveTo(car.x + 30, car.y + 20);
    ctx.lineTo(car.x + 50, car.y);
    ctx.lineTo(car.x + 90, car.y);
    ctx.lineTo(car.x + 100, car.y + 20);
    ctx.closePath();
    ctx.fill();

    // Car window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.moveTo(car.x + 55, car.y + 5);
    ctx.lineTo(car.x + 85, car.y + 5);
    ctx.lineTo(car.x + 95, car.y + 20);
    ctx.lineTo(car.x + 45, car.y + 20);
    ctx.closePath();
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(car.x + 30, car.y + car.height - 5, 15, 0, Math.PI * 2);
    ctx.arc(car.x + 90, car.y + car.height - 5, 15, 0, Math.PI * 2);
    ctx.fill();

    // Wheel hubs
    ctx.fillStyle = '#EEE';
    ctx.beginPath();
    ctx.arc(car.x + 30, car.y + car.height - 5, 6, 0, Math.PI * 2);
    ctx.arc(car.x + 90, car.y + car.height - 5, 6, 0, Math.PI * 2);
    ctx.fill();
}

function drawGround() {
    // Road
    ctx.fillStyle = '#555';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Road lines
    ctx.strokeStyle = '#FFE66D';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 30);
    ctx.lineTo(canvas.width, groundY + 30);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
    ctx.arc(cloud.x + 25, cloud.y, 25, 0, Math.PI * 2);
    ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawTree(tree) {
    // Tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tree.x + 15, tree.y + 30, 10, 30);
    
    // Tree leaves
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(tree.x + 20, tree.y);
    ctx.lineTo(tree.x, tree.y + 40);
    ctx.lineTo(tree.x + 40, tree.y + 40);
    ctx.closePath();
    ctx.fill();
}

function drawObstacle(obstacle) {
    if (obstacle.type === 'cone') {
        // Traffic cone
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 15, obstacle.y);
        ctx.lineTo(obstacle.x, obstacle.y + 30);
        ctx.lineTo(obstacle.x + 30, obstacle.y + 30);
        ctx.closePath();
        ctx.fill();
        
        // Cone stripes
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 5, obstacle.y + 10);
        ctx.lineTo(obstacle.x + 25, obstacle.y + 10);
        ctx.moveTo(obstacle.x + 3, obstacle.y + 20);
        ctx.lineTo(obstacle.x + 27, obstacle.y + 20);
        ctx.stroke();
    } else {
        // Box obstacle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

// Game mechanics
function updateCar() {
    // Update position first
    car.y += car.velocityY;
    
    // Apply gravity
    if (car.y < groundY - car.height) {
        car.velocityY += gravity;
        car.jumping = true;
    } else if (car.velocityY >= 0) {
        // Only clamp to ground if falling or stationary (not jumping up)
        car.y = groundY - car.height;
        car.velocityY = 0;
        car.jumping = false;
    }
}

function jump() {
    console.log('Jump function called! gameRunning:', gameRunning, 'car.jumping:', car.jumping, 'car.y:', car.y, 'groundY:', groundY);
    
    if (gameRunning && !car.jumping) {
        // Just jump without ground check
        car.velocityY = jumpPower;
        car.jumping = true;
        console.log('Jump executed! velocityY:', car.velocityY);
    } else {
        console.log('Jump blocked - gameRunning:', gameRunning, 'car.jumping:', car.jumping);
    }
}

function createObstacle() {
    const types = ['cone', 'box'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    obstacles.push({
        x: canvas.width,
        y: type === 'cone' ? groundY - 30 : groundY - 40,
        width: type === 'cone' ? 30 : 40,
        height: type === 'cone' ? 30 : 40,
        type: type
    });
}

function updateObstacles() {
    // Move obstacles
    obstacles = obstacles.filter(obstacle => {
        obstacle.x -= obstacleSpeed;
        return obstacle.x + obstacle.width > 0;
    });
    
    // Create new obstacles (with initial delay)
    obstacleTimer++;
    if (obstacleTimer >= obstacleStartDelay && (obstacleTimer - obstacleStartDelay) % obstacleInterval === 0) {
        createObstacle();
    }
}

function updateBackground() {
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
    });
    
    // Update trees
    trees.forEach(tree => {
        tree.x -= tree.speed;
        if (tree.x + tree.width < 0) {
            tree.x = canvas.width;
        }
    });
}

function checkCollision() {
    for (let obstacle of obstacles) {
        if (car.x < obstacle.x + obstacle.width &&
            car.x + car.width > obstacle.x &&
            car.y < obstacle.y + obstacle.height &&
            car.y + car.height > obstacle.y) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    
    startButton.textContent = 'Play Again';
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, groundY);
    
    // Draw sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun rays
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = (canvas.width - 100) + Math.cos(angle) * 35;
        const y1 = 60 + Math.sin(angle) * 35;
        const x2 = (canvas.width - 100) + Math.cos(angle) * 45;
        const y2 = 60 + Math.sin(angle) * 45;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Update and draw background
    updateBackground();
    clouds.forEach(cloud => drawCloud(cloud));
    trees.forEach(tree => drawTree(tree));
    
    // Draw ground
    drawGround();
    
    // Update and draw obstacles
    updateObstacles();
    obstacles.forEach(obstacle => drawObstacle(obstacle));
    
    // Update and draw car
    updateCar();
    drawCar();
    
    // Check collision
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Increase score for each obstacle passed
    obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.width < car.x && !obstacle.passed) {
            score += 10;
            scoreElement.textContent = score;
            obstacle.passed = true;
        }
    });
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset game state
    gameRunning = true;
    score = 0;
    scoreElement.textContent = score;
    obstacles = [];
    obstacleTimer = 0;
    car.y = groundY - car.height;
    car.velocityY = 0;
    car.jumping = false;
    jumpAttempted = false;
    jumpAttemptTimer = 0;
    
    console.log('Game started! Car position:', car.y, 'Ground position:', groundY);
    
    // Initialize background if needed
    if (clouds.length === 0) {
        initBackground();
    }
    
    startButton.textContent = 'Game Running...';
    
    // Focus canvas for keyboard input
    canvas.focus();
    
    gameLoop();
}

// Event listeners
startButton.addEventListener('click', () => {
    startGame();
    // Focus the document to ensure keyboard events work
    document.body.focus();
});

// Make canvas focusable
canvas.tabIndex = 1;

// Add comprehensive keyboard event handling
document.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.code, e.key, e.keyCode);
    // Check multiple ways to detect space bar
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32 || e.which === 32) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Space key detected! gameRunning:', gameRunning);
        if (gameRunning) {
            jump();
        } else {
            console.log('Game not running - start the game first!');
        }
        return false;
    }
});

// Add to window as well for better coverage
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32 || e.which === 32) {
        e.preventDefault();
        e.stopPropagation();
        if (gameRunning) {
            jump();
        }
        return false;
    }
}, true);

// Add click on canvas as alternative jump method
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Canvas clicked! gameRunning:', gameRunning);
    if (gameRunning) {
        jump();
    } else {
        console.log('Game not running - start the game first!');
    }
});

// Add touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        jump();
    }
});

// Also handle keyup to prevent any issues
document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
    }
});

// Add roundRect method if not supported
if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Initial draw
ctx.fillStyle = '#E0F6FF';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#333';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Press Start to Begin!', canvas.width / 2, canvas.height / 2);
