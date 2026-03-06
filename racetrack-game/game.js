// Drag Race Game - Side View with Visible Finish Line
// The entire track is visible - toddlers can see exactly where to stop!
// Up arrow = accelerate, Down arrow = brake

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speed');
const distanceDisplay = document.getElementById('distance');

// Canvas dimensions
canvas.width = 800;
canvas.height = 500;

// Game state
let gameState = 'ready'; // ready, countdown, racing, finished
let countdown = 3;
let countdownTimer = 0;
let score = 0;
let bestScore = localStorage.getItem('dragRaceBestScore') || 0;

// Track layout - visible on screen
const track = {
    startX: 80,           // Starting position
    finishZoneStart: 550, // Start of green zone
    finishZoneEnd: 650,   // End of green zone (perfect stop area)
    trackEnd: 720,        // End of track (red zone)
    roadY: 350,           // Y position of road
    roadHeight: 80        // Road height
};

// Car properties - very slow for toddlers
const car = {
    x: track.startX,
    y: track.roadY - 35,
    width: 80,
    height: 45,
    speed: 0,
    maxSpeed: 4,          // Very slow for toddlers
    acceleration: 0.08,   // Gentle acceleration
    brakeForce: 0.15,     // Gentle braking
    friction: 0.02
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Start game on space
    if (gameState === 'ready' && e.key === ' ') {
        startCountdown();
        e.preventDefault();
    }
    
    // Restart on space after finish
    if (gameState === 'finished' && e.key === ' ') {
        resetGame();
        e.preventDefault();
    }
    
    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start countdown
function startCountdown() {
    gameState = 'countdown';
    countdown = 3;
    countdownTimer = 0;
}

// Reset game
function resetGame() {
    gameState = 'ready';
    car.x = track.startX;
    car.speed = 0;
    countdown = 3;
    score = 0;
}

// Calculate score based on stopping position
function calculateScore() {
    if (car.x < track.finishZoneStart) {
        // Stopped before finish zone
        return 0;
    } else if (car.x >= track.finishZoneStart && car.x <= track.finishZoneEnd) {
        // In the finish zone - calculate accuracy
        const zoneCenter = (track.finishZoneStart + track.finishZoneEnd) / 2;
        const distanceFromCenter = Math.abs(car.x - zoneCenter);
        const zoneWidth = track.finishZoneEnd - track.finishZoneStart;
        const accuracy = 1 - (distanceFromCenter / (zoneWidth / 2));
        return Math.floor(accuracy * 1000);
    } else {
        // Overshot
        const overshoot = car.x - track.finishZoneEnd;
        return Math.max(0, 500 - Math.floor(overshoot * 5));
    }
}

// Draw sky
function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, '#64B5F6');
    gradient.addColorStop(1, '#90CAF9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 280);
    
    // Sun
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(700, 70, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    drawCloud(120, 60, 30);
    drawCloud(350, 80, 25);
    drawCloud(550, 50, 35);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

// Draw grass
function drawGrass() {
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 280, canvas.width, track.roadY - 280);
    ctx.fillRect(0, track.roadY + track.roadHeight, canvas.width, canvas.height - track.roadY - track.roadHeight);
    
    // Grass details
    ctx.fillStyle = '#43A047';
    for (let i = 0; i < 20; i++) {
        const x = 30 + i * 40;
        ctx.beginPath();
        ctx.moveTo(x, 310);
        ctx.lineTo(x - 5, 290);
        ctx.lineTo(x + 5, 290);
        ctx.closePath();
        ctx.fill();
    }
}

// Draw the race track
function drawTrack() {
    // Road shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, track.roadY + 5, canvas.width, track.roadHeight);
    
    // Main road
    ctx.fillStyle = '#455A64';
    ctx.fillRect(0, track.roadY, canvas.width, track.roadHeight);
    
    // Road texture lines
    ctx.fillStyle = '#546E7A';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, track.roadY, 2, track.roadHeight);
    }
    
    // Warning zone (yellow) - before finish
    ctx.fillStyle = 'rgba(255, 235, 59, 0.6)';
    ctx.fillRect(track.finishZoneStart - 80, track.roadY, 80, track.roadHeight);
    
    // SLOW DOWN text in yellow zone
    ctx.fillStyle = '#F57F17';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SLOW', track.finishZoneStart - 40, track.roadY + 35);
    ctx.fillText('DOWN!', track.finishZoneStart - 40, track.roadY + 55);
    
    // Finish zone (green) - perfect stop area
    ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
    ctx.fillRect(track.finishZoneStart, track.roadY, track.finishZoneEnd - track.finishZoneStart, track.roadHeight);
    
    // STOP HERE text
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STOP', (track.finishZoneStart + track.finishZoneEnd) / 2, track.roadY + 35);
    ctx.fillText('HERE!', (track.finishZoneStart + track.finishZoneEnd) / 2, track.roadY + 55);
    
    // Overshoot zone (red)
    ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.fillRect(track.finishZoneEnd, track.roadY, track.trackEnd - track.finishZoneEnd, track.roadHeight);
    
    // TOO FAR text
    ctx.fillStyle = '#B71C1C';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('TOO', (track.finishZoneEnd + track.trackEnd) / 2, track.roadY + 35);
    ctx.fillText('FAR!', (track.finishZoneEnd + track.trackEnd) / 2, track.roadY + 55);
    
    // Start line
    ctx.fillStyle = '#FFF';
    ctx.fillRect(track.startX - 10, track.roadY, 8, track.roadHeight);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('START', track.startX, track.roadY - 10);
    
    // Checkered finish line
    const checkerSize = 10;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#FFF';
            ctx.fillRect(track.finishZoneStart - 3 + col * checkerSize, track.roadY + row * checkerSize, checkerSize, checkerSize);
        }
    }
    
    // FINISH text and flag
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 FINISH', track.finishZoneStart + 10, track.roadY - 10);
    
    // Road edge lines
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, track.roadY, canvas.width, 4);
    ctx.fillRect(0, track.roadY + track.roadHeight - 4, canvas.width, 4);
    
    // Center dashed line
    ctx.fillStyle = '#FFD54F';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, track.roadY + track.roadHeight / 2 - 2, 25, 4);
    }
}

// Draw the race car (side view)
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(car.width / 2, car.height + 5, car.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Car body (red)
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.roundRect(0, 15, car.width, 25, 5);
    ctx.fill();
    
    // Car top/cabin
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.moveTo(20, 15);
    ctx.lineTo(30, 0);
    ctx.lineTo(55, 0);
    ctx.lineTo(60, 15);
    ctx.closePath();
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#81D4FA';
    ctx.beginPath();
    ctx.moveTo(25, 15);
    ctx.lineTo(32, 3);
    ctx.lineTo(53, 3);
    ctx.lineTo(57, 15);
    ctx.closePath();
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(18, car.height, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(car.width - 18, car.height, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel rims
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.arc(18, car.height, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(car.width - 18, car.height, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlight
    ctx.fillStyle = '#FFF59D';
    ctx.fillRect(car.width - 5, 22, 8, 10);
    
    // Brake light (bright when braking)
    ctx.fillStyle = keys['ArrowDown'] ? '#FF1744' : '#C62828';
    ctx.fillRect(-3, 22, 6, 10);
    
    // Racing number
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1', 40, 32);
    
    ctx.restore();
}

// Draw speed indicator
function drawSpeedIndicator() {
    const indicatorX = 80;
    const indicatorY = 460;
    const indicatorWidth = 150;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(indicatorX - 60, indicatorY - 25, indicatorWidth + 80, 50, 10);
    ctx.fill();
    
    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED:', indicatorX - 50, indicatorY + 5);
    
    // Speed bar background
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.roundRect(indicatorX + 20, indicatorY - 10, indicatorWidth, 20, 5);
    ctx.fill();
    
    // Speed bar fill
    const speedPercent = car.speed / car.maxSpeed;
    const barColor = speedPercent > 0.7 ? '#FF5722' : '#4CAF50';
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(indicatorX + 20, indicatorY - 10, indicatorWidth * speedPercent, 20, 5);
    ctx.fill();
}

// Draw position indicator  
function drawPositionIndicator() {
    const indicatorX = 350;
    const indicatorY = 460;
    const indicatorWidth = 350;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(indicatorX - 80, indicatorY - 25, indicatorWidth + 100, 50, 10);
    ctx.fill();
    
    // Track mini-map
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(indicatorX, indicatorY - 8, indicatorWidth - 50, 16);
    
    // Mini zones
    const scale = (indicatorWidth - 50) / track.trackEnd;
    
    // Yellow warning
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(indicatorX + (track.finishZoneStart - 80) * scale, indicatorY - 8, 80 * scale, 16);
    
    // Green zone
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(indicatorX + track.finishZoneStart * scale, indicatorY - 8, (track.finishZoneEnd - track.finishZoneStart) * scale, 16);
    
    // Red zone
    ctx.fillStyle = '#F44336';
    ctx.fillRect(indicatorX + track.finishZoneEnd * scale, indicatorY - 8, (track.trackEnd - track.finishZoneEnd) * scale, 16);
    
    // Car position marker
    const carPosX = indicatorX + car.x * scale;
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(carPosX, indicatorY - 15);
    ctx.lineTo(carPosX - 8, indicatorY - 25);
    ctx.lineTo(carPosX + 8, indicatorY - 25);
    ctx.closePath();
    ctx.fill();
    
    // Finish flag
    ctx.font = '16px Arial';
    ctx.fillText('🏁', indicatorX + track.finishZoneStart * scale - 8, indicatorY + 20);
    
    // Labels
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('START', indicatorX - 70, indicatorY + 5);
    ctx.textAlign = 'right';
    ctx.fillText('FINISH →', indicatorX + indicatorWidth + 10, indicatorY + 5);
}

// Draw instructions on screen
function drawInstructions() {
    if (gameState === 'racing') {
        // Control hints
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(15, 15, 180, 60, 10);
        ctx.fill();
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⬆️ = GO FASTER', 25, 40);
        
        ctx.fillStyle = '#F44336';
        ctx.fillText('⬇️ = SLOW DOWN', 25, 62);
    }
}

// Draw countdown
function drawCountdown() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    if (countdown > 0) {
        ctx.fillStyle = countdown === 1 ? '#4CAF50' : '#FFEB3B';
        ctx.font = 'bold 120px Arial';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Get ready...', canvas.width / 2, canvas.height / 2 + 90);
    } else {
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 80px Arial';
        ctx.fillText('GO!', canvas.width / 2, canvas.height / 2 + 30);
    }
}

// Draw ready screen
function drawReadyScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // Title
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('🏎️ DRAG RACE 🏁', canvas.width / 2, 100);
    
    // Instructions
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText('Race to the finish line and STOP in the GREEN zone!', canvas.width / 2, 160);
    
    // Controls box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(200, 190, 400, 120, 15);
    ctx.fill();
    
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('⬆️ UP = Go Faster!', canvas.width / 2, 235);
    
    ctx.fillStyle = '#F44336';
    ctx.fillText('⬇️ DOWN = Slow Down!', canvas.width / 2, 285);
    
    // Zone explanation
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText('🟡 Yellow = Slow down!', canvas.width / 2, 340);
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('🟢 Green = STOP HERE for points!', canvas.width / 2, 375);
    ctx.fillStyle = '#F44336';
    ctx.fillText('🔴 Red = Too far!', canvas.width / 2, 410);
    
    // Best score
    if (bestScore > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`🏆 Best Score: ${bestScore}`, canvas.width / 2, 450);
    }
    
    // Start prompt
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Press SPACE to Start!', canvas.width / 2, 490);
}

// Draw finish screen
function drawFinishScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // Result
    let resultText, resultEmoji, resultColor;
    if (car.x < track.finishZoneStart) {
        resultText = 'Keep going!';
        resultEmoji = '🤔';
        resultColor = '#FF9800';
    } else if (car.x <= track.finishZoneEnd) {
        resultText = 'PERFECT!';
        resultEmoji = '🎉';
        resultColor = '#4CAF50';
    } else {
        resultText = 'Too far!';
        resultEmoji = '😅';
        resultColor = '#FF5722';
    }
    
    ctx.font = '60px Arial';
    ctx.fillText(resultEmoji, canvas.width / 2, 100);
    
    ctx.fillStyle = resultColor;
    ctx.font = 'bold 48px Arial';
    ctx.fillText(resultText, canvas.width / 2, 170);
    
    // Score
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 80px Arial';
    ctx.fillText(`${score}`, canvas.width / 2, 280);
    ctx.font = '28px Arial';
    ctx.fillText('POINTS', canvas.width / 2, 320);
    
    // New best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('dragRaceBestScore', bestScore);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('🏆 NEW BEST! 🏆', canvas.width / 2, 380);
    } else if (bestScore > 0) {
        ctx.fillStyle = '#9E9E9E';
        ctx.font = '20px Arial';
        ctx.fillText(`Best: ${bestScore}`, canvas.width / 2, 380);
    }
    
    // Restart prompt
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Press SPACE to Play Again!', canvas.width / 2, 460);
}

// Update game logic
function update() {
    if (gameState === 'countdown') {
        countdownTimer++;
        if (countdownTimer >= 60) {
            countdownTimer = 0;
            countdown--;
            if (countdown < 0) {
                gameState = 'racing';
            }
        }
        return;
    }
    
    if (gameState !== 'racing') return;
    
    // Handle input
    if (keys['ArrowUp']) {
        car.speed += car.acceleration;
        if (car.speed > car.maxSpeed) car.speed = car.maxSpeed;
    }
    
    if (keys['ArrowDown']) {
        car.speed -= car.brakeForce;
        if (car.speed < 0) car.speed = 0;
    }
    
    // Apply friction when no input
    if (!keys['ArrowUp'] && !keys['ArrowDown']) {
        car.speed -= car.friction;
        if (car.speed < 0) car.speed = 0;
    }
    
    // Update position
    car.x += car.speed;
    
    // Check if stopped or past track end
    if (car.speed === 0 && car.x > track.startX + 20) {
        gameState = 'finished';
        score = calculateScore();
    }
    
    // Force stop at track end
    if (car.x >= track.trackEnd) {
        car.x = track.trackEnd;
        car.speed = 0;
        gameState = 'finished';
        score = calculateScore();
    }
    
    // Update displays
    if (speedDisplay) speedDisplay.textContent = Math.floor(car.speed * 25);
    if (distanceDisplay) distanceDisplay.textContent = Math.floor((car.x - track.startX) / 10);
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scene (always visible)
    drawSky();
    drawGrass();
    drawTrack();
    drawCar();
    drawSpeedIndicator();
    drawPositionIndicator();
    
    // Draw overlays based on game state
    if (gameState === 'ready') {
        drawReadyScreen();
    } else if (gameState === 'countdown') {
        update();
        drawInstructions();
        drawCountdown();
    } else if (gameState === 'racing') {
        update();
        drawInstructions();
    } else if (gameState === 'finished') {
        drawFinishScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
