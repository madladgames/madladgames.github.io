class MotorcycleGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.motorcycle = document.getElementById('motorcycle');
        this.obstaclesContainer = document.getElementById('obstacles');
        this.distanceScore = document.getElementById('distanceScore');
        this.jumpScore = document.getElementById('jumpScore');
        this.highScore = document.getElementById('highScore');
        this.startBtn = document.getElementById('startBtn');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalDistance = document.getElementById('finalDistance');
        this.finalJumps = document.getElementById('finalJumps');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.gameState = {
            isRunning: false,
            distance: 0,
            jumps: 0,
            highScore: localStorage.getItem('motorcycleHighScore') || 0,
            isJumping: false,
            speed: 3,
            gameLoop: null,
            obstacleSpawnTimer: null,
            obstacles: []
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
    }
    
    bindEvents() {
        // Prevent arrow keys from scrolling
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            
            if (e.key === 'ArrowUp' && this.gameState.isRunning && !this.gameState.isJumping) {
                this.jump();
            }
        });
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameState.isRunning = true;
        this.gameState.distance = 0;
        this.gameState.jumps = 0;
        this.gameState.speed = 1.5; // Slower initial speed for toddlers
        
        this.startBtn.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.gameArea.classList.add('game-running');
        this.motorcycle.classList.remove('crashed');
        
        this.clearObstacles();
        this.updateDisplay();
        
        // Start game loops
        this.gameState.gameLoop = setInterval(() => this.gameLoop(), 30);
        this.gameState.obstacleSpawnTimer = setInterval(() => this.spawnObstacle(), 2500); // Less frequent obstacles
    }
    
    gameLoop() {
        if (!this.gameState.isRunning) return;
        
        // Update distance
        this.gameState.distance += 1;
        
        // Increase speed gradually
        if (this.gameState.distance % 100 === 0 && this.gameState.speed < 6) {
            this.gameState.speed += 0.2;
        }
        
        // Update obstacles
        this.updateObstacles();
        
        // Check collisions
        this.checkCollisions();
        
        // Update display
        this.updateDisplay();
    }
    
    jump() {
        if (this.gameState.isJumping) return;
        
        this.gameState.isJumping = true;
        this.motorcycle.classList.add('jumping');
        this.playJumpSound();
        
        setTimeout(() => {
            this.motorcycle.classList.remove('jumping');
            this.gameState.isJumping = false;
        }, 1200); // Match the new slower jump animation
    }
    
    spawnObstacle() {
        if (!this.gameState.isRunning) return;
        
        const obstacle = document.createElement('div');
        const rockSizes = ['rock-small', 'rock-medium', 'rock-large'];
        const randomSize = rockSizes[Math.floor(Math.random() * rockSizes.length)];
        
        obstacle.className = `obstacle ${randomSize}`;
        obstacle.style.right = '-100px';
        
        this.obstaclesContainer.appendChild(obstacle);
        
        this.gameState.obstacles.push({
            element: obstacle,
            type: 'rock',
            size: randomSize,
            position: -100
        });
    }
    
    updateObstacles() {
        this.gameState.obstacles = this.gameState.obstacles.filter(obstacle => {
            obstacle.position += this.gameState.speed;
            
            // Remove obstacles that have passed
            if (obstacle.position > window.innerWidth + 100) {
                if (obstacle.element.parentNode) {
                    obstacle.element.parentNode.removeChild(obstacle.element);
                }
                return false;
            }
            
            return true;
        });
    }
    
    checkCollisions() {
        const motorcycleRect = this.motorcycle.getBoundingClientRect();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        // Adjust motorcycle hitbox for better gameplay
        const motoLeft = motorcycleRect.left - gameAreaRect.left + 20;
        const motoRight = motorcycleRect.right - gameAreaRect.left - 20;
        const motoTop = motorcycleRect.top - gameAreaRect.top + 20;
        const motoBottom = motorcycleRect.bottom - gameAreaRect.top - 20;
        
        this.gameState.obstacles.forEach(obstacle => {
            const obstacleRect = obstacle.element.getBoundingClientRect();
            const obsLeft = obstacleRect.left - gameAreaRect.left;
            const obsRight = obstacleRect.right - gameAreaRect.left;
            const obsTop = obstacleRect.top - gameAreaRect.top;
            const obsBottom = obstacleRect.bottom - gameAreaRect.top;
            
            // Check if collision
            if (motoLeft < obsRight && motoRight > obsLeft &&
                motoTop < obsBottom && motoBottom > obsTop) {
                
                // All rocks just make you bounce - no game over!
                if (!this.gameState.isJumping && !this.motorcycle.classList.contains('bouncing')) {
                    this.bounceOnRock();
                }
            }
        });
    }
    
    bounceOnRock() {
        this.motorcycle.classList.add('bouncing');
        this.gameState.jumps++;
        this.playBounceSound();
        
        setTimeout(() => {
            this.motorcycle.classList.remove('bouncing');
        }, 400);
    }
    
    crashGame() {
        this.gameState.isRunning = false;
        this.gameArea.classList.remove('game-running');
        this.motorcycle.classList.add('crashed');
        
        this.playCrashSound();
        
        // Clear timers
        if (this.gameState.gameLoop) {
            clearInterval(this.gameState.gameLoop);
        }
        if (this.gameState.obstacleSpawnTimer) {
            clearInterval(this.gameState.obstacleSpawnTimer);
        }
        
        // Update high score
        if (this.gameState.distance > this.gameState.highScore) {
            this.gameState.highScore = this.gameState.distance;
            localStorage.setItem('motorcycleHighScore', this.gameState.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            this.finalDistance.textContent = this.gameState.distance;
            this.finalJumps.textContent = this.gameState.jumps;
            this.gameOverScreen.style.display = 'block';
        }, 800);
    }
    
    restartGame() {
        this.gameOverScreen.style.display = 'none';
        this.motorcycle.classList.remove('crashed');
        this.startGame();
    }
    
    clearObstacles() {
        this.obstaclesContainer.innerHTML = '';
        this.gameState.obstacles = [];
    }
    
    updateDisplay() {
        this.distanceScore.textContent = this.gameState.distance;
        this.jumpScore.textContent = this.gameState.jumps;
        this.highScore.textContent = this.gameState.highScore;
    }
    
    // Sound effects using Web Audio API
    playJumpSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    playBounceSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    playCrashSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MotorcycleGame();
});