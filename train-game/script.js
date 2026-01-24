class TrainGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStartTime = 0;
        
        // Game state
        this.carsCollected = 0;
        this.totalCars = 10;
        this.gameTime = 0;
        this.collectedCarTypes = [];
        
        // Game objects
        this.locomotive = {
            x: 100,
            y: 100, // Top track position
            width: 60,
            height: 40,
            speed: 5,
            currentTrack: 0, // 0: top, 1: bottom
            transitioning: false,
            transitionProgress: 0
        };
        
        this.tracks = {
            top: 100,
            bottom: 260
        };
        
        this.trainCars = [];
        this.obstacles = [];
        this.collectedCars = [];
        
        // Scrolling background
        this.scrollSpeed = 3;
        this.backgroundX = 0;
        
        // Input handling
        this.keys = {};
        
        // Car types with different colors
        this.carTypes = [
            { emoji: '🚃', color: '#FF6B6B' },
            { emoji: '🚋', color: '#4ECDC4' },
            { emoji: '🚃', color: '#FFE66D' },
            { emoji: '🚋', color: '#95E1D3' },
            { emoji: '🚃', color: '#F38181' },
            { emoji: '🚋', color: '#AA96DA' },
            { emoji: '🚃', color: '#FCBAD3' },
            { emoji: '🚋', color: '#A8E6CF' },
            { emoji: '🚃', color: '#FFD3B6' },
            { emoji: '🚋', color: '#FFAAA5' }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.gameRunning && !this.gamePaused) {
                e.preventDefault();
                this.switchTrack(e.key === 'ArrowUp' ? 0 : 1);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.resetGame());
    }
    
    switchTrack(targetTrack) {
        if (!this.locomotive.transitioning && this.locomotive.currentTrack !== targetTrack) {
            this.locomotive.currentTrack = targetTrack;
            this.locomotive.transitioning = true;
            this.locomotive.transitionProgress = 0;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameStartTime = Date.now();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOverModal').classList.add('hidden');
        
        // Spawn initial train cars
        this.spawnTrainCars();
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            document.getElementById('pauseBtn').textContent = this.gamePaused ? 'Resume' : 'Pause';
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.carsCollected = 0;
        this.gameTime = 0;
        this.collectedCarTypes = [];
        
        // Reset locomotive
        this.locomotive.y = this.tracks.top;
        this.locomotive.currentTrack = 0;
        this.locomotive.transitioning = false;
        
        // Reset objects
        this.trainCars = [];
        this.obstacles = [];
        this.backgroundX = 0;
        
        // Reset UI
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('gameOverModal').classList.add('hidden');
        
        // Clear train display
        const container = document.getElementById('train-display-container');
        container.innerHTML = '<div class="locomotive-icon">🚂</div>';
        
        this.updateUI();
    }
    
    spawnTrainCars() {
        // Spawn all train cars at intervals
        for (let i = 0; i < this.totalCars; i++) {
            const track = Math.random() < 0.5 ? 0 : 1;
            const carType = this.carTypes[i];
            
            this.trainCars.push({
                x: this.canvas.width + i * 300 + 200,
                y: track === 0 ? this.tracks.top : this.tracks.bottom,
                width: 50,
                height: 35,
                track: track,
                type: carType,
                collected: false
            });
        }
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.updateLocomotive();
        this.updateTrainCars();
        this.updateBackground();
        this.checkCollisions();
        this.checkWinCondition();
        this.updateUI();
    }
    
    updateLocomotive() {
        const loco = this.locomotive;
        
        // Smooth track transition
        if (loco.transitioning) {
            const targetY = loco.currentTrack === 0 ? this.tracks.top : this.tracks.bottom;
            const diff = targetY - loco.y;
            
            if (Math.abs(diff) > 2) {
                loco.y += diff * 0.15;
            } else {
                loco.y = targetY;
                loco.transitioning = false;
            }
        }
    }
    
    updateTrainCars() {
        this.trainCars.forEach(car => {
            if (!car.collected) {
                car.x -= this.scrollSpeed;
            }
        });
        
        // Remove cars that are off screen
        this.trainCars = this.trainCars.filter(car => car.x > -100);
    }
    
    updateBackground() {
        this.backgroundX -= this.scrollSpeed;
        if (this.backgroundX <= -100) {
            this.backgroundX = 0;
        }
    }
    
    checkCollisions() {
        const loco = this.locomotive;
        
        this.trainCars.forEach((car, index) => {
            if (car.collected) return;
            
            // Check if locomotive is on the same track and collides with car
            const locoTrack = loco.y < 180 ? 0 : 1;
            
            if (car.track === locoTrack &&
                loco.x < car.x + car.width &&
                loco.x + loco.width > car.x &&
                Math.abs(loco.y - car.y) < 50) {
                
                // Collect the car
                car.collected = true;
                this.carsCollected++;
                this.collectedCarTypes.push(car.type);
                
                // Add to display
                this.addCarToDisplay(car.type);
            }
        });
    }
    
    addCarToDisplay(carType) {
        const container = document.getElementById('train-display-container');
        const carIcon = document.createElement('div');
        carIcon.className = 'train-car-icon';
        carIcon.textContent = carType.emoji;
        container.appendChild(carIcon);
    }
    
    checkWinCondition() {
        if (this.carsCollected >= this.totalCars) {
            this.endGame(true);
        }
    }
    
    endGame(won = false) {
        this.gameRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        // Update final stats
        document.getElementById('finalCarsCollected').textContent = this.carsCollected;
        document.getElementById('finalTime').textContent = this.gameTime;
        
        // Show modal
        const modal = document.getElementById('gameOverModal');
        const modalContent = modal.querySelector('.modal-content');
        
        if (won) {
            modal.querySelector('h2').textContent = '🎉 Victory! 🎉';
            modalContent.classList.add('victory');
        } else {
            modal.querySelector('h2').textContent = '💥 Game Over! 💥';
            modalContent.classList.remove('victory');
        }
        
        modal.classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('cars-collected').textContent = this.carsCollected;
        document.getElementById('total-cars').textContent = this.totalCars;
        document.getElementById('timer').textContent = this.gameTime;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements
        this.drawBackground();
        
        // Draw tracks
        this.drawTracks();
        
        // Draw train cars
        this.drawTrainCars();
        
        // Draw locomotive
        this.drawLocomotive();
    }
    
    drawBackground() {
        // Draw ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 320, this.canvas.width, 80);
        
        // Draw sky details (clouds)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const cloudPositions = [
            { x: (this.backgroundX * 0.5) % (this.canvas.width + 100), y: 30 },
            { x: (this.backgroundX * 0.5 + 300) % (this.canvas.width + 100), y: 50 },
            { x: (this.backgroundX * 0.5 + 600) % (this.canvas.width + 100), y: 20 }
        ];
        
        cloudPositions.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 25, cloud.y, 25, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawTracks() {
        // Draw railroad tracks
        const drawTrack = (y) => {
            // Rails
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(0, y + 15, this.canvas.width, 4);
            this.ctx.fillRect(0, y + 25, this.canvas.width, 4);
            
            // Ties
            this.ctx.fillStyle = '#654321';
            for (let x = this.backgroundX % 40; x < this.canvas.width; x += 40) {
                this.ctx.fillRect(x, y + 10, 30, 8);
                this.ctx.fillRect(x, y + 26, 30, 8);
            }
        };
        
        drawTrack(this.tracks.top);
        drawTrack(this.tracks.bottom);
    }
    
    drawTrainCars() {
        this.trainCars.forEach(car => {
            if (car.collected) return;
            
            // Draw train car body
            this.ctx.fillStyle = car.type.color;
            this.ctx.fillRect(car.x, car.y, car.width, car.height);
            
            // Draw car details
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(car.x + 5, car.y + 5, car.width - 10, car.height - 15);
            
            // Draw wheels
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(car.x + 12, car.y + car.height + 3, 5, 0, Math.PI * 2);
            this.ctx.arc(car.x + car.width - 12, car.y + car.height + 3, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw emoji on car
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(car.type.emoji, car.x + car.width / 2, car.y + car.height / 2);
        });
    }
    
    drawLocomotive() {
        const loco = this.locomotive;
        
        // Draw locomotive body (blue)
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(loco.x, loco.y, loco.width, loco.height);
        
        // Draw cab
        this.ctx.fillStyle = '#1E3A8A';
        this.ctx.fillRect(loco.x + 40, loco.y - 10, 20, 20);
        
        // Draw boiler front
        this.ctx.fillStyle = '#1E3A8A';
        this.ctx.beginPath();
        this.ctx.arc(loco.x + 10, loco.y + loco.height / 2, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw smokestack
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(loco.x + 15, loco.y - 15, 8, 15);
        
        // Draw smoke
        const smokeY = loco.y - 20;
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(loco.x + 19, smokeY - 5, 5, 0, Math.PI * 2);
        this.ctx.arc(loco.x + 19, smokeY - 12, 7, 0, Math.PI * 2);
        this.ctx.arc(loco.x + 19, smokeY - 20, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw wheels
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(loco.x + 15, loco.y + loco.height + 5, 7, 0, Math.PI * 2);
        this.ctx.arc(loco.x + 35, loco.y + loco.height + 5, 7, 0, Math.PI * 2);
        this.ctx.arc(loco.x + 50, loco.y + loco.height + 5, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw connecting rods
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(loco.x + 15, loco.y + loco.height + 5);
        this.ctx.lineTo(loco.x + 50, loco.y + loco.height + 5);
        this.ctx.stroke();
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrainGame();
});
