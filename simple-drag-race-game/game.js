class SimpleDragRaceGame {
    constructor() {
        this.playerCar = document.getElementById('playerCar');
        this.opponentCar = document.getElementById('opponentCar');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.winsScore = document.getElementById('winsScore');
        this.lossesScore = document.getElementById('lossesScore');
        this.startBtn = document.getElementById('startBtn');
        
        this.gameState = {
            playerPosition: 5,
            opponentPosition: 5,
            wins: 0,
            losses: 0,
            raceActive: false,
            opponentInterval: null
        };
        
        this.finishLine = 80; // Percentage from bottom
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateCarPositions();
        this.updateScores();
    }
    
    bindEvents() {
        // Prevent arrow keys from scrolling the page
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            
            if (e.key === 'ArrowUp') {
                this.handleUpArrow();
            }
        });
        
        this.startBtn.addEventListener('click', () => this.startRace());
    }
    
    startRace() {
        // Reset positions
        this.gameState.playerPosition = 5;
        this.gameState.opponentPosition = 5;
        this.gameState.raceActive = true;
        this.resultDisplay.textContent = '';
        
        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Racing...';
        
        this.updateCarPositions();
        
        // Start opponent movement
        this.startOpponentMovement();
    }
    
    handleUpArrow() {
        if (!this.gameState.raceActive) return;
        
        // Move player car forward
        this.gameState.playerPosition += 3;
        
        // Play zoom sound
        this.playZoomSound();
        
        // Add celebration effect
        this.playerCar.classList.add('celebrate');
        setTimeout(() => this.playerCar.classList.remove('celebrate'), 300);
        
        this.updateCarPositions();
        
        // Check if player won
        if (this.gameState.playerPosition >= this.finishLine) {
            this.playerWins();
        }
    }
    
    startOpponentMovement() {
        if (this.gameState.opponentInterval) {
            clearInterval(this.gameState.opponentInterval);
        }
        
        this.gameState.opponentInterval = setInterval(() => {
            if (!this.gameState.raceActive) {
                clearInterval(this.gameState.opponentInterval);
                return;
            }
            
            // Opponent moves slower than player can
            this.gameState.opponentPosition += 1.5 + Math.random() * 0.5;
            
            this.updateCarPositions();
            
            // Check if opponent won
            if (this.gameState.opponentPosition >= this.finishLine) {
                this.opponentWins();
            }
        }, 300);
    }
    
    updateCarPositions() {
        this.playerCar.style.bottom = this.gameState.playerPosition + '%';
        this.opponentCar.style.bottom = this.gameState.opponentPosition + '%';
    }
    
    playerWins() {
        this.gameState.raceActive = false;
        this.gameState.wins++;
        this.updateScores();
        this.resultDisplay.textContent = '🏆 You Win! 🎉';
        this.playVictorySound();
        this.resetButton();
        
        if (this.gameState.opponentInterval) {
            clearInterval(this.gameState.opponentInterval);
        }
    }
    
    opponentWins() {
        this.gameState.raceActive = false;
        this.gameState.losses++;
        this.updateScores();
        this.resultDisplay.textContent = '😢 You Lost!';
        this.resetButton();
        
        if (this.gameState.opponentInterval) {
            clearInterval(this.gameState.opponentInterval);
        }
    }
    
    updateScores() {
        this.winsScore.textContent = this.gameState.wins;
        this.lossesScore.textContent = this.gameState.losses;
    }
    
    resetButton() {
        this.startBtn.disabled = false;
        this.startBtn.textContent = 'New Race';
    }
    
    // Sound generation functions using Web Audio API
    playZoomSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }
    
    playVictorySound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Play multiple notes for victory fanfare
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.15);
            oscillator.stop(audioContext.currentTime + index * 0.15 + 0.3);
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SimpleDragRaceGame();
});
