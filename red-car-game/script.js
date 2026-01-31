class RedCarGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.playerCar = document.getElementById('playerCar');
        this.obstaclesContainer = document.getElementById('obstacles');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.gameOverScreen = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.gameState = {
            isRunning: false,
            isPaused: false,
            score: 0,
            speed: 0,
            carPosition: 50, // percentage from left
            obstacles: [],
            gameLoop: null,
            obstacleSpawnTimer: null
        };
        
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
    }
    
    bindEvents() {
        // Button events
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent arrow keys from scrolling the page
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(e) {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = true;
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = false;
                break;
        }
    }
    
    startGame() {
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.gameState.score = 0;
        this.gameState.speed = 30;
        this.gameState.carPosition = 50;
        this.gameState.obstacles = [];
        
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.gameOverScreen.style.display = 'none';
        
        this.clearObstacles();
        this.updateCarPosition();
        this.updateDisplay();
        
        this.gameState.gameLoop = setInterval(() => this.gameLoop(), 16); // ~60 FPS
        this.gameState.obstacleSpawnTimer = setInterval(() => this.spawnObstacle(), 2000);
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.pauseBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
    }
    
    restartGame() {
        this.endGame();
        this.startGame();
    }
    
    endGame() {
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        
        if (this.gameState.gameLoop) {
            clearInterval(this.gameState.gameLoop);
            this.gameState.gameLoop = null;
        }
        
        if (this.gameState.obstacleSpawnTimer) {
            clearInterval(this.gameState.obstacleSpawnTimer);
            this.gameState.obstacleSpawnTimer = null;
        }
        
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.gameOverScreen.style.display = 'block';
        this.finalScoreElement.textContent = this.gameState.score;
    }
    
    gameLoop() {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        this.updateCarMovement();
        this.updateObstacles();
        this.checkCollisions();
        this.updateScore();
        this.updateDisplay();
    }
    
    updateCarMovement() {
        const moveSpeed = 0.8; // Reduced speed for better control
        
        if (this.keys.left && this.gameState.carPosition > 5) {
            this.gameState.carPosition -= moveSpeed;
        }
        if (this.keys.right && this.gameState.carPosition < 95) {
            this.gameState.carPosition += moveSpeed;
        }
        
        // Gradually increase speed over time
        if (this.gameState.speed < 80) {
            this.gameState.speed += 0.02;
        }
        
        this.updateCarPosition();
    }
    
    updateCarPosition() {
        this.playerCar.style.left = this.gameState.carPosition + '%';
    }
    
    spawnObstacle() {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        const obstacle = document.createElement('div');
        
        // Random obstacle types
        const obstacleTypes = ['obstacle-car-blue', 'obstacle-car-green', 'obstacle-car-yellow', 'obstacle-truck', 'obstacle-cone'];
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacle.className = `obstacle ${randomType}`;
        
        const randomPosition = Math.random() * 85 + 5; // 5% to 90% from left
        obstacle.style.left = randomPosition + '%';
        
        this.obstaclesContainer.appendChild(obstacle);
        this.gameState.obstacles.push({
            element: obstacle,
            x: randomPosition,
            y: -60
        });
        
        // Remove obstacle after animation
        setTimeout(() => {
            if (obstacle.parentNode) {
                obstacle.parentNode.removeChild(obstacle);
            }
        }, 3000);
    }
    
    updateObstacles() {
        const speedMultiplier = this.gameState.speed / 30;
        
        this.gameState.obstacles.forEach((obstacle, index) => {
            obstacle.y += 3 * speedMultiplier;
            
            if (obstacle.y > 560) {
                this.gameState.obstacles.splice(index, 1);
                this.gameState.score += 10;
            }
        });
    }
    
    checkCollisions() {
        const carRect = {
            x: this.gameState.carPosition + 0.5, // Add small padding
            y: 86, // Car is at bottom of game area
            width: 5.5, // Tighter width for more accurate collision
            height: 13 // Tighter height for more accurate collision
        };
        
        this.gameState.obstacles.forEach(obstacle => {
            const obstacleRect = {
                x: obstacle.x + 0.5, // Add small padding
                y: (obstacle.y / 500) * 100, // Convert to percentage
                width: 4.5, // Tighter width for more accurate collision
                height: 10 // Tighter height for more accurate collision
            };
            
            if (this.isColliding(carRect, obstacleRect)) {
                // Add collision visual effect
                this.playerCar.classList.add('collision-effect');
                obstacle.element.classList.add('collision-effect');
                
                // End game after brief delay to show effect
                setTimeout(() => {
                    this.endGame();
                }, 200);
                
                // Prevent further collision checks
                this.gameState.isRunning = false;
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore() {
        this.gameState.score += Math.floor(this.gameState.speed / 10);
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.gameState.score;
        this.speedElement.textContent = Math.floor(this.gameState.speed);
        
        // Only update animations if game is running
        if (this.gameState.isRunning && !this.gameState.isPaused) {
            // Update road animation speed based on car speed
            const roadLines = document.querySelectorAll('.road-line');
            const animationDuration = Math.max(0.2, 1 - (this.gameState.speed / 100));
            roadLines.forEach(line => {
                line.style.animationDuration = animationDuration + 's';
            });
            
            // Update wheel animation speed
            const wheels = document.querySelectorAll('.car-wheel');
            const wheelDuration = Math.max(0.05, 0.2 - (this.gameState.speed / 500));
            wheels.forEach(wheel => {
                wheel.style.animationDuration = wheelDuration + 's';
            });
        }
        
        // Control animation play state separately
        const roadLines = document.querySelectorAll('.road-line');
        roadLines.forEach(line => {
            line.style.animationPlayState = (this.gameState.isRunning && !this.gameState.isPaused) ? 'running' : 'paused';
        });
        
        const wheels = document.querySelectorAll('.car-wheel');
        wheels.forEach(wheel => {
            wheel.style.animationPlayState = (this.gameState.isRunning && !this.gameState.isPaused) ? 'running' : 'paused';
        });
    }
    
    clearObstacles() {
        this.obstaclesContainer.innerHTML = '';
        this.gameState.obstacles = [];
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RedCarGame();
});
