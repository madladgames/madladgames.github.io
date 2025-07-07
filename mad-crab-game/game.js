// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Crab object
const crab = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 60,
    height: 50,
    speed: 5,
    color: '#FF6B6B',
    eyeSize: 8,
    clawOpen: true,
    walkCycle: 0
};

// Game objects arrays
let pearls = [];
let sharks = [];
let bubbles = [];
let seaweed = [];

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    // Prevent default behavior for game control keys to stop page scrolling
    if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' ||
        key === 'w' || key === 'a' || key === 's' || key === 'd') {
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    
    // Prevent default behavior for game control keys
    if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' ||
        key === 'w' || key === 'a' || key === 's' || key === 'd') {
        e.preventDefault();
    }
});

// Initialize game objects
function initGame() {
    // Create seaweed
    seaweed = [];
    for (let i = 0; i < 8; i++) {
        seaweed.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            height: 50 + Math.random() * 100,
            width: 20,
            sway: 0
        });
    }
    
    // Create initial pearls
    pearls = [];
    for (let i = 0; i < 5 + level * 2; i++) {
        pearls.push(createPearl());
    }
    
    // Create initial sharks
    sharks = [];
    for (let i = 0; i < level; i++) {
        sharks.push(createShark());
    }
    
    // Reset crab position
    crab.x = canvas.width / 2;
    crab.y = canvas.height - 100;
}

// Create pearl object
function createPearl() {
    return {
        x: Math.random() * (canvas.width - 30) + 15,
        y: Math.random() * (canvas.height - 200) + 50,
        radius: 15,
        collected: false,
        glow: 0
    };
}

// Create shark object
function createShark() {
    return {
        x: Math.random() < 0.5 ? -50 : canvas.width + 50,
        y: Math.random() * (canvas.height - 200) + 100,
        width: 80,
        height: 40,
        speed: 1 + Math.random() * 2,
        direction: Math.random() < 0.5 ? 1 : -1,
        finPosition: 0
    };
}

// Create bubble
function createBubble() {
    return {
        x: crab.x + (Math.random() - 0.5) * 30,
        y: crab.y,
        radius: 3 + Math.random() * 5,
        speed: 1 + Math.random() * 2,
        opacity: 0.6
    };
}

// Update game objects
function update() {
    if (!gameRunning || gamePaused) return;
    
    // Update crab position
    if (keys['arrowleft'] || keys['a']) {
        crab.x = Math.max(crab.width/2, crab.x - crab.speed);
    }
    if (keys['arrowright'] || keys['d']) {
        crab.x = Math.min(canvas.width - crab.width/2, crab.x + crab.speed);
    }
    if (keys['arrowup'] || keys['w']) {
        crab.y = Math.max(50, crab.y - crab.speed);
    }
    if (keys['arrowdown'] || keys['s']) {
        crab.y = Math.min(canvas.height - crab.height, crab.y + crab.speed);
    }
    
    // Update crab animation
    crab.walkCycle += 0.1;
    crab.clawOpen = Math.sin(crab.walkCycle * 2) > 0;
    
    // Create occasional bubbles
    if (Math.random() < 0.05) {
        bubbles.push(createBubble());
    }
    
    // Update bubbles
    bubbles = bubbles.filter(bubble => {
        bubble.y -= bubble.speed;
        bubble.x += Math.sin(bubble.y * 0.02) * 0.5;
        bubble.opacity -= 0.005;
        return bubble.y > -10 && bubble.opacity > 0;
    });
    
    // Update pearls
    pearls.forEach(pearl => {
        pearl.glow = (pearl.glow + 0.05) % (Math.PI * 2);
        
        // Check collision with crab
        const dx = crab.x - pearl.x;
        const dy = crab.y - pearl.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pearl.radius + 30 && !pearl.collected) {
            pearl.collected = true;
            score += 10;
            scoreElement.textContent = score;
            
            // Check level progression
            if (pearls.filter(p => !p.collected).length === 0) {
                levelUp();
            }
        }
    });
    
    // Remove collected pearls
    pearls = pearls.filter(pearl => !pearl.collected);
    
    // Update sharks
    sharks.forEach(shark => {
        shark.x += shark.speed * shark.direction;
        shark.finPosition = Math.sin(Date.now() * 0.005) * 10;
        
        // Reverse direction at boundaries
        if (shark.x < -100 || shark.x > canvas.width + 100) {
            shark.direction *= -1;
        }
        
        // Check collision with crab
        if (Math.abs(crab.x - shark.x) < 50 && Math.abs(crab.y - shark.y) < 40) {
            loseLife();
        }
    });
    
    // Update seaweed
    seaweed.forEach(weed => {
        weed.sway = Math.sin(Date.now() * 0.001 + weed.x) * 10;
    });
}

// Draw functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#E6F3FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ocean floor
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // Draw sand texture
    ctx.fillStyle = '#C19A6B';
    for (let i = 0; i < canvas.width; i += 20) {
        for (let j = canvas.height - 30; j < canvas.height; j += 10) {
            if (Math.random() > 0.5) {
                ctx.fillRect(i + Math.random() * 10, j + Math.random() * 5, 2, 2);
            }
        }
    }
    
    // Draw seaweed
    seaweed.forEach(weed => {
        ctx.save();
        ctx.translate(weed.x + weed.sway, weed.y);
        
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(weed.sway, -weed.height/2, weed.sway * 2, -weed.height);
        ctx.quadraticCurveTo(weed.sway * 2 + weed.width, -weed.height, weed.width, 0);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Draw bubbles
    bubbles.forEach(bubble => {
        ctx.save();
        ctx.globalAlpha = bubble.opacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    });
    
    // Draw pearls
    pearls.forEach(pearl => {
        // Pearl glow effect
        const glowSize = 5 + Math.sin(pearl.glow) * 3;
        ctx.save();
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = '#FFD700';
        
        // Pearl shell
        ctx.fillStyle = '#F0E68C';
        ctx.beginPath();
        ctx.arc(pearl.x, pearl.y, pearl.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pearl shine
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(pearl.x - 5, pearl.y - 5, pearl.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Draw sharks
    sharks.forEach(shark => {
        ctx.save();
        ctx.translate(shark.x, shark.y);
        if (shark.direction < 0) {
            ctx.scale(-1, 1);
        }
        
        // Shark body
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.ellipse(0, 0, shark.width/2, shark.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shark fin
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(0, -shark.height/2);
        ctx.lineTo(10, -shark.height/2 - 15 + shark.finPosition);
        ctx.lineTo(20, -shark.height/2);
        ctx.fill();
        
        // Shark tail
        ctx.beginPath();
        ctx.moveTo(-shark.width/2, 0);
        ctx.lineTo(-shark.width/2 - 20, -10);
        ctx.lineTo(-shark.width/2 - 20, 10);
        ctx.fill();
        
        // Shark eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(shark.width/4, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Teeth
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(shark.width/3, 5, 3, 5);
        ctx.fillRect(shark.width/3 + 5, 5, 3, 5);
        
        ctx.restore();
    });
    
    // Draw crab
    drawCrab();
}

function drawCrab() {
    ctx.save();
    ctx.translate(crab.x, crab.y);
    
    // Crab shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, crab.height/2 + 5, crab.width/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Crab legs
    ctx.strokeStyle = '#CC5555';
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 2) {
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            const legAngle = (j - 1) * 0.3 + Math.sin(crab.walkCycle + j) * 0.2;
            ctx.moveTo(i * crab.width/3, 0);
            ctx.lineTo(i * (crab.width/2 + 15), Math.sin(legAngle) * 10);
            ctx.stroke();
        }
    }
    
    // Crab body
    ctx.fillStyle = crab.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, crab.width/2, crab.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Crab pattern
    ctx.fillStyle = '#FF5555';
    ctx.beginPath();
    ctx.arc(-10, -5, 8, 0, Math.PI * 2);
    ctx.arc(10, -5, 8, 0, Math.PI * 2);
    ctx.arc(0, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Crab claws
    ctx.fillStyle = crab.color;
    for (let i = -1; i <= 1; i += 2) {
        ctx.save();
        ctx.translate(i * crab.width/2, -10);
        ctx.rotate(i * (crab.clawOpen ? 0.3 : 0.1));
        
        // Claw arm
        ctx.fillRect(0, -5, i * 20, 10);
        
        // Claw
        ctx.beginPath();
        ctx.arc(i * 20, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Claw opening
        if (crab.clawOpen) {
            ctx.fillStyle = '#E6F3FF';
            ctx.beginPath();
            ctx.arc(i * 20, 0, 6, -0.5, 0.5);
            ctx.fill();
            ctx.fillStyle = crab.color;
        }
        
        ctx.restore();
    }
    
    // Crab eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-15, -15, crab.eyeSize, 0, Math.PI * 2);
    ctx.arc(15, -15, crab.eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-15, -15, crab.eyeSize/2, 0, Math.PI * 2);
    ctx.arc(15, -15, crab.eyeSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Happy mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -5, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.restore();
}

// Game loop
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Level up
function levelUp() {
    level++;
    levelElement.textContent = level;
    
    // Add bonus score
    score += 50;
    scoreElement.textContent = score;
    
    // Create new pearls and sharks
    for (let i = 0; i < 5 + level * 2; i++) {
        pearls.push(createPearl());
    }
    
    sharks.push(createShark());
    
    // Increase crab speed slightly
    crab.speed = Math.min(8, 5 + level * 0.2);
}

// Lose life
function loseLife() {
    lives--;
    livesElement.textContent = lives;
    
    // Reset crab position
    crab.x = canvas.width / 2;
    crab.y = canvas.height - 100;
    
    // Brief invincibility
    crab.color = '#FFB6C1';
    setTimeout(() => {
        crab.color = '#FF6B6B';
    }, 1000);
    
    if (lives <= 0) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Level Reached: ${level}`, canvas.width / 2, canvas.height / 2 + 40);
    
    startBtn.textContent = 'Play Again';
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
}

// Start game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;
    
    initGame();
    
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = 'Pause';
    
    gameLoop();
}

// Pause game
function togglePause() {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Initial draw
draw();
