// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio Context for sound effects
let audioContext;
let audioReady = false;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            audioReady = true;
        });
    } else {
        audioReady = true;
    }
}

// Sound effect function
function playCollisionSound() {
    if (!audioContext || !audioReady) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a "bonk" sound
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.type = 'square';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playGemSound() {
    if (!audioContext || !audioReady) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a "ding" sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

// Game State
let gameState = {
    level: 1,
    time: 0,
    gems: 0,
    totalGems: 0,
    gameLoop: null,
    timeInterval: null
};

// Player (Volkswagen Beetle)
const beetle = {
    x: 50,
    y: 50,
    width: 40,
    height: 24,
    speed: 3,
    rotation: 0,
    velocityX: 0,
    velocityY: 0
};

// Keys pressed
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Maze walls
let walls = [];
let gems = [];
const TILE_SIZE = 40;

// Maze Generation - Toddler-friendly with wider passages
function generateMaze(level) {
    walls = [];
    gems = [];
    
    const cols = Math.floor(canvas.width / TILE_SIZE);
    const rows = Math.floor(canvas.height / TILE_SIZE);
    
    // Create border walls
    for (let i = 0; i < cols; i++) {
        walls.push({ x: i * TILE_SIZE, y: 0, width: TILE_SIZE, height: TILE_SIZE });
        walls.push({ x: i * TILE_SIZE, y: (rows - 1) * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
    }
    for (let i = 1; i < rows - 1; i++) {
        walls.push({ x: 0, y: i * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
        walls.push({ x: (cols - 1) * TILE_SIZE, y: i * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
    }
    
    // Generate maze patterns with WIDER passages (toddler-friendly)
    if (level === 1) {
        // Very simple maze with wide passages
        for (let i = 4; i < cols - 4; i += 5) {
            for (let j = 3; j < rows - 4; j += 4) {
                walls.push({ x: i * TILE_SIZE, y: j * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
            }
        }
    } else if (level === 2) {
        // Medium maze with wide passages
        for (let i = 3; i < cols - 3; i += 4) {
            for (let j = 3; j < rows - 3; j += 4) {
                walls.push({ x: i * TILE_SIZE, y: j * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
            }
        }
        // Add some horizontal walls with gaps
        for (let i = 5; i < cols - 5; i += 4) {
            walls.push({ x: i * TILE_SIZE, y: 7 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
        }
    } else {
        // More complex but still toddler-friendly
        for (let i = 3; i < cols - 3; i += 3) {
            for (let j = 3; j < rows - 3; j += 3) {
                if ((i + j) % 4 === 0 && Math.random() > 0.4) {
                    walls.push({ x: i * TILE_SIZE, y: j * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
                }
            }
        }
    }
    
    // Place coins in open spaces where the beetle can reach
    const gemCount = 3 + level;
    gameState.totalGems = gemCount;
    
    for (let i = 0; i < gemCount; i++) {
        let gemX, gemY;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 100) {
            attempts++;
            gemX = Math.floor(Math.random() * (cols - 4) + 2) * TILE_SIZE + TILE_SIZE / 2;
            gemY = Math.floor(Math.random() * (rows - 4) + 2) * TILE_SIZE + TILE_SIZE / 2;
            
            validPosition = true;
            
            // Check if gem overlaps with walls
            for (let wall of walls) {
                if (gemX > wall.x && gemX < wall.x + wall.width &&
                    gemY > wall.y && gemY < wall.y + wall.height) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check if there's enough space around the coin for the beetle to reach it
            // Test if beetle can fit at the coin position
            if (validPosition) {
                const testX = gemX - beetle.width / 2;
                const testY = gemY - beetle.height / 2;
                
                // Check if beetle would collide with walls at this position
                for (let wall of walls) {
                    if (testX < wall.x + wall.width &&
                        testX + beetle.width > wall.x &&
                        testY < wall.y + wall.height &&
                        testY + beetle.height > wall.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Check if gem is too close to starting position
            if (validPosition && Math.abs(gemX - beetle.x) < 100 && Math.abs(gemY - beetle.y) < 100) {
                validPosition = false;
            }
        }
        
        if (validPosition) {
            gems.push({ x: gemX, y: gemY, radius: 10, collected: false });
        }
    }
}

// Draw Volkswagen Beetle
function drawBeetle() {
    ctx.save();
    ctx.translate(beetle.x + beetle.width / 2, beetle.y + beetle.height / 2);
    ctx.rotate(beetle.rotation);
    
    // Beetle body (rounded shape)
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.ellipse(0, 0, beetle.width / 2, beetle.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Beetle roof
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(-5, 0, beetle.width / 3, beetle.height / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-12, -10, 4, 0, Math.PI * 2);
    ctx.arc(-12, 10, 4, 0, Math.PI * 2);
    ctx.arc(8, -10, 4, 0, Math.PI * 2);
    ctx.arc(8, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlights
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(beetle.width / 2 - 5, -6, 2, 0, Math.PI * 2);
    ctx.arc(beetle.width / 2 - 5, 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw maze
function drawMaze() {
    ctx.fillStyle = '#34495e';
    for (let wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
}

// Draw coins (changed from gems)
function drawGems() {
    for (let gem of gems) {
        if (!gem.collected) {
            // Animated coin
            const pulse = Math.sin(Date.now() / 200) * 2;
            
            // Outer coin circle (gold)
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(gem.x, gem.y, gem.radius + pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner coin circle (darker gold)
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(gem.x, gem.y, gem.radius / 2 + pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Sparkle
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gem.x - 5, gem.y);
            ctx.lineTo(gem.x + 5, gem.y);
            ctx.moveTo(gem.x, gem.y - 5);
            ctx.lineTo(gem.x, gem.y + 5);
            ctx.stroke();
        }
    }
}

// Collision detection
function checkWallCollision(x, y) {
    for (let wall of walls) {
        if (x < wall.x + wall.width &&
            x + beetle.width > wall.x &&
            y < wall.y + wall.height &&
            y + beetle.height > wall.y) {
            return true;
        }
    }
    return false;
}

// Check gem collection
function checkGemCollection() {
    for (let gem of gems) {
        if (!gem.collected) {
            const dx = (beetle.x + beetle.width / 2) - gem.x;
            const dy = (beetle.y + beetle.height / 2) - gem.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < gem.radius + beetle.width / 2) {
                gem.collected = true;
                gameState.gems++;
                document.getElementById('gems').textContent = gameState.gems;
                playGemSound();
                
                // Check if all gems collected
                if (gameState.gems >= gameState.totalGems) {
                    levelComplete();
                }
            }
        }
    }
}

// Update game
function update() {
    // Calculate velocity based on keys
    beetle.velocityX = 0;
    beetle.velocityY = 0;
    
    if (keys.ArrowLeft) {
        beetle.velocityX = -beetle.speed;
        beetle.rotation = Math.PI;
    }
    if (keys.ArrowRight) {
        beetle.velocityX = beetle.speed;
        beetle.rotation = 0;
    }
    if (keys.ArrowUp) {
        beetle.velocityY = -beetle.speed;
        beetle.rotation = -Math.PI / 2;
    }
    if (keys.ArrowDown) {
        beetle.velocityY = beetle.speed;
        beetle.rotation = Math.PI / 2;
    }
    
    // Diagonal movement
    if (keys.ArrowUp && keys.ArrowLeft) {
        beetle.rotation = -3 * Math.PI / 4;
    } else if (keys.ArrowUp && keys.ArrowRight) {
        beetle.rotation = -Math.PI / 4;
    } else if (keys.ArrowDown && keys.ArrowLeft) {
        beetle.rotation = 3 * Math.PI / 4;
    } else if (keys.ArrowDown && keys.ArrowRight) {
        beetle.rotation = Math.PI / 4;
    }
    
    // Only check collisions if the beetle is actually trying to move
    if (beetle.velocityX !== 0 || beetle.velocityY !== 0) {
        // Check collision before moving
        const newX = beetle.x + beetle.velocityX;
        const newY = beetle.y + beetle.velocityY;
        
        let hitWall = false;
        
        if (!checkWallCollision(newX, beetle.y)) {
            beetle.x = newX;
        } else {
            hitWall = true;
        }
        
        if (!checkWallCollision(beetle.x, newY)) {
            beetle.y = newY;
        } else {
            hitWall = true;
        }
        
        if (hitWall) {
            playCollisionSound();
        }
    }
    
    checkGemCollection();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    drawGems();
    drawBeetle();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Level complete
function levelComplete() {
    clearInterval(gameState.timeInterval);
    document.getElementById('finalTime').textContent = gameState.time;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Start new level
function startLevel(level) {
    gameState.level = level;
    gameState.time = 0;
    gameState.gems = 0;
    
    beetle.x = 50;
    beetle.y = 50;
    beetle.rotation = 0;
    
    generateMaze(level);
    
    document.getElementById('level').textContent = level;
    document.getElementById('time').textContent = 0;
    document.getElementById('gems').textContent = 0;
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    if (gameState.timeInterval) {
        clearInterval(gameState.timeInterval);
    }
    
    gameState.timeInterval = setInterval(() => {
        gameState.time++;
        document.getElementById('time').textContent = gameState.time;
    }, 1000);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    initAudio(); // Initialize audio on first key press
    if (e.key in keys) {
        e.preventDefault();
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        e.preventDefault();
        keys[e.key] = false;
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initAudio(); // Initialize audio on first click
    startLevel(gameState.level);
});

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    initAudio(); // Initialize audio on first click
    startLevel(gameState.level + 1);
});

// Initialize audio on any click
canvas.addEventListener('click', initAudio);

// Initialize audio immediately on first click/touch
document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });

// Start the game
startLevel(1);
gameLoop();
