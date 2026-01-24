// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('carwashHighScore') || 0;
highScoreElement.textContent = highScore;

// Car properties
const car = {
    x: 100,
    y: 200,
    width: 100,
    height: 60,
    velocityY: 0,
    speed: 3,
    color: '#FF6B6B',
    targetY: 200
};

// Game elements
let bubbles = [];
let brushes = [];
let waterDrops = [];
let gameTimer = 0;

// Car wash tunnel elements
let tunnelParts = [];

// Input handling
const keys = {
    up: false,
    down: false
};

// Initialize car wash tunnel
function initTunnel() {
    tunnelParts = [];
    // Create tunnel segments
    for (let i = 0; i < 10; i++) {
        tunnelParts.push({
            x: i * 100,
            topY: 50,
            bottomY: 350,
            height: 300
        });
    }
}

// Draw functions
function drawCar() {
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
    
    // Car roof
    ctx.fillStyle = '#E55555';
    ctx.fillRect(car.x + 15, car.y - 15, 70, 20);
    
    // Car windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(car.x + 20, car.y - 12, 25, 15);
    ctx.fillRect(car.x + 55, car.y - 12, 25, 15);
    
    // Car wheels
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(car.x + 20, car.y + car.height, 12, 0, Math.PI * 2);
    ctx.arc(car.x + 80, car.y + car.height, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel centers
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(car.x + 20, car.y + car.height, 6, 0, Math.PI * 2);
    ctx.arc(car.x + 80, car.y + car.height, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Car details (headlights)
    ctx.fillStyle = '#FFFF99';
    ctx.fillRect(car.x + car.width - 5, car.y + 15, 8, 10);
    ctx.fillRect(car.x + car.width - 5, car.y + 35, 8, 10);
}

function drawTunnel() {
    // Draw car wash tunnel
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(0, 0, canvas.width, 50); // Top
    ctx.fillRect(0, 350, canvas.width, 50); // Bottom
    
    // Tunnel entrance/exit markers
    ctx.fillStyle = '#2D3748';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, 0, 20, 50);
        ctx.fillRect(i, 350, 20, 50);
    }
    
    // Floor
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 320, canvas.width, 30);
    
    // Floor drain lines
    ctx.strokeStyle = '#A0AEC0';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 325);
        ctx.lineTo(i + 40, 325);
        ctx.stroke();
    }
}

function drawBubble(bubble) {
    // Soap bubble with rainbow effect
    const gradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 0,
        bubble.x, bubble.y, bubble.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, bubble.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bubble highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBrush(brush) {
    // Rotating car wash brush
    ctx.save();
    ctx.translate(brush.x, brush.y);
    ctx.rotate(brush.rotation);
    
    // Brush base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-15, -brush.height/2, 30, brush.height);
    
    // Brush bristles
    ctx.strokeStyle = brush.color;
    ctx.lineWidth = 3;
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const x1 = Math.cos(angle) * 15;
        const y1 = Math.sin(angle) * 15;
        const x2 = Math.cos(angle) * 25;
        const y2 = Math.sin(angle) * 25;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawWaterDrop(drop) {
    // Water drop
    ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Drop highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(drop.x - drop.size * 0.3, drop.y - drop.size * 0.3, drop.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Game mechanics
function updateCar() {
    // Handle input for toddler-friendly controls
    if (keys.up && car.y > 60) {
        car.targetY = Math.max(60, car.targetY - car.speed);
    }
    if (keys.down && car.y < 280) {
        car.targetY = Math.min(280, car.targetY + car.speed);
    }
    
    // Smooth movement
    car.y += (car.targetY - car.y) * 0.1;
}

function createBubble() {
    const colors = [
        'rgba(255, 182, 193, 0.6)', // Light pink
        'rgba(173, 216, 230, 0.6)', // Light blue
        'rgba(144, 238, 144, 0.6)', // Light green
        'rgba(255, 255, 224, 0.6)', // Light yellow
        'rgba(221, 160, 221, 0.6)'  // Plum
    ];
    
    bubbles.push({
        x: canvas.width + 20,
        y: Math.random() * 200 + 100,
        radius: Math.random() * 15 + 10,
        speed: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        collected: false
    });
}

function createBrush() {
    const colors = ['#FF69B4', '#00CED1', '#32CD32', '#FFD700'];
    
    brushes.push({
        x: canvas.width + 30,
        y: Math.random() * 200 + 100,
        height: 80,
        speed: 2,
        rotation: 0,
        rotationSpeed: 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function createWaterDrop() {
    waterDrops.push({
        x: Math.random() * canvas.width,
        y: 50,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 3 + 2
    });
}

function updateBubbles() {
    bubbles = bubbles.filter(bubble => {
        bubble.x -= bubble.speed;
        
        // Check collision with car
        const dx = bubble.x - (car.x + car.width/2);
        const dy = bubble.y - (car.y + car.height/2);
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < bubble.radius + 30 && !bubble.collected) {
            bubble.collected = true;
            score += 10;
            scoreElement.textContent = score;
            
            // Create pop effect
            for (let i = 0; i < 5; i++) {
                createWaterDrop();
            }
            
            return false; // Remove bubble
        }
        
        return bubble.x > -50;
    });
}

function updateBrushes() {
    brushes = brushes.filter(brush => {
        brush.x -= brush.speed;
        brush.rotation += brush.rotationSpeed;
        
        // Check collision with car (game over)
        if (brush.x < car.x + car.width &&
            brush.x + 50 > car.x &&
            brush.y - 40 < car.y + car.height &&
            brush.y + 40 > car.y) {
            gameOver();
            return false;
        }
        
        return brush.x > -60;
    });
}

function updateWaterDrops() {
    waterDrops = waterDrops.filter(drop => {
        drop.y += drop.speed;
        return drop.y < canvas.height;
    });
}

function gameOver() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('carwashHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Car Wash Complete!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Bubbles Collected: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Best Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    
    startButton.textContent = 'Wash Again';
}

function gameLoop() {
    if (!gameRunning) return;
    
    gameTimer++;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (car wash tunnel)
    drawTunnel();
    
    // Create game elements periodically
    if (gameTimer % 60 === 0) createBubble();
    if (gameTimer % 180 === 0) createBrush();
    if (gameTimer % 20 === 0) createWaterDrop();
    
    // Update game elements
    updateCar();
    updateBubbles();
    updateBrushes();
    updateWaterDrops();
    
    // Draw water drops (background)
    waterDrops.forEach(drop => drawWaterDrop(drop));
    
    // Draw bubbles
    bubbles.forEach(bubble => drawBubble(bubble));
    
    // Draw brushes
    brushes.forEach(brush => drawBrush(brush));
    
    // Draw car
    drawCar();
    
    // Draw car wash effects
    if (gameTimer % 10 === 0) {
        // Spray effect
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * 50 + 50,
                Math.random() * 3 + 1,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset game state
    gameRunning = true;
    score = 0;
    gameTimer = 0;
    scoreElement.textContent = score;
    bubbles = [];
    brushes = [];
    waterDrops = [];
    car.y = 200;
    car.targetY = 200;
    
    // Reset keys
    keys.up = false;
    keys.down = false;
    
    initTunnel();
    
    startButton.textContent = 'Washing...';
    
    // Focus canvas for keyboard input
    canvas.focus();
    
    gameLoop();
}

// Event listeners
startButton.addEventListener('click', () => {
    startGame();
    document.body.focus();
});

// Make canvas focusable
canvas.tabIndex = 1;

// Keyboard controls (toddler-friendly)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            keys.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            keys.down = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            keys.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            keys.down = false;
            break;
    }
});

// Touch controls for mobile (toddler-friendly)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;
    
    if (touchY < canvas.height / 2) {
        keys.up = true;
        keys.down = false;
    } else {
        keys.down = true;
        keys.up = false;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.up = false;
    keys.down = false;
});

// Mouse controls (toddler-friendly)
canvas.addEventListener('mousedown', (e) => {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    if (mouseY < canvas.height / 2) {
        keys.up = true;
        keys.down = false;
    } else {
        keys.down = true;
        keys.up = false;
    }
});

canvas.addEventListener('mouseup', () => {
    keys.up = false;
    keys.down = false;
});

canvas.addEventListener('mouseleave', () => {
    keys.up = false;
    keys.down = false;
});

// Initial draw
ctx.fillStyle = '#E0F6FF';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawTunnel();

// Draw initial car
drawCar();

ctx.fillStyle = '#333';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Ready for a Car Wash!', canvas.width / 2, canvas.height / 2 - 50);
ctx.font = '18px Arial';
ctx.fillText('Press Start to Begin', canvas.width / 2, canvas.height / 2 + 50);
