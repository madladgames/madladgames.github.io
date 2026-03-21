// Speed Drag Race Game - Canvas-based drag racing with gantry, car selection, racing wheels
// Toddler-friendly: hold UP arrow to accelerate, race to the gantry finish line!

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
canvas.width = 900;
canvas.height = 500;

// ============================================================
// GAME CONFIGURATION
// ============================================================
const LANE_COUNT = 4;
const TRACK_LENGTH = 8000; // pixels of total track distance
const FINISH_LINE = TRACK_LENGTH - 400;
const GANTRY_X = FINISH_LINE; // Gantry sits at the finish

// Car definitions
const CAR_TYPES = {
    convertible: {
        name: 'Green Convertible',
        bodyColor: '#2E7D32',
        bodyColorDark: '#1B5E20',
        accentColor: '#66BB6A',
        topSpeed: 18,
        acceleration: 0.35,
        drawFn: 'drawConvertible'
    },
    beetle: {
        name: 'VW Beetle',
        bodyColor: '#1565C0',
        bodyColorDark: '#0D47A1',
        accentColor: '#42A5F5',
        topSpeed: 16,
        acceleration: 0.40,
        drawFn: 'drawBeetle'
    },
    muscle: {
        name: 'Muscle Car',
        bodyColor: '#C62828',
        bodyColorDark: '#8E0000',
        accentColor: '#EF5350',
        topSpeed: 20,
        acceleration: 0.30,
        drawFn: 'drawMuscleCar'
    }
};

// Opponent car colors (for AI)
const OPPONENT_COLORS = [
    { body: '#FF6F00', dark: '#E65100', accent: '#FFB74D' },
    { body: '#6A1B9A', dark: '#4A148C', accent: '#BA68C8' },
    { body: '#00838F', dark: '#006064', accent: '#4DD0E1' }
];

// ============================================================
// GAME STATE
// ============================================================
let gameState = 'carSelect'; // carSelect, ready, countdown, racing, finished
let selectedCar = 'convertible';
let countdown = 3;
let countdownTimer = 0;
let raceTime = 0;
let bestTime = parseFloat(localStorage.getItem('speedDragBestTime')) || 0;
let wins = parseInt(localStorage.getItem('speedDragWins')) || 0;

// Camera
let cameraX = 0;

// Player car
const player = {
    x: 60,
    lane: 1,
    speed: 0,
    finished: false,
    finishTime: 0
};

// AI opponents
let opponents = [];

// Input
const keys = {};

// Speed lines / particles
let speedLines = [];
let exhaustParticles = [];
let confetti = [];

// Christmas tree lights state (drag racing staging lights)
let treeLights = [0, 0, 0, 0]; // 0=off, 1=amber, 2=green

// ============================================================
// INPUT HANDLING
// ============================================================
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    if (gameState === 'carSelect' && e.key === ' ') {
        startReady();
    }
    if (gameState === 'ready' && e.key === ' ') {
        startCountdown();
    }
    if (gameState === 'finished' && e.key === ' ') {
        resetToCarSelect();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch / click support for toddlers
canvas.addEventListener('mousedown', () => { keys['touching'] = true; });
canvas.addEventListener('mouseup', () => { keys['touching'] = false; });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); keys['touching'] = true; });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); keys['touching'] = false; });

// Car selection buttons
document.querySelectorAll('.car-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedCar = btn.dataset.car;
        document.querySelectorAll('.car-select-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

// Start button
const startRaceBtn = document.getElementById('startRaceBtn');
if (startRaceBtn) {
    startRaceBtn.addEventListener('click', () => {
        if (gameState === 'carSelect') startReady();
        else if (gameState === 'ready') startCountdown();
        else if (gameState === 'finished') resetToCarSelect();
    });
}

// ============================================================
// GAME STATE TRANSITIONS
// ============================================================
function startReady() {
    gameState = 'ready';
    initRace();
}

function startCountdown() {
    gameState = 'countdown';
    countdown = 3;
    countdownTimer = 0;
    treeLights = [0, 0, 0, 0];
}

function initRace() {
    player.x = 60;
    player.speed = 0;
    player.finished = false;
    player.finishTime = 0;
    raceTime = 0;
    cameraX = 0;
    speedLines = [];
    exhaustParticles = [];
    confetti = [];

    // Create AI opponents
    opponents = [];
    const opponentTypes = Object.keys(CAR_TYPES).filter(t => t !== selectedCar);
    // Fill remaining lanes with opponents
    let laneIndex = 0;
    for (let i = 0; i < LANE_COUNT - 1; i++) {
        const carType = opponentTypes[i % opponentTypes.length];
        const carDef = CAR_TYPES[carType];
        const colors = OPPONENT_COLORS[i % OPPONENT_COLORS.length];
        opponents.push({
            x: 60,
            lane: laneIndex >= player.lane ? laneIndex + 1 : laneIndex,
            speed: 0,
            topSpeed: carDef.topSpeed * (0.75 + Math.random() * 0.35),
            acceleration: carDef.acceleration * (0.6 + Math.random() * 0.4),
            carType: carType,
            colors: colors,
            finished: false,
            finishTime: 0,
            reactionDelay: Math.random() * 30 + 10 // frames of delay before they start
        });
        laneIndex++;
        if (laneIndex === player.lane) laneIndex++;
    }
}

function resetToCarSelect() {
    gameState = 'carSelect';
    if (startRaceBtn) {
        startRaceBtn.textContent = '🏁 Start Race!';
    }
}

// ============================================================
// LANE GEOMETRY
// ============================================================
function getLaneY(lane) {
    const trackTop = 160;
    const trackBottom = 420;
    const laneHeight = (trackBottom - trackTop) / LANE_COUNT;
    return trackTop + lane * laneHeight + laneHeight / 2;
}

function getLaneHeight() {
    return (420 - 160) / LANE_COUNT;
}

// ============================================================
// DRAWING FUNCTIONS - RACING WHEELS
// ============================================================
function drawRacingWheel(x, y, radius) {
    // Outer tire - wide racing slick
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.3, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tire tread marks
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const tx = x + Math.cos(a) * radius * 0.9;
        const ty = y + Math.sin(a) * radius * 0.7;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Rim
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    
    // Rim spokes (5-spoke racing)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 5) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a + raceTime * 0.1) * radius * 0.5, y + Math.sin(a + raceTime * 0.1) * radius * 0.5);
        ctx.stroke();
    }
    
    // Center cap
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================================
// DRAWING FUNCTIONS - CARS
// ============================================================
function drawConvertible(x, y, scale, colors, isPlayer) {
    const c = isPlayer ? CAR_TYPES.convertible : { bodyColor: colors.body, bodyColorDark: colors.dark, accentColor: colors.accent };
    const w = 100 * scale;
    const h = 35 * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h + 8 * scale, w * 0.5, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main body (low, sleek convertible)
    ctx.fillStyle = isPlayer ? c.bodyColor : colors.body;
    ctx.beginPath();
    ctx.moveTo(5 * scale, h * 0.3);
    ctx.lineTo(15 * scale, -h * 0.1);
    ctx.lineTo(w * 0.85, -h * 0.1);
    ctx.lineTo(w - 2 * scale, h * 0.3);
    ctx.lineTo(w, h * 0.6);
    ctx.lineTo(w - 3 * scale, h);
    ctx.lineTo(3 * scale, h);
    ctx.lineTo(0, h * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Body stripe
    ctx.fillStyle = isPlayer ? c.accentColor : colors.accent;
    ctx.fillRect(10 * scale, h * 0.35, w * 0.8, 4 * scale);
    
    // NO roof - it's a convertible! Show interior
    ctx.fillStyle = '#4E342E';
    ctx.beginPath();
    ctx.moveTo(30 * scale, -h * 0.05);
    ctx.lineTo(35 * scale, -h * 0.4);
    ctx.lineTo(60 * scale, -h * 0.4);
    ctx.lineTo(65 * scale, -h * 0.05);
    ctx.closePath();
    ctx.fill();
    
    // Seats visible (leather)
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.arc(42 * scale, -h * 0.15, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(55 * scale, -h * 0.15, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Windshield (small, angled - racing style)
    ctx.fillStyle = 'rgba(135, 206, 250, 0.7)';
    ctx.beginPath();
    ctx.moveTo(63 * scale, -h * 0.1);
    ctx.lineTo(66 * scale, -h * 0.55);
    ctx.lineTo(70 * scale, -h * 0.55);
    ctx.lineTo(68 * scale, -h * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Headlights
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.ellipse(w - 4 * scale, h * 0.35, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail lights
    ctx.fillStyle = '#F44336';
    ctx.fillRect(1 * scale, h * 0.3, 4 * scale, 6 * scale);
    
    // Racing number (player only)
    if (isPlayer) {
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('1', w * 0.5, h * 0.75);
    }
    
    // Racing wheels
    drawRacingWheel(20 * scale, h + 2 * scale, 10 * scale);
    drawRacingWheel((w - 20 * scale), h + 2 * scale, 10 * scale);
    
    ctx.restore();
}

function drawBeetle(x, y, scale, colors, isPlayer) {
    const c = isPlayer ? CAR_TYPES.beetle : { bodyColor: colors.body, bodyColorDark: colors.dark, accentColor: colors.accent };
    const w = 90 * scale;
    const h = 35 * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h + 8 * scale, w * 0.45, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main body - VW Beetle iconic rounded shape
    ctx.fillStyle = isPlayer ? c.bodyColor : colors.body;
    ctx.beginPath();
    // Rear fender (iconic beetle hump)
    ctx.moveTo(5 * scale, h * 0.5);
    ctx.quadraticCurveTo(0, -h * 0.2, 15 * scale, -h * 0.5);
    ctx.quadraticCurveTo(25 * scale, -h * 0.9, 35 * scale, -h * 0.5);
    // Roof section
    ctx.lineTo(45 * scale, -h * 0.6);
    ctx.quadraticCurveTo(55 * scale, -h * 1.0, 65 * scale, -h * 0.5);
    // Front hood (sloping down - beetle style)
    ctx.quadraticCurveTo(75 * scale, -h * 0.2, w - 2 * scale, h * 0.3);
    // Bottom
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(w - 3 * scale, h);
    ctx.lineTo(3 * scale, h);
    ctx.lineTo(0, h * 0.7);
    ctx.closePath();
    ctx.fill();
    
    // Body accent line
    ctx.strokeStyle = isPlayer ? c.accentColor : colors.accent;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(10 * scale, h * 0.4);
    ctx.lineTo(w - 10 * scale, h * 0.4);
    ctx.stroke();
    
    // VW Logo circle on side
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(45 * scale, h * 0.2, 6 * scale, 0, Math.PI * 2);
    ctx.stroke();
    // VW inside
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${7 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VW', 45 * scale, h * 0.2);
    
    // Windows
    ctx.fillStyle = 'rgba(135, 206, 250, 0.7)';
    // Rear window (rounded)
    ctx.beginPath();
    ctx.ellipse(28 * scale, -h * 0.35, 8 * scale, 6 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Front window
    ctx.beginPath();
    ctx.moveTo(50 * scale, -h * 0.45);
    ctx.quadraticCurveTo(57 * scale, -h * 0.7, 63 * scale, -h * 0.35);
    ctx.lineTo(60 * scale, -h * 0.1);
    ctx.lineTo(48 * scale, -h * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Round headlights (iconic beetle feature)
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.arc(w - 5 * scale, h * 0.2, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Tail lights (round)
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(4 * scale, h * 0.3, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Front bumper
    ctx.fillStyle = '#999';
    ctx.fillRect(w - 4 * scale, h * 0.5, 4 * scale, 4 * scale);
    
    // Rear bumper
    ctx.fillRect(0, h * 0.5, 4 * scale, 4 * scale);
    
    // Racing wheels (big for a beetle!)
    drawRacingWheel(18 * scale, h + 2 * scale, 10 * scale);
    drawRacingWheel(w - 18 * scale, h + 2 * scale, 10 * scale);
    
    ctx.restore();
}

function drawMuscleCar(x, y, scale, colors, isPlayer) {
    const c = isPlayer ? CAR_TYPES.muscle : { bodyColor: colors.body, bodyColorDark: colors.dark, accentColor: colors.accent };
    const w = 105 * scale;
    const h = 35 * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h + 8 * scale, w * 0.5, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main body - aggressive muscle car
    ctx.fillStyle = isPlayer ? c.bodyColor : colors.body;
    ctx.beginPath();
    ctx.moveTo(3 * scale, h * 0.4);
    ctx.lineTo(8 * scale, -h * 0.1);
    ctx.lineTo(25 * scale, -h * 0.2);
    // Roof
    ctx.lineTo(35 * scale, -h * 0.7);
    ctx.lineTo(60 * scale, -h * 0.7);
    ctx.lineTo(70 * scale, -h * 0.2);
    // Hood with scoop
    ctx.lineTo(w - 5 * scale, -h * 0.1);
    ctx.lineTo(w, h * 0.4);
    // Bottom
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    
    // Hood scoop
    ctx.fillStyle = '#333';
    ctx.fillRect(72 * scale, -h * 0.3, 15 * scale, 6 * scale);
    ctx.fillStyle = isPlayer ? c.bodyColorDark : colors.dark;
    ctx.fillRect(74 * scale, -h * 0.28, 11 * scale, 3 * scale);
    
    // Racing stripes (two stripes down the body)
    ctx.fillStyle = isPlayer ? '#FFF' : 'rgba(255,255,255,0.4)';
    ctx.fillRect(40 * scale, -h * 0.65, 3 * scale, h * 1.3);
    ctx.fillRect(48 * scale, -h * 0.65, 3 * scale, h * 1.3);
    
    // Windows
    ctx.fillStyle = 'rgba(135, 206, 250, 0.6)';
    ctx.beginPath();
    ctx.moveTo(37 * scale, -h * 0.65);
    ctx.lineTo(58 * scale, -h * 0.65);
    ctx.lineTo(67 * scale, -h * 0.2);
    ctx.lineTo(32 * scale, -h * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Headlights (aggressive)
    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(w - 5 * scale, h * 0.1, 5 * scale, 5 * scale);
    ctx.fillRect(w - 5 * scale, h * 0.5, 5 * scale, 5 * scale);
    
    // Tail lights
    ctx.fillStyle = '#F44336';
    ctx.fillRect(0, h * 0.15, 4 * scale, 5 * scale);
    ctx.fillRect(0, h * 0.55, 4 * scale, 5 * scale);
    
    // Exhaust pipes (visible at rear)
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.ellipse(2 * scale, h + 3 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8 * scale, h + 3 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Racing wheels (extra wide rear)
    drawRacingWheel(20 * scale, h + 2 * scale, 10 * scale);
    drawRacingWheel(w - 20 * scale, h + 2 * scale, 12 * scale); // wider rear tires!
    
    ctx.restore();
}

// ============================================================
// DRAW GANTRY (FINISH LINE STRUCTURE)
// ============================================================
function drawGantry(screenX) {
    const gantryWidth = 30;
    const trackTop = 130;
    const trackBottom = 440;
    
    // Left support pillar
    ctx.fillStyle = '#555';
    ctx.fillRect(screenX - gantryWidth / 2, trackTop - 60, 12, trackBottom - trackTop + 80);
    // Right support pillar shadow
    ctx.fillStyle = '#444';
    ctx.fillRect(screenX - gantryWidth / 2 + 2, trackTop - 60, 8, trackBottom - trackTop + 80);
    
    // Right support pillar
    ctx.fillRect(screenX - gantryWidth / 2 + gantryWidth + 6, trackTop - 60, 12, trackBottom - trackTop + 80);
    ctx.fillStyle = '#444';
    ctx.fillRect(screenX - gantryWidth / 2 + gantryWidth + 8, trackTop - 60, 8, trackBottom - trackTop + 80);
    
    // Cross beam (top)
    const beamY = trackTop - 60;
    ctx.fillStyle = '#666';
    ctx.fillRect(screenX - gantryWidth / 2 - 5, beamY, gantryWidth + 28, 25);
    
    // Checkered banner
    const bannerW = gantryWidth + 18;
    const bannerH = 20;
    const bannerX = screenX - gantryWidth / 2;
    const bannerY = beamY + 2;
    const checkerSize = 8;
    for (let row = 0; row < Math.ceil(bannerH / checkerSize); row++) {
        for (let col = 0; col < Math.ceil(bannerW / checkerSize); col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#FFF';
            ctx.fillRect(
                bannerX + col * checkerSize,
                bannerY + row * checkerSize,
                checkerSize,
                Math.min(checkerSize, bannerH - row * checkerSize)
            );
        }
    }
    
    // "FINISH" sign
    ctx.fillStyle = '#E53935';
    ctx.fillRect(screenX - 28, beamY - 30, 75, 28);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', screenX + 10, beamY - 12);
    
    // Lights on the gantry (green when race is over)
    for (let i = 0; i < 3; i++) {
        const ly = beamY + 28 + i * 18;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(screenX + 10, ly, 7, 0, Math.PI * 2);
        ctx.fill();
        
        if (gameState === 'finished') {
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(screenX + 10, ly, 5, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX + 10, ly, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Checkered line on the ground
    for (let lane = 0; lane < LANE_COUNT; lane++) {
        const ly = getLaneY(lane);
        const lh = getLaneHeight();
        const lineX = screenX;
        for (let row = 0; row < Math.ceil(lh / 10); row++) {
            for (let col = 0; col < 3; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#FFF';
                ctx.fillRect(
                    lineX + col * 10,
                    ly - lh / 2 + row * 10,
                    10,
                    Math.min(10, ly + lh / 2 - (ly - lh / 2 + row * 10))
                );
            }
        }
    }
}

// ============================================================
// DRAW CHRISTMAS TREE (STAGING LIGHTS)
// ============================================================
function drawChristmasTree(x) {
    const treeX = x;
    const treeY = 80;
    
    // Pole
    ctx.fillStyle = '#444';
    ctx.fillRect(treeX - 4, treeY, 8, 340);
    
    // Light housing
    ctx.fillStyle = '#222';
    ctx.fillRect(treeX - 18, treeY - 10, 36, 180);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(treeX - 18, treeY - 10, 36, 180);
    
    // Staging lights (amber pair x 3, then green)
    const lightPositions = [
        { y: treeY + 10, state: treeLights[0], color: '#FF8F00' },
        { y: treeY + 50, state: treeLights[1], color: '#FF8F00' },
        { y: treeY + 90, state: treeLights[2], color: '#FF8F00' },
        { y: treeY + 130, state: treeLights[3], color: '#4CAF50' }
    ];
    
    lightPositions.forEach(light => {
        // Left light
        ctx.fillStyle = light.state ? light.color : '#333';
        ctx.beginPath();
        ctx.arc(treeX - 7, light.y, 8, 0, Math.PI * 2);
        ctx.fill();
        // Right light
        ctx.beginPath();
        ctx.arc(treeX + 7, light.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect when lit
        if (light.state) {
            ctx.fillStyle = light.color === '#4CAF50' 
                ? 'rgba(76, 175, 80, 0.3)' 
                : 'rgba(255, 143, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(treeX - 7, light.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(treeX + 7, light.y, 14, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ============================================================
// DRAW TRACK & ENVIRONMENT
// ============================================================
function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, '#1976D2');
    gradient.addColorStop(1, '#64B5F6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 160);
    
    // Sun
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(780, 50, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 213, 79, 0.2)';
    ctx.beginPath();
    ctx.arc(780, 50, 55, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds (parallax - move slower than camera)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    drawCloud(200 - cameraX * 0.05, 40, 25);
    drawCloud(500 - cameraX * 0.05, 60, 30);
    drawCloud(750 - cameraX * 0.05, 35, 20);
    drawCloud(1000 - cameraX * 0.05, 55, 28);
}

function drawCloud(x, y, size) {
    // Wrap clouds
    const wx = ((x % (canvas.width + 200)) + canvas.width + 200) % (canvas.width + 200) - 100;
    ctx.beginPath();
    ctx.arc(wx, y, size, 0, Math.PI * 2);
    ctx.arc(wx + size * 0.7, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.arc(wx + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

function drawGrandstands() {
    // Background grandstands (parallax)
    const parallax = 0.15;
    
    for (let i = 0; i < 20; i++) {
        const gx = i * 200 - (cameraX * parallax) % 200;
        if (gx < -200 || gx > canvas.width + 200) continue;
        
        // Stand structure
        ctx.fillStyle = '#78909C';
        ctx.fillRect(gx, 120, 150, 40);
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(gx + 5, 110, 140, 15);
        
        // Colorful crowd (tiny dots)
        const crowdColors = ['#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#FF9800', '#9C27B0', '#FFF'];
        for (let j = 0; j < 20; j++) {
            ctx.fillStyle = crowdColors[j % crowdColors.length];
            ctx.beginPath();
            ctx.arc(gx + 10 + j * 7, 125 + (j % 3) * 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawTrack() {
    const trackTop = 160;
    const trackBottom = 420;
    
    // Track surface
    ctx.fillStyle = '#37474F';
    ctx.fillRect(0, trackTop, canvas.width, trackBottom - trackTop);
    
    // Track texture (asphalt grain)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 50; i++) {
        const tx = (i * 47 + cameraX * 0.3) % canvas.width;
        const ty = trackTop + Math.random() * (trackBottom - trackTop);
        ctx.fillRect(tx, ty, 2, 1);
    }
    
    // Lane dividers
    const laneHeight = getLaneHeight();
    for (let i = 1; i < LANE_COUNT; i++) {
        const ly = trackTop + i * laneHeight;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(canvas.width, ly);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Track edges
    ctx.fillStyle = '#F44336';
    ctx.fillRect(0, trackTop - 5, canvas.width, 5);
    ctx.fillRect(0, trackBottom, canvas.width, 5);
    
    // Track edge white stripe
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, trackTop - 8, canvas.width, 3);
    ctx.fillRect(0, trackBottom + 5, canvas.width, 3);
    
    // Distance markers every 500 units
    for (let d = 0; d <= TRACK_LENGTH; d += 500) {
        const sx = d - cameraX;
        if (sx < -50 || sx > canvas.width + 50) continue;
        
        // Marker on track edge
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${d}m`, sx, trackTop - 12);
        
        // Small tick mark
        ctx.fillStyle = '#FFF';
        ctx.fillRect(sx, trackTop - 5, 2, 5);
    }
    
    // Starting line
    const startX = 50 - cameraX;
    if (startX > -50 && startX < canvas.width + 50) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(startX, trackTop, 4, trackBottom - trackTop);
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('START', startX, trackTop - 12);
    }
    
    // Draw the gantry
    const gantryScreenX = GANTRY_X - cameraX;
    if (gantryScreenX > -100 && gantryScreenX < canvas.width + 100) {
        drawGantry(gantryScreenX);
    }
}

function drawGrass() {
    // Top grass
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 148, canvas.width, 12);
    // Bottom grass  
    ctx.fillRect(0, 425, canvas.width, canvas.height - 425);
    
    // Grass texture
    ctx.fillStyle = '#43A047';
    for (let i = 0; i < 30; i++) {
        const gx = (i * 37 + cameraX * 0.2) % canvas.width;
        ctx.fillRect(gx, 430 + (i % 4) * 8, 3, 12);
    }
}

// ============================================================
// SPEED EFFECTS
// ============================================================
function updateSpeedEffects() {
    if (gameState !== 'racing') return;
    
    // Speed lines when going fast
    if (player.speed > 8) {
        for (let i = 0; i < Math.floor(player.speed / 3); i++) {
            speedLines.push({
                x: canvas.width + Math.random() * 50,
                y: 160 + Math.random() * 260,
                length: 20 + Math.random() * 40,
                speed: player.speed * 3 + Math.random() * 10,
                alpha: 0.3 + Math.random() * 0.4
            });
        }
    }
    
    // Update speed lines
    speedLines = speedLines.filter(line => {
        line.x -= line.speed;
        line.alpha -= 0.01;
        return line.x > -100 && line.alpha > 0;
    });
    
    // Exhaust particles from player car
    if (player.speed > 2) {
        const playerScreenX = player.x - cameraX;
        const playerY = getLaneY(player.lane);
        exhaustParticles.push({
            x: playerScreenX - 10,
            y: playerY + 8 + Math.random() * 6,
            vx: -2 - Math.random() * 3,
            vy: Math.random() * 2 - 1,
            size: 3 + Math.random() * 5,
            alpha: 0.6,
            color: player.speed > 14 ? '#FF6F00' : '#9E9E9E'
        });
    }
    
    // Update exhaust
    exhaustParticles = exhaustParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.3;
        p.alpha -= 0.02;
        return p.alpha > 0;
    });
}

function drawSpeedEffects() {
    // Speed lines
    speedLines.forEach(line => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length, line.y);
        ctx.stroke();
    });
    
    // Exhaust particles
    exhaustParticles.forEach(p => {
        ctx.fillStyle = p.color === '#FF6F00' 
            ? `rgba(255, 111, 0, ${p.alpha})`
            : `rgba(158, 158, 158, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================================
// CONFETTI
// ============================================================
function spawnConfetti() {
    for (let i = 0; i < 80; i++) {
        confetti.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 300,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 8,
            vy: 2 + Math.random() * 4,
            size: 4 + Math.random() * 8,
            color: ['#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63'][Math.floor(Math.random() * 7)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2
        });
    }
}

function updateConfetti() {
    confetti = confetti.filter(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.05;
        c.rotation += c.rotSpeed;
        return c.y < canvas.height + 20;
    });
}

function drawConfetti() {
    confetti.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
    });
}

// ============================================================
// DRAW A CAR IN A LANE
// ============================================================
function drawCarInLane(carType, screenX, lane, scale, colors, isPlayer) {
    const y = getLaneY(lane) - 20 * scale;
    
    switch (carType) {
        case 'convertible':
            drawConvertible(screenX - 50 * scale, y, scale, colors, isPlayer);
            break;
        case 'beetle':
            drawBeetle(screenX - 45 * scale, y, scale, colors, isPlayer);
            break;
        case 'muscle':
            drawMuscleCar(screenX - 52 * scale, y, scale, colors, isPlayer);
            break;
    }
}

// ============================================================
// HUD
// ============================================================
function drawHUD() {
    // Speed display
    const speedMPH = Math.floor(player.speed * 15);
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(15, 15, 200, 55, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED', 25, 35);
    
    ctx.fillStyle = player.speed > 14 ? '#FF5722' : player.speed > 8 ? '#FFC107' : '#4CAF50';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${speedMPH} MPH`, 25, 62);
    
    // Speed bar
    const barWidth = 180;
    const speedPercent = player.speed / CAR_TYPES[selectedCar].topSpeed;
    ctx.fillStyle = '#333';
    ctx.fillRect(22, 67, barWidth, 6);
    ctx.fillStyle = player.speed > 14 ? '#FF5722' : '#4CAF50';
    ctx.fillRect(22, 67, barWidth * speedPercent, 6);
    
    // Race timer
    if (gameState === 'racing' || gameState === 'finished') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(canvas.width - 180, 15, 165, 40, 10);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('TIME', canvas.width - 170, 33);
        
        ctx.fillStyle = '#FFD54F';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`${(raceTime / 60).toFixed(2)}s`, canvas.width - 170, 52);
    }
    
    // Position indicator (mini-map)
    const miniX = canvas.width / 2 - 150;
    const miniW = 300;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(miniX - 10, canvas.height - 35, miniW + 20, 25, 8);
    ctx.fill();
    
    // Mini track
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(miniX, canvas.height - 28, miniW, 10);
    
    // Finish marker
    const finishMiniX = miniX + (FINISH_LINE / TRACK_LENGTH) * miniW;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(finishMiniX, canvas.height - 30, 2, 14);
    
    // Player dot
    const playerMiniX = miniX + (player.x / TRACK_LENGTH) * miniW;
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(playerMiniX, canvas.height - 23, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Opponent dots
    opponents.forEach((opp, i) => {
        const ox = miniX + (opp.x / TRACK_LENGTH) * miniW;
        ctx.fillStyle = opp.colors.body;
        ctx.beginPath();
        ctx.arc(ox, canvas.height - 23, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Wins counter
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 100, canvas.height - 35, 90, 25, 8);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🏆 ${wins}`, canvas.width - 55, canvas.height - 18);
}

// ============================================================
// SCREEN STATES
// ============================================================
function drawCarSelectScreen() {
    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // Title
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('🏎️ SPEED DRAG RACE 🏁', canvas.width / 2, 60);
    
    ctx.fillStyle = '#FFD54F';
    ctx.font = '20px Arial';
    ctx.fillText('Choose your race car!', canvas.width / 2, 95);
    
    // Draw car previews
    const previewY = 200;
    const cars = ['convertible', 'beetle', 'muscle'];
    const labels = ['Green Convertible', 'VW Beetle', 'Muscle Car'];
    const previewColors = [
        { body: '#2E7D32', dark: '#1B5E20', accent: '#66BB6A' },
        { body: '#1565C0', dark: '#0D47A1', accent: '#42A5F5' },
        { body: '#C62828', dark: '#8E0000', accent: '#EF5350' }
    ];
    
    cars.forEach((car, i) => {
        const px = 150 + i * 250;
        
        // Selection highlight
        if (selectedCar === car) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.beginPath();
            ctx.roundRect(px - 80, previewY - 60, 170, 140, 15);
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Draw the car
        drawCarInLane(car, px, 0, 0.9, previewColors[i], true);
        
        // Fix y-position for preview
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(labels[i], px, previewY + 75);
        
        // Stats
        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText(`Top Speed: ${CAR_TYPES[car].topSpeed * 15} MPH`, px, previewY + 95);
    });
    
    // Instructions
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Press SPACE or click "Start Race" to begin!', canvas.width / 2, 420);
    
    // Best time
    if (bestTime > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`🏆 Best Time: ${bestTime.toFixed(2)}s | Wins: ${wins}`, canvas.width / 2, 460);
    }
}

function drawReadyScreen() {
    // Draw the tree and "READY" prompt
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('READY?', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to start countdown!', canvas.width / 2, canvas.height / 2 + 25);
    
    ctx.fillStyle = '#AAA';
    ctx.font = '18px Arial';
    ctx.fillText('Hold ⬆️ UP ARROW (or touch screen) to accelerate!', canvas.width / 2, canvas.height / 2 + 65);
}

function drawCountdownScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    if (countdown > 0) {
        ctx.fillStyle = '#FFEB3B';
        ctx.font = 'bold 120px Arial';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2 + 40);
    } else {
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 90px Arial';
        ctx.fillText('GO!', canvas.width / 2, canvas.height / 2 + 35);
    }
}

function drawFinishedScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    
    // Determine player placement
    let placement = 1;
    opponents.forEach(opp => {
        if (opp.finishTime > 0 && opp.finishTime < player.finishTime) {
            placement++;
        }
    });
    
    const placeText = ['1st', '2nd', '3rd', '4th'][placement - 1] || `${placement}th`;
    const placeEmoji = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '🏁';
    
    // Result
    ctx.font = '60px Arial';
    ctx.fillText(placeEmoji, canvas.width / 2, 100);
    
    ctx.fillStyle = placement === 1 ? '#FFD700' : '#FFF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`${placeText} Place!`, canvas.width / 2, 165);
    
    if (placement === 1) {
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('YOU WIN! 🎉', canvas.width / 2, 215);
    }
    
    // Time
    const timeStr = (player.finishTime / 60).toFixed(2);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(`${timeStr}s`, canvas.width / 2, 300);
    ctx.font = '22px Arial';
    ctx.fillText('Race Time', canvas.width / 2, 330);
    
    // Best time
    if (bestTime > 0) {
        const isBest = parseFloat(timeStr) <= bestTime;
        if (isBest && player.finishTime > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('⭐ NEW BEST TIME! ⭐', canvas.width / 2, 380);
        } else {
            ctx.fillStyle = '#9E9E9E';
            ctx.font = '18px Arial';
            ctx.fillText(`Best: ${bestTime.toFixed(2)}s`, canvas.width / 2, 380);
        }
    }
    
    // Restart prompt
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to race again!', canvas.width / 2, 440);
    
    drawConfetti();
}

// ============================================================
// GAME UPDATE
// ============================================================
function update() {
    if (gameState === 'countdown') {
        countdownTimer++;
        
        // Light up Christmas tree lights progressively
        const lightInterval = 50; // frames per light
        if (countdownTimer === 10) treeLights[0] = 1;
        if (countdownTimer === lightInterval) { treeLights[1] = 1; countdown = 2; }
        if (countdownTimer === lightInterval * 2) { treeLights[2] = 1; countdown = 1; }
        if (countdownTimer === lightInterval * 3) { 
            treeLights[3] = 1; 
            countdown = 0;
        }
        if (countdownTimer === lightInterval * 3 + 30) {
            gameState = 'racing';
            raceTime = 0;
            // Play engine rev sound
            playRevSound();
        }
        return;
    }
    
    if (gameState !== 'racing') return;
    
    raceTime++;
    
    // Player input
    if (keys['ArrowUp'] || keys['touching']) {
        player.speed += CAR_TYPES[selectedCar].acceleration;
        if (player.speed > CAR_TYPES[selectedCar].topSpeed) {
            player.speed = CAR_TYPES[selectedCar].topSpeed;
        }
    } else {
        // Friction / coast
        player.speed *= 0.985;
        if (player.speed < 0.1) player.speed = 0;
    }
    
    // Update player position
    player.x += player.speed;
    
    // Check player finish
    if (!player.finished && player.x >= FINISH_LINE) {
        player.finished = true;
        player.finishTime = raceTime;
    }
    
    // Update AI opponents
    opponents.forEach((opp, i) => {
        if (opp.reactionDelay > 0) {
            opp.reactionDelay--;
            return;
        }
        
        // AI acceleration with some variation
        opp.speed += opp.acceleration * (0.85 + Math.random() * 0.3);
        if (opp.speed > opp.topSpeed) opp.speed = opp.topSpeed;
        
        // Add slight speed variation for excitement
        opp.speed += (Math.random() - 0.5) * 0.3;
        if (opp.speed < 0) opp.speed = 0;
        if (opp.speed > opp.topSpeed * 1.05) opp.speed = opp.topSpeed;
        
        opp.x += opp.speed;
        
        if (!opp.finished && opp.x >= FINISH_LINE) {
            opp.finished = true;
            opp.finishTime = raceTime;
        }
    });
    
    // Camera follows player
    const targetCameraX = player.x - 200;
    cameraX += (targetCameraX - cameraX) * 0.1;
    if (cameraX < 0) cameraX = 0;
    
    // Speed effects
    updateSpeedEffects();
    
    // Check if all cars finished
    const allFinished = player.finished && opponents.every(o => o.finished);
    if (allFinished || (player.finished && raceTime - player.finishTime > 180)) {
        finishRace();
    }
    
    // Engine sound based on speed
    if (raceTime % 15 === 0 && player.speed > 5) {
        playEngineSound(player.speed);
    }
}

function finishRace() {
    gameState = 'finished';
    
    const timeStr = (player.finishTime / 60).toFixed(2);
    const timeVal = parseFloat(timeStr);
    
    // Check if player won
    let placement = 1;
    opponents.forEach(opp => {
        if (opp.finishTime > 0 && opp.finishTime < player.finishTime) {
            placement++;
        }
    });
    
    if (placement === 1) {
        wins++;
        localStorage.setItem('speedDragWins', wins);
        spawnConfetti();
        playVictorySound();
    }
    
    // Best time
    if (bestTime === 0 || timeVal < bestTime) {
        bestTime = timeVal;
        localStorage.setItem('speedDragBestTime', bestTime);
    }
    
    if (startRaceBtn) {
        startRaceBtn.textContent = '🔄 Race Again!';
    }
}

// ============================================================
// SOUND EFFECTS
// ============================================================
function playRevSound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.5);
        osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.8);
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.8);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.8);
    } catch (e) {}
}

function playEngineSound(speed) {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sawtooth';
        const freq = 60 + speed * 12;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ac.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.1);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.1);
    } catch (e) {}
}

function playVictorySound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.2, ac.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + i * 0.15 + 0.3);
            osc.start(ac.currentTime + i * 0.15);
            osc.stop(ac.currentTime + i * 0.15 + 0.3);
        });
    } catch (e) {}
}

// ============================================================
// MAIN GAME LOOP
// ============================================================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'carSelect') {
        // Draw static track scene behind the selection
        drawSky();
        drawGrandstands();
        drawGrass();
        drawTrack();
        drawCarSelectScreen();
    } else {
        // Draw the full scene
        drawSky();
        drawGrandstands();
        drawGrass();
        drawTrack();
        
        // Draw speed effects behind cars
        drawSpeedEffects();
        
        // Draw Christmas tree near the start
        const treeScreenX = 30 - cameraX;
        if (treeScreenX > -50 && treeScreenX < canvas.width + 50) {
            drawChristmasTree(treeScreenX);
        }
        
        // Draw opponents
        opponents.forEach(opp => {
            const screenX = opp.x - cameraX;
            if (screenX > -150 && screenX < canvas.width + 150) {
                drawCarInLane(opp.carType, screenX, opp.lane, 0.85, opp.colors, false);
            }
        });
        
        // Draw player car
        const playerScreenX = player.x - cameraX;
        drawCarInLane(selectedCar, playerScreenX, player.lane, 0.95, null, true);
        
        // Draw HUD
        drawHUD();
        
        // Update game logic
        update();
        
        // Overlays
        if (gameState === 'ready') {
            drawReadyScreen();
        } else if (gameState === 'countdown') {
            drawCountdownScreen();
        } else if (gameState === 'finished') {
            updateConfetti();
            drawFinishedScreen();
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Start!
gameLoop();
