    // Sorting Game - Teaching Categorization for Toddlers
// Vehicles go in the garage, Animals go in the grass

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let items = [];
let draggedItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let score = 0;
let totalItems = 0;
let gameComplete = false;
let celebrationParticles = [];
let message = '';
let messageTimer = 0;
let messageType = '';

// Pre-generated grass decorations (to prevent flickering)
let grassBlades = [];
let flowers = [];

// Categories
const vehicles = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🛻', '🚚', '🚜', '🏍️', '🛵', '🚲', '✈️', '🚁', '🚂'];
// Land animals only - no water animals
const animals = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐵', '🐔', '🐴', '🦌', '🐑', '🐐', '🦒'];

// Drop zones
const garage = {
    x: 50,
    y: 320,
    width: 300,
    height: 150,
    label: '🏠 GARAGE',
    color: '#78909C',
    acceptsVehicles: true
};

const grassArea = {
    x: 450,
    y: 260,  // Extended up to include trees
    width: 300,
    height: 210,  // Taller to include trees
    label: '🌳 GRASS',
    color: '#81C784',
    acceptsAnimals: true
};

// Initialize game
function initGame() {
    items = [];
    score = 0;
    gameComplete = false;
    celebrationParticles = [];
    message = '';
    messageTimer = 0;
    
    // Select random vehicles and animals
    const selectedVehicles = shuffleArray([...vehicles]).slice(0, 4);
    const selectedAnimals = shuffleArray([...animals]).slice(0, 4);
    
    totalItems = selectedVehicles.length + selectedAnimals.length;
    
    // Create items with random positions in the top area
    const allItems = [
        ...selectedVehicles.map(emoji => ({ emoji, type: 'vehicle' })),
        ...selectedAnimals.map(emoji => ({ emoji, type: 'animal' }))
    ];
    
    // Shuffle all items
    const shuffled = shuffleArray(allItems);
    
    // Position items in a grid at the top
    const startX = 80;
    const startY = 80;
    const spacing = 90;
    const itemsPerRow = 4;
    
    shuffled.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        
        items.push({
            emoji: item.emoji,
            type: item.type,
            x: startX + col * spacing + (row % 2) * 40,
            y: startY + row * 80,
            size: 50,
            sorted: false,
            dragging: false
        });
    });
}

// Shuffle array helper
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Draw the garage
function drawGarage() {
    // Garage shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(garage.x + 5, garage.y + 5, garage.width, garage.height, 15);
    ctx.fill();
    
    // Garage body
    ctx.fillStyle = garage.color;
    ctx.beginPath();
    ctx.roundRect(garage.x, garage.y, garage.width, garage.height, 15);
    ctx.fill();
    
    // Garage roof
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    ctx.moveTo(garage.x - 10, garage.y);
    ctx.lineTo(garage.x + garage.width / 2, garage.y - 40);
    ctx.lineTo(garage.x + garage.width + 10, garage.y);
    ctx.closePath();
    ctx.fill();
    
    // Garage door
    ctx.fillStyle = '#455A64';
    ctx.fillRect(garage.x + 20, garage.y + 30, garage.width - 40, garage.height - 50);
    
    // Door lines
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(garage.x + 20, garage.y + 30 + i * 25);
        ctx.lineTo(garage.x + garage.width - 20, garage.y + 30 + i * 25);
        ctx.stroke();
    }
    
    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(garage.label, garage.x + garage.width / 2, garage.y + garage.height + 30);
    ctx.fillStyle = '#455A64';
    ctx.font = '16px Arial';
    ctx.fillText('Vehicles go here!', garage.x + garage.width / 2, garage.y + garage.height + 50);
}

// Generate static grass decorations (called once at startup)
function generateGrassDecorations() {
    grassBlades = [];
    flowers = [];
    
    const flowerColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF85B3'];
    
    // Generate grass blade positions (in bottom portion of grass area)
    for (let i = 0; i < 25; i++) {
        grassBlades.push({
            x: grassArea.x + 20 + (i % 5) * 55 + Math.random() * 30,
            y: grassArea.y + 100 + Math.floor(i / 5) * 30 + Math.random() * 15
        });
    }
    
    // Generate flower positions (in bottom portion of grass area)
    for (let i = 0; i < 6; i++) {
        flowers.push({
            x: grassArea.x + 40 + (i % 3) * 90 + Math.random() * 20,
            y: grassArea.y + 120 + Math.floor(i / 3) * 50 + Math.random() * 20,
            color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
        });
    }
}

// Draw the grass area
function drawGrassArea() {
    // Grass shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(grassArea.x + 5, grassArea.y + 5, grassArea.width, grassArea.height, 15);
    ctx.fill();
    
    // Grass main - solid green color
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.roundRect(grassArea.x, grassArea.y, grassArea.width, grassArea.height, 15);
    ctx.fill();
    
    // Darker grass bottom section
    ctx.fillStyle = '#689F38';
    ctx.beginPath();
    ctx.roundRect(grassArea.x, grassArea.y + grassArea.height - 80, grassArea.width, 80, [0, 0, 15, 15]);
    ctx.fill();
    
    // Draw static grass blades (from pre-generated positions)
    ctx.fillStyle = '#8BC34A';
    grassBlades.forEach(blade => {
        ctx.beginPath();
        ctx.moveTo(blade.x, blade.y);
        ctx.lineTo(blade.x - 4, blade.y - 12);
        ctx.lineTo(blade.x + 4, blade.y - 12);
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw static flowers (from pre-generated positions)
    flowers.forEach(flower => {
        ctx.fillStyle = flower.color;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Left tree trunk
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(grassArea.x + 25, grassArea.y + 20, 20, 60);
    
    // Left tree foliage (multiple circles for fuller look)
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(grassArea.x + 35, grassArea.y + 10, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(grassArea.x + 50, grassArea.y + 20, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grassArea.x + 20, grassArea.y + 25, 22, 0, Math.PI * 2);
    ctx.fill();
    
    // Right tree trunk
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(grassArea.x + grassArea.width - 45, grassArea.y + 20, 20, 60);
    
    // Right tree foliage
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(grassArea.x + grassArea.width - 35, grassArea.y + 10, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(grassArea.x + grassArea.width - 50, grassArea.y + 20, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grassArea.x + grassArea.width - 20, grassArea.y + 25, 22, 0, Math.PI * 2);
    ctx.fill();
    
    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(grassArea.label, grassArea.x + grassArea.width / 2, grassArea.y + grassArea.height + 30);
    ctx.fillStyle = '#2E7D32';
    ctx.font = '16px Arial';
    ctx.fillText('Animals go here!', grassArea.x + grassArea.width / 2, grassArea.y + grassArea.height + 50);
}

// Draw items
function drawItems() {
    items.forEach(item => {
        if (!item.sorted) {
            // Item shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(item.x + 3, item.y + 3, item.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Item background
            ctx.fillStyle = item.dragging ? '#FFF9C4' : '#FFF';
            ctx.strokeStyle = item.type === 'vehicle' ? '#1976D2' : '#388E3C';
            ctx.lineWidth = item.dragging ? 4 : 3;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Category indicator
            const indicatorColor = item.type === 'vehicle' ? '#BBDEFB' : '#C8E6C9';
            ctx.fillStyle = indicatorColor;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.size / 2 - 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Emoji
            ctx.font = `${item.size - 15}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, item.x, item.y);
        }
    });
}

// Draw score
function drawScore() {
    // Score box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 100, 10, 200, 50, 10);
    ctx.fill();
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`✓ Sorted: ${score} / ${totalItems}`, canvas.width / 2, 42);
}

// Draw instructions
function drawInstructions() {
    if (!gameComplete && items.filter(i => !i.sorted).length > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(200, 230, 400, 40, 10);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👆 Drag items to the correct place!', canvas.width / 2, 256);
    }
}

// Draw message
function drawMessage() {
    if (messageTimer > 0) {
        messageTimer--;
        
        const bgColor = messageType === 'success' 
            ? 'rgba(76, 175, 80, 0.95)' 
            : 'rgba(244, 67, 54, 0.95)';
        
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 150, 180, 300, 60, 15);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, 218);
    }
}

// Draw celebration
function drawCelebration() {
    if (gameComplete) {
        // Add celebration particles
        if (Math.random() < 0.4) {
            celebrationParticles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + 20,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 10 - 5,
                size: Math.random() * 15 + 8,
                emoji: ['⭐', '🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 6)],
                life: 1
            });
        }
        
        // Update and draw particles
        celebrationParticles = celebrationParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.01;
            
            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.font = `${p.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(p.emoji, p.x, p.y);
                ctx.globalAlpha = 1;
                return true;
            }
            return false;
        });
        
        // Success message
        ctx.fillStyle = 'rgba(76, 175, 80, 0.95)';
        ctx.beginPath();
        ctx.roundRect(150, 150, 500, 150, 20);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 GREAT JOB! 🎉', canvas.width / 2, 200);
        
        ctx.font = 'bold 22px Arial';
        ctx.fillText('You sorted all the items correctly!', canvas.width / 2, 240);
        
        // Play again button
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.roundRect(300, 270, 200, 50, 15);
        ctx.fill();
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('🔄 PLAY AGAIN', canvas.width / 2, 302);
    }
}

// Draw drop zone highlights when dragging
function drawDropZoneHighlights() {
    if (draggedItem) {
        // Highlight garage if dragging vehicle
        if (draggedItem.type === 'vehicle') {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(garage.x - 5, garage.y - 5, garage.width + 10, garage.height + 10);
            ctx.setLineDash([]);
        }
        
        // Highlight grass if dragging animal
        if (draggedItem.type === 'animal') {
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(grassArea.x - 5, grassArea.y - 5, grassArea.width + 10, grassArea.height + 10);
            ctx.setLineDash([]);
        }
    }
}

// Check if point is in drop zone
function isInZone(x, y, zone) {
    return x >= zone.x && x <= zone.x + zone.width &&
           y >= zone.y && y <= zone.y + zone.height;
}

// Check if point is on item
function getItemAtPoint(x, y) {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!item.sorted) {
            const dx = x - item.x;
            const dy = y - item.y;
            if (Math.sqrt(dx * dx + dy * dy) < item.size / 2) {
                return item;
            }
        }
    }
    return null;
}

// Handle drop
function handleDrop() {
    if (!draggedItem) return;
    
    let correct = false;
    
    // Check if dropped in garage (for vehicles)
    if (draggedItem.type === 'vehicle' && isInZone(draggedItem.x, draggedItem.y, garage)) {
        correct = true;
        draggedItem.sorted = true;
        score++;
        message = '🚗 Vehicle in garage! ✓';
        messageType = 'success';
        messageTimer = 60;
    }
    // Check if dropped in grass (for animals)
    else if (draggedItem.type === 'animal' && isInZone(draggedItem.x, draggedItem.y, grassArea)) {
        correct = true;
        draggedItem.sorted = true;
        score++;
        message = '🐾 Animal in grass! ✓';
        messageType = 'success';
        messageTimer = 60;
    }
    // Wrong zone
    else if ((draggedItem.type === 'vehicle' && isInZone(draggedItem.x, draggedItem.y, grassArea)) ||
             (draggedItem.type === 'animal' && isInZone(draggedItem.x, draggedItem.y, garage))) {
        message = 'Oops! Try the other place! 🤔';
        messageType = 'error';
        messageTimer = 60;
        // Return to original position
        draggedItem.x = draggedItem.originalX;
        draggedItem.y = draggedItem.originalY;
    }
    
    // Check if game complete
    if (score === totalItems) {
        gameComplete = true;
    }
    
    draggedItem.dragging = false;
    draggedItem = null;
}

// Main game loop
function gameLoop() {
    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100, 50, 30, 0, Math.PI * 2);
    ctx.arc(130, 40, 40, 0, Math.PI * 2);
    ctx.arc(170, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(600, 60, 25, 0, Math.PI * 2);
    ctx.arc(630, 50, 35, 0, Math.PI * 2);
    ctx.arc(660, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sun
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(700, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun rays
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(700 + Math.cos(angle) * 50, 80 + Math.sin(angle) * 50);
        ctx.lineTo(700 + Math.cos(angle) * 65, 80 + Math.sin(angle) * 65);
        ctx.stroke();
    }
    
    // Draw drop zone highlights
    drawDropZoneHighlights();
    
    // Draw drop zones
    drawGarage();
    drawGrassArea();
    
    // Draw items
    drawItems();
    
    // Draw score
    drawScore();
    
    // Draw instructions
    drawInstructions();
    
    // Draw message
    drawMessage();
    
    // Draw celebration
    drawCelebration();
    
    requestAnimationFrame(gameLoop);
}

// Mouse/Touch event handlers
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    return {
        x: x * (canvas.width / rect.width),
        y: y * (canvas.height / rect.height)
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getEventPos(e);
    
    // Check play again button
    if (gameComplete && pos.x >= 300 && pos.x <= 500 && pos.y >= 270 && pos.y <= 320) {
        initGame();
        return;
    }
    
    const item = getItemAtPoint(pos.x, pos.y);
    if (item) {
        draggedItem = item;
        draggedItem.dragging = true;
        draggedItem.originalX = item.x;
        draggedItem.originalY = item.y;
        dragOffsetX = pos.x - item.x;
        dragOffsetY = pos.y - item.y;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggedItem) {
        const pos = getEventPos(e);
        draggedItem.x = pos.x - dragOffsetX;
        draggedItem.y = pos.y - dragOffsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    handleDrop();
});

canvas.addEventListener('mouseleave', () => {
    if (draggedItem) {
        draggedItem.x = draggedItem.originalX;
        draggedItem.y = draggedItem.originalY;
        draggedItem.dragging = false;
        draggedItem = null;
    }
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const pos = getEventPos(e);
    
    // Check play again button
    if (gameComplete && pos.x >= 300 && pos.x <= 500 && pos.y >= 270 && pos.y <= 320) {
        initGame();
        return;
    }
    
    const item = getItemAtPoint(pos.x, pos.y);
    if (item) {
        draggedItem = item;
        draggedItem.dragging = true;
        draggedItem.originalX = item.x;
        draggedItem.originalY = item.y;
        dragOffsetX = pos.x - item.x;
        dragOffsetY = pos.y - item.y;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (draggedItem) {
        const pos = getEventPos(e);
        draggedItem.x = pos.x - dragOffsetX;
        draggedItem.y = pos.y - dragOffsetY;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleDrop();
});

// Initialize and start game
generateGrassDecorations();
initGame();
gameLoop();
