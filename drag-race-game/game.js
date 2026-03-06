class DragRaceGame {
    constructor() {
        this.directionDisplay = document.getElementById('directionDisplay');
        this.feedbackDisplay = document.getElementById('feedbackDisplay');
        this.playerCar = document.getElementById('playerCar');
        this.opponentCar = document.getElementById('opponentCar');
        this.winsScore = document.getElementById('winsScore');
        this.lossesScore = document.getElementById('lossesScore');
        this.streakScore = document.getElementById('streakScore');
        this.resetBtn = document.getElementById('resetBtn');
        
        this.gameState = {
            currentDirection: null,
            playerPosition: 20,
            opponentPosition: 20,
            wins: 0,
            losses: 0,
            streak: 0,
            raceActive: false,
            raceFinished: false
        };
        
        this.finishLine = 85; // Percentage from left
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.newRound();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.resetBtn.addEventListener('click', () => this.resetRace());
    }
    
    newRound() {
        // Choose random direction
        this.gameState.currentDirection = Math.random() < 0.5 ? 'left' : 'right';
        this.directionDisplay.textContent = this.gameState.currentDirection;
        this.gameState.raceActive = true;
        this.gameState.raceFinished = false;
        this.feedbackDisplay.textContent = '';
        
        // Reset positions
        this.gameState.playerPosition = 20;
        this.gameState.opponentPosition = 20;
        this.updateCarPositions();
        
        // Start opponent car movement
        this.startOpponentMovement();
    }
    
    handleKeyPress(e) {
        if (!this.gameState.raceActive || this.gameState.raceFinished) return;
        
        let keyPressed = null;
        if (e.key === 'ArrowLeft') {
            keyPressed = 'left';
        } else if (e.key === 'ArrowRight') {
            keyPressed = 'right';
        } else {
            return; // Ignore other keys
        }
        
        if (keyPressed === this.gameState.currentDirection) {
            // Correct key!
            this.playSuccessSound();
            this.movePlayerCar();
            this.showFeedback('🏆');
            this.playerCar.classList.add('celebrate');
            setTimeout(() => this.playerCar.classList.remove('celebrate'), 500);
            
            // Check if player won
            if (this.gameState.playerPosition >= this.finishLine) {
                this.playerWins();
            } else {
                // New round after short delay
                setTimeout(() => this.newRound(), 800);
            }
        } else {
            // Wrong key!
            this.playErrorSound();
            this.showFeedback('😞');
            this.playerCar.classList.add('shake');
            setTimeout(() => this.playerCar.classList.remove('shake'), 300);
        }
    }
    
    movePlayerCar() {
        this.playZoomSound();
        this.gameState.playerPosition += 15;
        if (this.gameState.playerPosition > this.finishLine) {
            this.gameState.playerPosition = this.finishLine;
        }
        this.updateCarPositions();
    }
    
    startOpponentMovement() {
        if (!this.gameState.raceActive || this.gameState.raceFinished) return;
        
        // Opponent moves at intervals - slowed down significantly
        const opponentInterval = setInterval(() => {
            if (!this.gameState.raceActive || this.gameState.raceFinished) {
                clearInterval(opponentInterval);
                return;
            }
            
            this.gameState.opponentPosition += 0.8 + Math.random() * 0.2;
            
            if (this.gameState.opponentPosition >= this.finishLine) {
                this.gameState.opponentPosition = this.finishLine;
                clearInterval(opponentInterval);
                if (!this.gameState.raceFinished) {
                    this.opponentWins();
                }
            }
            
            this.updateCarPositions();
        }, 3500);
    }
    
    updateCarPositions() {
        this.playerCar.style.bottom = this.gameState.playerPosition + '%';
        this.opponentCar.style.bottom = this.gameState.opponentPosition + '%';
    }
    
    playerWins() {
        this.gameState.raceFinished = true;
        this.gameState.raceActive = false;
        this.gameState.wins++;
        this.gameState.streak++;
        this.updateScores();
        this.directionDisplay.textContent = 'You Win! 🎉';
        this.feedbackDisplay.textContent = '🏆';
        this.playVictorySound();
    }
    
    opponentWins() {
        this.gameState.raceFinished = true;
        this.gameState.raceActive = false;
        this.gameState.losses++;
        this.gameState.streak = 0;
        this.updateScores();
        this.directionDisplay.textContent = 'You Lost! 😢';
        this.feedbackDisplay.textContent = '';
    }
    
    updateScores() {
        this.winsScore.textContent = this.gameState.wins;
        this.lossesScore.textContent = this.gameState.losses;
        this.streakScore.textContent = this.gameState.streak;
    }
    
    resetRace() {
        this.gameState.playerPosition = 20;
        this.gameState.opponentPosition = 20;
        this.gameState.raceActive = false;
        this.gameState.raceFinished = false;
        this.updateCarPositions();
        this.newRound();
    }
    
    showFeedback(emoji) {
        this.feedbackDisplay.textContent = emoji;
        setTimeout(() => {
            if (!this.gameState.raceFinished) {
                this.feedbackDisplay.textContent = '';
            }
        }, 600);
    }
    
    // Sound generation functions using Web Audio API
    playZoomSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    playSuccessSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    playErrorSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
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
    new DragRaceGame();
});
