// Car Wash Sequence Game - Teaching Order of Operations for Toddlers
// Correct order: 1. Water (rinse) → 2. Soap → 3. Scrubber → 4. Water (rinse off)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let currentTool = null;
let currentStep = 0;
let carParts = [];
let particles = [];
let message = '';
let messageTimer = 0;
let gameComplete = false;
let celebrationParticles = [];

// Washing progress for each car part
const washProgress = {
    hood: { water1: false, soap: false, scrub: false, water2: false },
    roof: { water1: false, soap: false, scrub: false, water2: false },
    frontDoor: { water1: false, soap: false, scrub: false, water2: false },
    backDoor: { water1: false, soap: false, scrub: false, water2: false },
    trunk: { water1: false, soap: false, scrub: false, water2: false }
};

// Steps in order
const steps = ['water1', 'soap', 'scrub', 'water2'];
const stepNames = {
    water1: '💧 Rinse with Water First!',
    soap: '🧴 Apply Soap!',
    scrub: '🧽 Scrub the Car!',
    water2: '💧 Rinse Off the Soap!'
};

const stepInstructions = {
    water1: 'Click WATER then click the car to rinse it!',
    soap: 'Click SOAP then click the car to apply soap!',
    scrub: 'Click SCRUBBER then click the car to scrub!',
    water2: 'Click WATER again to rinse off the soap!'
};

// Tool colors
const toolColors = {
    water: '#4FC3F7',
    soap: '#FFF59D',
    scrubber: '#81C784'
};

// Car part definitions
function initCarParts() {
    carParts = [
        { name: 'hood', x: 520, y: 200, width: 140, height: 80, label: 'Hood' },
        { name: 'roof', x: 300, y: 140, width: 180, height: 70, label: 'Roof' },
        { name: 'frontDoor', x: 340, y: 210, width: 100, height: 100, label: 'Front' },
        { name: 'backDoor', x: 200, y: 210, width: 100, height: 100, label: 'Back' },
        { name: 'trunk', x: 80, y: 200, width: 100, height: 80, label: 'Trunk' }
    ];
}

// Draw the green car
function drawCar() {
    // Car body (green)
    ctx.fillStyle = '#2E7D32';
    
    // Main body
    ctx.beginPath();
    ctx.moveTo(60, 280);
    ctx.lineTo(80, 220);
    ctx.lineTo(180, 200);
    ctx.lineTo(200, 160);
    ctx.lineTo(480, 160);
    ctx.lineTo(520, 200);
    ctx.lineTo(660, 200);
    ctx.lineTo(680, 240);
    ctx.lineTo(680, 300);
    ctx.lineTo(60, 300);
    ctx.closePath();
    ctx.fill();
    
    // Darker shade for depth
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(60, 290, 620, 20);
    
    // Car roof
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.moveTo(200, 160);
    ctx.lineTo(220, 120);
    ctx.lineTo(440, 120);
    ctx.lineTo(480, 160);
    ctx.closePath();
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#81D4FA';
    // Front window
    ctx.beginPath();
    ctx.moveTo(360, 130);
    ctx.lineTo(430, 130);
    ctx.lineTo(460, 165);
    ctx.lineTo(360, 165);
    ctx.closePath();
    ctx.fill();
    
    // Back window
    ctx.beginPath();
    ctx.moveTo(240, 130);
    ctx.lineTo(350, 130);
    ctx.lineTo(350, 165);
    ctx.lineTo(220, 165);
    ctx.closePath();
    ctx.fill();
    
    // Window shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(245, 135);
    ctx.lineTo(265, 135);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(365, 135);
    ctx.lineTo(385, 135);
    ctx.stroke();
    
    // Headlights
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.ellipse(660, 250, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.ellipse(660, 250, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Taillights
    ctx.fillStyle = '#EF5350';
    ctx.beginPath();
    ctx.ellipse(75, 250, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(180, 310, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(560, 310, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel rims
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.arc(180, 310, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(560, 310, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel center caps
    ctx.fillStyle = '#616161';
    ctx.beginPath();
    ctx.arc(180, 310, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(560, 310, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Door handles
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(260, 240, 25, 8);
    ctx.fillRect(400, 240, 25, 8);
    
    // Side mirror
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(490, 200, 15, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
}

// Draw dirt/soap/water effects on car parts
function drawWashEffects() {
    carParts.forEach(part => {
        const progress = washProgress[part.name];
        
        // Draw based on current state
        if (!progress.water1) {
            // Draw dirt
            drawDirt(part);
        } else if (progress.water1 && !progress.soap) {
            // Wet car (lighter dirt)
            drawWetDirt(part);
        } else if (progress.soap && !progress.scrub) {
            // Draw soap bubbles
            drawSoapBubbles(part);
        } else if (progress.scrub && !progress.water2) {
            // Soapy and scrubbed (ready to rinse)
            drawSoapyClean(part);
        }
        // If water2 is true, car part is clean (no overlay)
    });
}

function drawDirt(part) {
    ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
    for (let i = 0; i < 8; i++) {
        const x = part.x + Math.random() * part.width;
        const y = part.y + Math.random() * part.height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 8 + 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWetDirt(part) {
    ctx.fillStyle = 'rgba(139, 90, 43, 0.3)';
    for (let i = 0; i < 5; i++) {
        const x = part.x + Math.random() * part.width;
        const y = part.y + Math.random() * part.height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 6 + 3, 0, Math.PI * 2);
        ctx.fill();
    }
    // Water droplets
    ctx.fillStyle = 'rgba(79, 195, 247, 0.5)';
    for (let i = 0; i < 4; i++) {
        const x = part.x + Math.random() * part.width;
        const y = part.y + Math.random() * part.height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 4 + 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSoapBubbles(part) {
    // Draw soap foam
    for (let i = 0; i < 12; i++) {
        const x = part.x + Math.random() * part.width;
        const y = part.y + Math.random() * part.height;
        const radius = Math.random() * 10 + 5;
        
        // Bubble gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 245, 157, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSoapyClean(part) {
    // Lighter soap residue
    for (let i = 0; i < 6; i++) {
        const x = part.x + Math.random() * part.width;
        const y = part.y + Math.random() * part.height;
        const radius = Math.random() * 8 + 4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw clickable part highlights when hovering
function drawPartHighlights(mouseX, mouseY) {
    carParts.forEach(part => {
        if (mouseX >= part.x && mouseX <= part.x + part.width &&
            mouseY >= part.y && mouseY <= part.y + part.height) {
            ctx.strokeStyle = currentTool ? toolColors[currentTool] : '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(part.x, part.y, part.width, part.height);
            ctx.setLineDash([]);
        }
    });
}

// Draw particles (water/soap/scrub effects)
function drawParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1; // gravity
        
        if (p.life > 0) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return true;
        }
        return false;
    });
}

// Create particles effect
function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + Math.random() * 50 - 25,
            y: y + Math.random() * 50 - 25,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            size: Math.random() * 8 + 4,
            color: color,
            life: 1
        });
    }
}

// Draw tool buttons
function drawTools() {
    const toolY = canvas.height - 100;
    const tools = [
        { name: 'water', x: 150, emoji: '💧', label: 'WATER' },
        { name: 'soap', x: 370, emoji: '🧴', label: 'SOAP' },
        { name: 'scrubber', x: 590, emoji: '🧽', label: 'SCRUBBER' }
    ];
    
    tools.forEach(tool => {
        // Button background
        const isSelected = currentTool === tool.name;
        ctx.fillStyle = isSelected ? toolColors[tool.name] : '#E0E0E0';
        ctx.strokeStyle = isSelected ? '#333' : '#999';
        ctx.lineWidth = isSelected ? 4 : 2;
        
        // Rounded rectangle
        const btnWidth = 140;
        const btnHeight = 70;
        const radius = 15;
        
        ctx.beginPath();
        ctx.roundRect(tool.x - btnWidth/2, toolY - btnHeight/2, btnWidth, btnHeight, radius);
        ctx.fill();
        ctx.stroke();
        
        // Emoji and text
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        ctx.fillText(tool.emoji, tool.x, toolY - 5);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillText(tool.label, tool.x, toolY + 25);
        
        // Selection glow
        if (isSelected) {
            ctx.shadowColor = toolColors[tool.name];
            ctx.shadowBlur = 15;
            ctx.strokeStyle = toolColors[tool.name];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(tool.x - btnWidth/2 - 3, toolY - btnHeight/2 - 3, btnWidth + 6, btnHeight + 6, radius);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    });
}

// Draw current step instruction
function drawInstructions() {
    const step = steps[currentStep];
    
    // Step indicator boxes at top
    const boxWidth = 150;
    const boxHeight = 50;
    const startX = 95;
    const boxY = 30;
    
    steps.forEach((s, i) => {
        const x = startX + i * (boxWidth + 20);
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        
        // Box background
        if (isComplete) {
            ctx.fillStyle = '#81C784';
        } else if (isActive) {
            ctx.fillStyle = '#FFF59D';
        } else {
            ctx.fillStyle = '#E0E0E0';
        }
        
        ctx.strokeStyle = isActive ? '#333' : '#999';
        ctx.lineWidth = isActive ? 3 : 1;
        
        ctx.beginPath();
        ctx.roundRect(x, boxY, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // Step number
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        
        const stepLabels = ['1. RINSE', '2. SOAP', '3. SCRUB', '4. RINSE'];
        ctx.fillText(stepLabels[i], x + boxWidth/2, boxY + 20);
        
        // Checkmark for completed
        if (isComplete) {
            ctx.fillStyle = '#1B5E20';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('✓', x + boxWidth/2, boxY + 42);
        } else {
            const emojis = ['💧', '🧴', '🧽', '💧'];
            ctx.font = '18px Arial';
            ctx.fillText(emojis[i], x + boxWidth/2, boxY + 42);
        }
    });
    
    // Current instruction
    if (!gameComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(200, 95, 400, 35, 10);
        ctx.fill();
        
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText(stepInstructions[step], 400, 118);
    }
}

// Draw message feedback
function drawMessage() {
    if (messageTimer > 0) {
        messageTimer--;
        
        ctx.fillStyle = message.includes('Great') || message.includes('Perfect') || message.includes('Excellent') 
            ? 'rgba(76, 175, 80, 0.9)' 
            : 'rgba(244, 67, 54, 0.9)';
        
        ctx.beginPath();
        ctx.roundRect(250, 180, 300, 50, 15);
        ctx.fill();
        
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText(message, 400, 212);
    }
}

// Draw celebration when complete
function drawCelebration() {
    if (gameComplete) {
        // Add celebration particles
        if (Math.random() < 0.3) {
            celebrationParticles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + 20,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 8 - 4,
                size: Math.random() * 12 + 6,
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)],
                life: 1
            });
        }
        
        // Update and draw celebration particles
        celebrationParticles = celebrationParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.008;
            
            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                return true;
            }
            return false;
        });
        
        // Success message
        ctx.fillStyle = 'rgba(76, 175, 80, 0.95)';
        ctx.beginPath();
        ctx.roundRect(150, 160, 500, 120, 20);
        ctx.fill();
        
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText('🎉 CAR IS CLEAN! 🎉', 400, 210);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Great job! You learned the right order!', 400, 250);
        
        // Play again button
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.roundRect(300, 290, 200, 50, 15);
        ctx.fill();
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🔄 WASH AGAIN', 400, 322);
    }
}

// Check if all parts completed current step
function checkStepComplete() {
    const step = steps[currentStep];
    const allComplete = Object.values(washProgress).every(part => part[step]);
    
    if (allComplete && currentStep < steps.length - 1) {
        currentStep++;
        const messages = ['Great! Now add soap! 🧴', 'Perfect! Now scrub! 🧽', 'Excellent! Rinse off the soap! 💧'];
        message = messages[currentStep - 1];
        messageTimer = 90;
    } else if (allComplete && currentStep === steps.length - 1) {
        gameComplete = true;
        currentTool = null;
    }
}

// Handle tool selection
function selectTool(toolName) {
    if (gameComplete) return;
    currentTool = toolName;
}

// Handle car part click
function washCarPart(partName) {
    if (!currentTool || gameComplete) return;
    
    const step = steps[currentStep];
    const progress = washProgress[partName];
    
    // Check if correct tool for current step
    let isCorrect = false;
    if (step === 'water1' && currentTool === 'water' && !progress.water1) {
        progress.water1 = true;
        isCorrect = true;
    } else if (step === 'soap' && currentTool === 'soap' && !progress.soap) {
        progress.soap = true;
        isCorrect = true;
    } else if (step === 'scrub' && currentTool === 'scrubber' && !progress.scrub) {
        progress.scrub = true;
        isCorrect = true;
    } else if (step === 'water2' && currentTool === 'water' && !progress.water2) {
        progress.water2 = true;
        isCorrect = true;
    }
    
    // Visual feedback
    const part = carParts.find(p => p.name === partName);
    if (isCorrect && part) {
        createParticles(part.x + part.width/2, part.y + part.height/2, toolColors[currentTool], 20);
        checkStepComplete();
    } else if (!isCorrect && part) {
        message = 'Try: ' + stepNames[step];
        messageTimer = 90;
    }
}

// Reset game
function resetGame() {
    currentStep = 0;
    currentTool = null;
    gameComplete = false;
    particles = [];
    celebrationParticles = [];
    message = '';
    messageTimer = 0;
    
    Object.keys(washProgress).forEach(key => {
        washProgress[key] = { water1: false, soap: false, scrub: false, water2: false };
    });
}

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(0, 340, canvas.width, 60);
    
    // Draw car
    drawCar();
    
    // Draw wash effects
    drawWashEffects();
    
    // Draw part highlights
    drawPartHighlights(mouseX, mouseY);
    
    // Draw particles
    drawParticles();
    
    // Draw tools
    drawTools();
    
    // Draw instructions
    drawInstructions();
    
    // Draw message
    drawMessage();
    
    // Draw celebration
    drawCelebration();
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Check play again button
    if (gameComplete && x >= 300 && x <= 500 && y >= 290 && y <= 340) {
        resetGame();
        return;
    }
    
    // Check tool buttons
    const toolY = canvas.height - 100;
    const tools = [
        { name: 'water', x: 150 },
        { name: 'soap', x: 370 },
        { name: 'scrubber', x: 590 }
    ];
    
    tools.forEach(tool => {
        if (x >= tool.x - 70 && x <= tool.x + 70 && y >= toolY - 35 && y <= toolY + 35) {
            selectTool(tool.name);
        }
    });
    
    // Check car parts
    carParts.forEach(part => {
        if (x >= part.x && x <= part.x + part.width &&
            y >= part.y && y <= part.y + part.height) {
            washCarPart(part.name);
        }
    });
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    // Simulate click
    const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(clickEvent);
});

// Initialize and start game
initCarParts();
gameLoop();
