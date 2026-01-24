class FiretruckGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStartTime = 0;
        
        // Game state
        this.score = 0;
        this.firesExtinguished = 0;
        this.housesSaved = 0;
        this.gameTime = 0;
        
        // Game objects
        this.firetruck = {
            x: 50,
            y: 300,
            width: 60,
            height: 30,
            speed: 3,
            spraying: false,
            sprayRange: 80,
            direction: 0 // 0: right, 1: down, 2: left, 3: up
        };
        
        this.houses = [];
        this.fires = [];
        this.waterDrops = [];
        
        // Input handling
        this.keys = {};
        
        // Game settings
        this.maxHouses = 8;
        this.fireSpawnRate = 0.02; // Probability per frame
        this.maxFires = 15;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateHouses();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.firetruck.spraying = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.key === ' ') {
                e.preventDefault();
                this.firetruck.spraying = false;
            }
        });
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.resetGame());
    }
    
    generateHouses() {
        this.houses = [];
        const housePositions = [
            {x: 150, y: 100}, {x: 350, y: 80}, {x: 550, y: 120}, {x: 700, y: 90},
            {x: 120, y: 400}, {x: 300, y: 450}, {x: 500, y: 420}, {x: 650, y: 380}
        ];
        
        housePositions.forEach((pos, index) => {
            this.houses.push({
                x: pos.x,
                y: pos.y,
                width: 80,
                height: 60,
                onFire: false,
                fireIntensity: 0,
                saved: false,
                id: index
            });
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameStartTime = Date.now();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOverModal').classList.add('hidden');
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
        this.score = 0;
        this.firesExtinguished = 0;
        this.housesSaved = 0;
        this.gameTime = 0;
        
        // Reset firetruck
        this.firetruck.x = 50;
        this.firetruck.y = 300;
        this.firetruck.spraying = false;
        this.firetruck.direction = 0;
        
        // Reset houses and fires
        this.generateHouses();
        this.fires = [];
        this.waterDrops = [];
        
        // Reset UI
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('gameOverModal').classList.add('hidden');
        
        this.updateUI();
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.updateFiretruck();
        this.updateFires();
        this.updateWaterDrops();
        this.checkCollisions();
        this.spawnFires();
        this.updateUI();
        this.checkGameOver();
    }
    
    updateFiretruck() {
        const truck = this.firetruck;
        
        // Movement with WASD or arrow keys
        if (this.keys['w'] || this.keys['arrowup']) {
            truck.y = Math.max(0, truck.y - truck.speed);
            truck.direction = 3;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            truck.y = Math.min(this.canvas.height - truck.height, truck.y + truck.speed);
            truck.direction = 1;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            truck.x = Math.max(0, truck.x - truck.speed);
            truck.direction = 2;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            truck.x = Math.min(this.canvas.width - truck.width, truck.x + truck.speed);
            truck.direction = 0;
        }
        
        // Create water drops when spraying (even when stationary)
        if (truck.spraying) {
            this.createWaterDrop();
        }
    }
    
    createWaterDrop() {
        const truck = this.firetruck;
        const directions = [
            {x: 1, y: 0},   // right
            {x: 0, y: 1},   // down
            {x: -1, y: 0},  // left
            {x: 0, y: -1}   // up
        ];
        
        const dir = directions[truck.direction];
        this.waterDrops.push({
            x: truck.x + truck.width / 2,
            y: truck.y + truck.height / 2,
            vx: dir.x * 4,
            vy: dir.y * 4,
            life: 30
        });
    }
    
    updateWaterDrops() {
        this.waterDrops = this.waterDrops.filter(drop => {
            drop.x += drop.vx;
            drop.y += drop.vy;
            drop.life--;
            
            return drop.life > 0 && 
                   drop.x >= 0 && drop.x <= this.canvas.width &&
                   drop.y >= 0 && drop.y <= this.canvas.height;
        });
    }
    
    spawnFires() {
        if (this.fires.length < this.maxFires && Math.random() < this.fireSpawnRate) {
            const availableHouses = this.houses.filter(house => !house.onFire && !house.saved);
            if (availableHouses.length > 0) {
                const house = availableHouses[Math.floor(Math.random() * availableHouses.length)];
                house.onFire = true;
                house.fireIntensity = 1;
                
                this.fires.push({
                    x: house.x + house.width / 2,
                    y: house.y,
                    houseId: house.id,
                    intensity: 1,
                    maxIntensity: 5
                });
            }
        }
    }
    
    updateFires() {
        this.fires.forEach(fire => {
            // Fires grow over time
            if (Math.random() < 0.01) {
                fire.intensity = Math.min(fire.maxIntensity, fire.intensity + 0.1);
                const house = this.houses[fire.houseId];
                if (house) {
                    house.fireIntensity = fire.intensity;
                }
            }
        });
    }
    
    checkCollisions() {
        // Check water drops hitting houses (instead of just fires)
        const dropsToRemove = new Set();
        const firesToRemove = new Set();
        
        this.waterDrops.forEach((drop, dropIndex) => {
            if (dropsToRemove.has(dropIndex)) return;
            
            // Check if water drop hits any burning house
            this.houses.forEach((house, houseIndex) => {
                if (!house.onFire || dropsToRemove.has(dropIndex)) return;
                
                // Check if water drop is within house boundaries (expanded slightly for easier targeting)
                const hitMargin = 10;
                if (drop.x >= house.x - hitMargin && 
                    drop.x <= house.x + house.width + hitMargin &&
                    drop.y >= house.y - hitMargin && 
                    drop.y <= house.y + house.height + hitMargin) {
                    
                    // Water hit the burning house
                    dropsToRemove.add(dropIndex);
                    
                    // Find the fire associated with this house
                    const fireIndex = this.fires.findIndex(f => f.houseId === houseIndex);
                    if (fireIndex !== -1) {
                        const fire = this.fires[fireIndex];
                        fire.intensity -= 0.3;
                        
                        if (fire.intensity <= 0) {
                            // Fire extinguished
                            firesToRemove.add(fireIndex);
                            house.onFire = false;
                            house.fireIntensity = 0;
                            house.saved = true;
                            
                            this.firesExtinguished++;
                            this.housesSaved++;
                            this.score += 100;
                        } else {
                            // Fire reduced
                            house.fireIntensity = fire.intensity;
                            this.score += 10;
                        }
                    }
                }
            });
        });
        
        // Remove water drops that hit houses (iterate backwards to avoid index shifting)
        Array.from(dropsToRemove).sort((a, b) => b - a).forEach(index => {
            this.waterDrops.splice(index, 1);
        });
        
        // Remove extinguished fires (iterate backwards to avoid index shifting)
        Array.from(firesToRemove).sort((a, b) => b - a).forEach(index => {
            this.fires.splice(index, 1);
        });
    }
    
    checkGameOver() {
        // Win condition: all current fires are extinguished
        // Game continues until player puts out all fires
        if (this.fires.length === 0 && this.gameRunning) {
            // Check if there are any houses still on fire
            const housesOnFire = this.houses.filter(house => house.onFire).length;
            
            if (housesOnFire === 0 && this.firesExtinguished > 0) {
                // All fires are out - player wins!
                this.score += 1000; // Bonus for putting out all fires
                this.endGame(true);
            }
        }
    }
    
    endGame(won = false) {
        this.gameRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        // Update final score display
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHousesSaved').textContent = this.housesSaved;
        document.getElementById('finalFiresExtinguished').textContent = this.firesExtinguished;
        
        // Show game over modal with appropriate styling
        const modal = document.getElementById('gameOverModal');
        const modalContent = modal.querySelector('.modal-content');
        modal.querySelector('h2').textContent = won ? '🎉 Victory! 🎉' : '💥 Game Over! 💥';
        
        // Add victory class for different styling
        if (won) {
            modalContent.classList.add('victory');
        } else {
            modalContent.classList.remove('victory');
        }
        
        modal.classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('fires-extinguished').textContent = this.firesExtinguished;
        document.getElementById('houses-saved').textContent = this.housesSaved;
        document.getElementById('timer').textContent = this.gameTime;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw roads
        this.drawRoads();
        
        // Draw houses
        this.drawHouses();
        
        // Draw fires
        this.drawFires();
        
        // Draw water drops
        this.drawWaterDrops();
        
        // Draw firetruck
        this.drawFiretruck();
        
        // Draw spray effect
        if (this.firetruck.spraying) {
            this.drawSprayEffect();
        }
    }
    
    drawRoads() {
        this.ctx.fillStyle = '#555';
        // Horizontal roads
        this.ctx.fillRect(0, 280, this.canvas.width, 40);
        this.ctx.fillRect(0, 480, this.canvas.width, 40);
        // Vertical roads
        this.ctx.fillRect(280, 0, 40, this.canvas.height);
        this.ctx.fillRect(480, 0, 40, this.canvas.height);
        
        // Road markings
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.fillRect(i, 295, 20, 10);
            this.ctx.fillRect(i, 495, 20, 10);
        }
        for (let i = 0; i < this.canvas.height; i += 40) {
            this.ctx.fillRect(295, i, 10, 20);
            this.ctx.fillRect(495, i, 10, 20);
        }
    }
    
    drawHouses() {
        this.houses.forEach(house => {
            // House base color depends on fire intensity
            let houseColor = '#8B4513';
            if (house.saved) {
                houseColor = '#90EE90'; // Light green for saved houses
            } else if (house.fireIntensity > 3) {
                houseColor = '#654321'; // Darker brown for heavily damaged
            } else if (house.fireIntensity > 1) {
                houseColor = '#A0522D'; // Medium brown for damaged
            }
            
            // Draw house
            this.ctx.fillStyle = houseColor;
            this.ctx.fillRect(house.x, house.y, house.width, house.height);
            
            // Draw roof
            this.ctx.fillStyle = house.saved ? '#228B22' : '#8B0000';
            this.ctx.beginPath();
            this.ctx.moveTo(house.x - 5, house.y);
            this.ctx.lineTo(house.x + house.width / 2, house.y - 20);
            this.ctx.lineTo(house.x + house.width + 5, house.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw door
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(house.x + house.width / 2 - 8, house.y + house.height - 25, 16, 25);
            
            // Draw windows
            this.ctx.fillStyle = house.saved ? '#87CEEB' : '#FFD700';
            this.ctx.fillRect(house.x + 10, house.y + 15, 15, 15);
            this.ctx.fillRect(house.x + house.width - 25, house.y + 15, 15, 15);
        });
    }
    
    drawFires() {
        this.fires.forEach(fire => {
            const size = Math.max(fire.intensity * 8, 8);
            const x = fire.x;
            const y = fire.y - size;
            
            // Draw fire with flickering effect
            const flicker = Math.sin(Date.now() * 0.01) * 2;
            
            // Fire base (red)
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            const baseRadiusX = Math.max(size * 0.6, 4);
            const baseRadiusY = Math.max(size * 0.4, 3);
            this.ctx.ellipse(x, y + size * 0.7, baseRadiusX, baseRadiusY, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fire middle (orange)
            this.ctx.fillStyle = '#FF6500';
            this.ctx.beginPath();
            const middleRadiusX = Math.max(size * 0.4 + flicker, 3);
            const middleRadiusY = Math.max(size * 0.6 + flicker, 4);
            this.ctx.ellipse(x, y + size * 0.5, middleRadiusX, middleRadiusY, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fire top (yellow)
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            const topRadiusX = Math.max(size * 0.2 + flicker, 2);
            const topRadiusY = Math.max(size * 0.4 + flicker, 3);
            this.ctx.ellipse(x, y + size * 0.2, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawWaterDrops() {
        this.ctx.fillStyle = '#00BFFF';
        this.waterDrops.forEach(drop => {
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawFiretruck() {
        const truck = this.firetruck;
        
        // Draw truck body - RED COLOR (always upright, no rotation)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(truck.x, truck.y, truck.width, truck.height);
        
        // Draw truck cab (darker red)
        this.ctx.fillStyle = '#CC0000';
        this.ctx.fillRect(truck.x, truck.y, 20, truck.height);
        
        // Draw truck details
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(truck.x + 5, truck.y + 5, 15, 8);
        this.ctx.fillRect(truck.x + 5, truck.y + 17, 15, 8);
        
        // Draw ladder (silver)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(truck.x + 25, truck.y + 2, truck.width - 30, 4);
        this.ctx.fillRect(truck.x + 25, truck.y + 24, truck.width - 30, 4);
        
        // Draw wheels (black)
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(truck.x + 10, truck.y + truck.height + 5, 6, 0, Math.PI * 2);
        this.ctx.arc(truck.x + truck.width - 10, truck.y + truck.height + 5, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSprayEffect() {
        const truck = this.firetruck;
        const directions = [
            {x: 1, y: 0},   // right
            {x: 0, y: 1},   // down
            {x: -1, y: 0},  // left
            {x: 0, y: -1}   // up
        ];
        
        const dir = directions[truck.direction];
        const startX = truck.x + truck.width / 2;
        const startY = truck.y + truck.height / 2;
        
        this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.6)';
        this.ctx.lineWidth = 3;
        
        for (let i = 0; i < 5; i++) {
            const spread = (i - 2) * 10;
            const endX = startX + dir.x * truck.sprayRange + (dir.y * spread);
            const endY = startY + dir.y * truck.sprayRange + (dir.x * spread);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FiretruckGame();
});
