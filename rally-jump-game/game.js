class RallyJumpGame {
    constructor() {
        this.rallyCar = document.getElementById('rallyCar');
        this.numberDisplay = document.getElementById('numberDisplay');
        this.feedbackDisplay = document.getElementById('feedbackDisplay');
        this.successScore = document.getElementById('successScore');
        this.crashScore = document.getElementById('crashScore');
        this.streakScore = document.getElementById('streakScore');
        this.startBtn = document.getElementById('startBtn');
        
        this.gameState = {
            currentNumber: null,
            successfulJumps: 0,
            crashes: 0,
            streak: 0,
            gameActive: false
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateScores();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.startBtn.addEventListener('click', () => this.startGame());
    }
    
    startGame() {
        this.gameState.gameActive = true;
        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Playing...';
        this.newRound();
    }
    
    newRound() {
        if (!this.gameState.gameActive) return;
        
        // Generate random number from 0-9
        this.gameState.currentNumber = Math.floor(Math.random() * 10);
        this.numberDisplay.textContent = this.gameState.currentNumber;
        this.feedbackDisplay.textContent = '';
        
        // Reset car position and remove animation classes
        this.rallyCar.classList.remove('jump-success', 'crash', 'shake');
        this.rallyCar.style.left = '15%';
        this.rallyCar.style.bottom = '180px';
        this.rallyCar.style.transform = 'rotate(0deg)';
        this.rallyCar.style.opacity = '1';
    }
    
    handleKeyPress(e) {
        if (!this.gameState.gameActive) return;
        
        // Check if a number key was pressed (0-9)
        if (e.key >= '0' && e.key <= '9') {
            const typedNumber = parseInt(e.key);
            
            if (typedNumber === this.gameState.currentNumber) {
                // Correct number!
                this.successfulJump();
            } else {
                // Wrong number!
                this.crash();
            }
        }
    }
    
    successfulJump() {
        this.gameState.gameActive = false;
        this.gameState.successfulJumps++;
        this.gameState.streak++;
        
        // Play success sound
        this.playSuccessSound();
        
        // Show success feedback
        this.feedbackDisplay.textContent = '🎉 Perfect Jump!';
        this.numberDisplay.textContent = '✓ Correct!';
        
        // Animate car jumping
        this.rallyCar.classList.add('jump-success');
        
        // Update scores
        this.updateScores();
        
        // Next round after animation
        setTimeout(() => {
            this.startBtn.disabled = false;
            this.startBtn.textContent = 'Next Jump';
        }, 1200);
    }
    
    crash() {
        this.gameState.gameActive = false;
        this.gameState.crashes++;
        this.gameState.streak = 0;
        
        // Play crash sound
        this.playCrashSound();
        
        // Show crash feedback
        this.feedbackDisplay.textContent = '💥 Wrong Number!';
        this.numberDisplay.textContent = '✗ Crashed!';
        
        // Animate car crashing
        this.rallyCar.classList.add('crash');
        
        // Update scores
        this.updateScores();
        
        // Next round after animation
        setTimeout(() => {
            this.startBtn.disabled = false;
            this.startBtn.textContent = 'Try Again';
        }, 1000);
    }
    
    updateScores() {
        this.successScore.textContent = this.gameState.successfulJumps;
        this.crashScore.textContent = this.gameState.crashes;
        this.streakScore.textContent = this.gameState.streak;
    }
    
    // Sound generation functions using Web Audio API
    playSuccessSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Jumping whoosh sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.8);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
        
        // Success chime
        setTimeout(() => {
            const chimeOsc = audioContext.createOscillator();
            const chimeGain = audioContext.createGain();
            
            chimeOsc.connect(chimeGain);
            chimeGain.connect(audioContext.destination);
            
            chimeOsc.frequency.setValueAtTime(659, audioContext.currentTime);
            chimeOsc.frequency.setValueAtTime(784, audioContext.currentTime + 0.1);
            
            chimeGain.gain.setValueAtTime(0.2, audioContext.currentTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            chimeOsc.start(audioContext.currentTime);
            chimeOsc.stop(audioContext.currentTime + 0.3);
        }, 100);
    }
    
    playCrashSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Crash sound - noisy and dissonant
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RallyJumpGame();
});
