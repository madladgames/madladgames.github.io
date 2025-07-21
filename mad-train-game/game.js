// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('trainHighScore') || 0;
highScoreElement.textContent = highScore;

// Train properties
const train = {
    x: 100,
    y: 200,
    width: 80,
    height: 40,
    speed: 3,
    targetY: 200,
    cars: [] // Array to store train cars following the locomotive
};

// Game elements
let trainCars = []; // Collectible train cars
let obstacles = [];
let gameTimer = 0;

// Track properties
const tracks = [
    { y: 150, active: true },
    { y: 200, active: true },
    { y: 250, active: true }
];

// Input handling
const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Draw functions
function drawTracks() {
    // Draw railroad tracks
    tracks.forEach(track => {
        if (!track.active) return;
        
        // Draw rails
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, track.y - 15, canvas.width, 6);
        ctx.fillRect(0, track.y + 15, canvas.width, 6);
        
        // Draw railroad ties
        ctx.fillStyle = '#654321';
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.fillRect(x, track.y - 20, 30, 40);
        }
        
        // Draw rail metal
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, track.y - 12, canvas.width, 3);
        ctx.fillRect(0, track.y + 12, canvas.width, 3);
    });
}

function drawTrain() {
    // Draw locomotive
    drawLocomotive(train.x, train.y);
    
    // Draw attached train cars
    train.cars.forEach((car, index) => {
        const carX = train.x - (index + 1) * 90;
        drawTrainCar(carX, car.y, car.type, car.color);
    });
}

function drawLocomotive(x, y) {
    // Main locomotive body
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(x, y - 15, 80, 30);
    
    // Locomotive cab
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(x + 50, y - 25, 30, 20);
    
    // Locomotive front
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(x + 70, y - 10, 15, 20);
    
    // Smokestack
    ctx.fillStyle = '#374151';
    ctx.fillRect(x + 20, y - 35, 8, 20);
    
    // Smoke
    if (gameRunning) {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x + 24 + i * 10, y - 40 - i * 8, 4 + i * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 55, y - 20, 10, 8);
    ctx.fillRect(x + 68, y - 20, 8, 8);
    
    // Wheels
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(x + 15, y + 15, 12, 0, Math.PI * 2);
    ctx.arc(x + 45, y + 15, 12, 0, Math.PI * 2);
    ctx.arc(x + 70, y + 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel details
    ctx.fillStyle = '#6B7280';
    ctx.beginPath();
    ctx.arc(x + 15, y + 15, 6, 0, Math.PI * 2);
    ctx.arc(x + 45, y + 15, 6, 0, Math.PI * 2);
    ctx.arc(x + 70, y + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlight
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(x + 85, y, 6, 0, Math.PI * 2);
    ctx.fill();
}

function drawTrainCar(x, y, type, color) {
    if (x < -100) return; // Don't draw cars that are off screen
    
    // Main car body
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 12, 70, 24);
    
    // Car details based on type
    switch(type) {
        case 'passenger':
            // Windows
            ctx.fillStyle = '#87CEEB';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 5 + i * 15, y - 8, 10, 6);
            }
            break;
        case 'freight':
            // Cargo doors
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 10, y - 10, 50, 20);
            break;
        case 'tank':
            // Tank car (cylindrical)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x + 35, y, 35, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    
    // Wheels
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(x + 15, y + 12, 8, 0, Math.PI * 2);
    ctx.arc(x + 55, y + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel details
    ctx.fillStyle = '#6B7280';
    ctx.beginPath();
    ctx.arc(x + 15, y + 12, 4, 0, Math.PI * 2);
    ctx.arc(x + 55, y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Coupling
    ctx.fillStyle = '#374151';
    ctx.fillRect(x - 5, y - 2, 10, 4);
    ctx.fillRect(x + 70, y - 2, 10, 4);
}

function drawCollectibleCar(car) {
    // Glowing effect for collectible cars
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 10;
    
    drawTrainCar(car.x, car.y, car.type, car.color);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add sparkle effect
    if (gameTimer % 20 < 10) {
        ctx.fillStyle = '#FBBF24';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✨', car.x + 35, car.y - 20);
    }
}

function drawObstacle(obstacle) {
    switch(obstacle.type) {
        case 'rock':
            ctx.fillStyle = '#6B7280';
            ctx.beginPath();
            ctx.ellipse(obstacle.x, obstacle.y, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#4B5563';
            ctx.beginPath();
            ctx.ellipse(obstacle.x - 5, obstacle.y - 5, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'signal':
            // Signal post
            ctx.fillStyle = '#374151';
            ctx.fillRect(obstacle.x - 3, obstacle.y - 40, 6, 60);
            
            // Signal lights
            const lightColor = gameTimer % 60 < 30 ? '#EF4444' : '#10B981';
            ctx.fillStyle = lightColor;
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y - 30, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

// Game mechanics
function updateTrain() {
    // Handle input for train movement between tracks
    let targetTrack = -1;
    
    if (keys.up && train.targetY > 150) {
        targetTrack = tracks.findIndex(track => track.y < train.targetY && track.active);
        if (targetTrack !== -1) {
            train.targetY = tracks[targetTrack].y;
        }
    }
    if (keys.down && train.targetY < 250) {
        targetTrack = tracks.findIndex(track => track.y > train.targetY && track.active);
        if (targetTrack !== -1) {
            train.targetY = tracks[targetTrack].y;
        }
    }
    
    // Smooth movement between tracks
    train.y += (train.targetY - train.y) * 0.1;
    
    // Update train car positions
    train.cars.forEach((car, index) => {
        // Cars follow the locomotive with a delay
        const targetY = train.y;
        car.y += (targetY - car.y) * 0.08;
    });
}

function createCollectibleCar() {
    const carTypes = ['passenger', 'freight', 'tank'];
    const carColors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    
    const availableTracks = tracks.filter(track => track.active);
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    
    trainCars.push({
        x: canvas.width + 50,
        y: randomTrack.y,
        width: 70,
        height: 24,
        speed: 2,
        type: carTypes[Math.floor(Math.random() * carTypes.length)],
        color: carColors[Math.floor(Math.random() * carColors.length)],
        collected: false
    });
}

function createObstacle() {
    const obstacleTypes = ['rock', 'signal'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    const availableTracks = tracks.filter(track => track.active);
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    
    obstacles.push({
        x: canvas.width + 30,
        y: randomTrack.y,
        width: type === 'rock' ? 40 : 20,
        height: type === 'rock' ? 30 : 60,
        speed: 2,
        type: type
    });
}

function updateCollectibleCars() {
    trainCars = trainCars.filter(car => {
        car.x -= car.speed;
        
        // Check collision with locomotive
        if (!car.collected &&
            car.x < train.x + train.width &&
            car.x + car.width > train.x &&
            Math.abs(car.y - train.y) < 30) {
            
            car.collected = true;
            score += 1;
            scoreElement.textContent = score;
            
            // Add car to train
            train.cars.push({
                y: train.y,
                type: car.type,
                color: car.color
            });
            
            return false; // Remove from collectibles
        }
        
        return car.x > -100;
    });
}

function updateObstacles() {
    obstacles = obstacles.filter(obstacle => {
        obstacle.x -= obstacle.speed;
        
        // Check collision with locomotive
        if (obstacle.x < train.x + train.width &&
            obstacle.x + obstacle.width > train.x &&
            Math.abs(obstacle.y - train.y) < 25) {
            gameOver();
            return false;
        }
        
        return obstacle.x > -50;
    });
}

function gameOver() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('trainHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('End of the Line!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Train Cars Collected: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Best Journey: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    
    startButton.textContent = 'Start New Journey';
}

function gameLoop() {
    if (!gameRunning) return;
    
    gameTimer++;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (sky)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw landscape
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    // Draw tracks
    drawTracks();
    
    // Create game elements periodically
    if (gameTimer % 120 === 0) createCollectibleCar();
    if (gameTimer % 200 === 0) createObstacle();
    
    // Update game elements
    updateTrain();
    updateCollectibleCars();
    updateObstacles();
    
    // Draw collectible cars
    trainCars.forEach(car => drawCollectibleCar(car));
    
    // Draw obstacles
    obstacles.forEach(obstacle => drawObstacle(obstacle));
    
    // Draw train
    drawTrain();
    
    // Draw scenery elements
    if (gameTimer % 30 === 0) {
        // Add some trees in background
        ctx.fillStyle = '#16A34A';
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height - 60;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y + 20);
            ctx.lineTo(x + 10, y + 20);
            ctx.closePath();
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
    trainCars = [];
    obstacles = [];
    train.y = 200;
    train.targetY = 200;
    train.cars = [];
    
    // Reset keys
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    
    startButton.textContent = 'Journey in Progress...';
    
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

// Keyboard controls
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
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            keys.right = true;
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
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            keys.right = false;
            break;
    }
});

// Touch controls for mobile
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

// Mouse controls
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

// Draw landscape
ctx.fillStyle = '#22C55E';
ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

drawTracks();
drawTrain();

ctx.fillStyle = '#333';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('All Aboard!', canvas.width / 2, canvas.height / 2 - 50);
ctx.font = '18px Arial';
ctx.fillText('Press Start to Begin Your Train Journey', canvas.width / 2, canvas.height / 2 + 50);
