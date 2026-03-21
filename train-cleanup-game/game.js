// Train Cleanup Game
// Drive a locomotive through a track maze, collect fallen branches, dump them!
// Controls: UP = go forward, LEFT/RIGHT = choose direction at junctions

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 620;

// ============================================================
// CONSTANTS
// ============================================================
const N_BIT = 1, E_BIT = 2, S_BIT = 4, W_BIT = 8;
const HEAD_N = 0, HEAD_E = 1, HEAD_S = 2, HEAD_W = 3;
const headingBit = [N_BIT, E_BIT, S_BIT, W_BIT];
const oppositeHead = [HEAD_S, HEAD_W, HEAD_N, HEAD_E];
const dRow = [-1, 0, 1, 0];
const dCol = [0, 1, 0, -1];
const headingAngle = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

const CELL = 70;
const COLS = 9;
const ROWS = 8;
const OFFSET_X = Math.floor((canvas.width - COLS * CELL) / 2);
const OFFSET_Y = 20;
const MOVE_SPEED = 0.04;

// ============================================================
// MAZE DEFINITION
// ============================================================
const trackMap = [
    //  0          1              2              3              4              5              6              7          8
    [0, S_BIT | E_BIT, E_BIT | W_BIT, E_BIT | W_BIT, S_BIT | W_BIT, 0, 0, 0, 0],                                   // row 0
    [0, N_BIT | S_BIT, 0, 0, N_BIT | S_BIT, 0, 0, 0, 0],                                                            // row 1
    [S_BIT | E_BIT, N_BIT | E_BIT | W_BIT, E_BIT | W_BIT, E_BIT | W_BIT | S_BIT, N_BIT | E_BIT | W_BIT, E_BIT | W_BIT | S_BIT, E_BIT | W_BIT, S_BIT | W_BIT, 0], // row 2
    [N_BIT | S_BIT, 0, 0, N_BIT | S_BIT, 0, N_BIT | S_BIT, 0, N_BIT | S_BIT, 0],                                   // row 3
    [N_BIT | E_BIT, E_BIT | W_BIT, E_BIT | W_BIT | S_BIT, N_BIT | W_BIT, 0, N_BIT | E_BIT, E_BIT | W_BIT, N_BIT | W_BIT, 0],  // row 4
    [0, 0, N_BIT | S_BIT, 0, 0, 0, 0, 0, 0],                                                                        // row 5
    [0, 0, N_BIT | E_BIT, E_BIT | W_BIT, E_BIT | W_BIT, E_BIT | W_BIT, E_BIT | W_BIT, S_BIT | W_BIT, 0],           // row 6
    [0, 0, 0, 0, 0, 0, 0, N_BIT, 0],                                                                                 // row 7
];

// Branches on the track
let branches = [];
const TOTAL_BRANCHES = 5;
const DUMP = { row: 7, col: 7 };
const START = { row: 0, col: 1 };

// Decorative trees on empty cells
const trees = [
    { row: 0, col: 0 }, { row: 0, col: 6 }, { row: 0, col: 8 },
    { row: 1, col: 2 }, { row: 1, col: 6 }, { row: 1, col: 8 },
    { row: 3, col: 4 }, { row: 3, col: 8 },
    { row: 4, col: 4 }, { row: 4, col: 8 },
    { row: 5, col: 0 }, { row: 5, col: 4 }, { row: 5, col: 7 },
    { row: 6, col: 0 }, { row: 6, col: 8 },
    { row: 7, col: 1 }, { row: 7, col: 4 },
];

// ============================================================
// GAME STATE
// ============================================================
let gameState = 'playing'; // playing, victory
let collectedCount = 0;
let messageText = '';
let messageTimer = 0;
let frameCount = 0;

// Train
let train = {
    row: START.row,
    col: START.col,
    heading: HEAD_E,
    selectedExit: HEAD_E,
    moving: false,
    progress: 0,
    fromRow: START.row,
    fromCol: START.col,
    targetRow: 0,
    targetCol: 2,
    atJunction: false,
    exitOptions: [],
};

let wantToMove = false;
let posHistory = [];
const CARGO_TRAIL_DELAY = 16;

// Particles
let smokePuffs = [];
let confetti = [];
let pickupSparkles = [];

// ============================================================
// UTILITY
// ============================================================
function cellCenter(row, col) {
    return {
        x: OFFSET_X + col * CELL + CELL / 2,
        y: OFFSET_Y + row * CELL + CELL / 2
    };
}

function getExitOptions(row, col, entryHeading) {
    const cell = trackMap[row]?.[col];
    if (!cell) return [];
    const entryBit = headingBit[oppositeHead[entryHeading]];
    const exitMask = cell & ~entryBit;
    const options = [];
    for (let h = 0; h < 4; h++) {
        if (exitMask & headingBit[h]) options.push(h);
    }
    return options;
}

function getAllExits(row, col) {
    const cell = trackMap[row]?.[col];
    if (!cell) return [];
    const options = [];
    for (let h = 0; h < 4; h++) {
        if (cell & headingBit[h]) options.push(h);
    }
    return options;
}

function canMove(fromRow, fromCol, heading) {
    const cell = trackMap[fromRow]?.[fromCol];
    if (!cell || !(cell & headingBit[heading])) return false;
    const nr = fromRow + dRow[heading];
    const nc = fromCol + dCol[heading];
    const targetCell = trackMap[nr]?.[nc];
    if (!targetCell) return false;
    return !!(targetCell & headingBit[oppositeHead[heading]]);
}

function showMessage(text) {
    messageText = text;
    messageTimer = 180; // 3 seconds at 60fps
}

// ============================================================
// INITIALIZATION
// ============================================================
function initGame() {
    train.row = START.row;
    train.col = START.col;
    train.heading = HEAD_E;
    train.selectedExit = HEAD_E;
    train.moving = false;
    train.progress = 0;
    train.atJunction = false;
    train.exitOptions = [];

    collectedCount = 0;
    gameState = 'playing';
    messageText = '';
    messageTimer = 0;
    smokePuffs = [];
    confetti = [];
    pickupSparkles = [];
    frameCount = 0;

    // Reset branches
    branches = [
        { row: 0, col: 3, collected: false },
        { row: 3, col: 0, collected: false },
        { row: 2, col: 6, collected: false },
        { row: 4, col: 1, collected: false },
        { row: 6, col: 5, collected: false },
    ];

    // Initialize position history (cargo car behind locomotive)
    const startPos = cellCenter(START.row, START.col);
    posHistory = [];
    for (let i = 0; i < CARGO_TRAIL_DELAY + 10; i++) {
        const t = Math.min(1, i / CARGO_TRAIL_DELAY);
        posHistory.push({
            x: startPos.x - CELL * 0.6 * (1 - t),
            y: startPos.y,
            angle: headingAngle[HEAD_E]
        });
    }

    // Determine starting junction
    arriveAtCell(START.row, START.col, null);
    showMessage('Press ⬆️ to drive the train!');
}

// ============================================================
// INPUT HANDLING
// ============================================================
const keys = {};

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
        keys['ArrowUp'] = true;
        handleUp();
    }
    if (e.key === 'ArrowLeft') handleTurn(-1);
    if (e.key === 'ArrowRight') handleTurn(1);
    if (e.key === ' ' && gameState === 'victory') initGame();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
        keys['ArrowUp'] = false;
        wantToMove = false;
    }
});

// Touch button support
const btnLeft = document.getElementById('btnLeft');
const btnUp = document.getElementById('btnUp');
const btnRight = document.getElementById('btnRight');
if (btnLeft) btnLeft.addEventListener('click', () => handleTurn(-1));
if (btnUp) btnUp.addEventListener('click', () => handleUp());
if (btnRight) btnRight.addEventListener('click', () => handleTurn(1));

// Canvas touch for mobile - treat as UP
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleUp(); });

function handleUp() {
    if (gameState !== 'playing') return;
    wantToMove = true;
    if (train.atJunction) {
        train.heading = train.selectedExit;
        train.atJunction = false;
        startMove();
    } else if (!train.moving) {
        startMove();
    }
}

function handleTurn(direction) {
    if (gameState !== 'playing' || !train.atJunction) return;
    const opts = train.exitOptions;
    if (opts.length <= 1) return;

    let current = train.selectedExit;
    for (let i = 0; i < 4; i++) {
        current = (current + direction + 4) % 4;
        if (opts.includes(current)) {
            train.selectedExit = current;
            playClickSound();
            break;
        }
    }
}

// ============================================================
// TRAIN MOVEMENT LOGIC
// ============================================================
function startMove() {
    if (train.moving) return;
    if (!canMove(train.row, train.col, train.selectedExit)) {
        // Can't move that way - try to turn around at dead end
        const heading = train.selectedExit;
        const revHeading = oppositeHead[heading];
        if (canMove(train.row, train.col, revHeading)) {
            train.selectedExit = revHeading;
            train.heading = revHeading;
        } else {
            return;
        }
    }

    train.heading = train.selectedExit;
    train.moving = true;
    train.progress = 0;
    train.fromRow = train.row;
    train.fromCol = train.col;
    train.targetRow = train.row + dRow[train.heading];
    train.targetCol = train.col + dCol[train.heading];
    train.atJunction = false;

    playChugSound();
}

function arriveAtCell(row, col, fromHeading) {
    train.row = row;
    train.col = col;
    train.moving = false;
    train.progress = 0;

    // Check for branch pickup
    branches.forEach(b => {
        if (b.row === row && b.col === col && !b.collected) {
            b.collected = true;
            collectedCount++;
            showMessage(`🌿 Branch collected! ${collectedCount}/${TOTAL_BRANCHES}`);
            playPickupSound();
            // Sparkle effect
            const pos = cellCenter(row, col);
            for (let i = 0; i < 8; i++) {
                pickupSparkles.push({
                    x: pos.x, y: pos.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    size: 3 + Math.random() * 4,
                    alpha: 1,
                    color: Math.random() > 0.5 ? '#4CAF50' : '#8D6E63'
                });
            }
            if (collectedCount >= TOTAL_BRANCHES) {
                showMessage('🎉 All branches collected! Drive to the DUMP! 🗑️');
            }
        }
    });

    // Check for dump
    if (row === DUMP.row && col === DUMP.col) {
        if (collectedCount >= TOTAL_BRANCHES) {
            gameState = 'victory';
            showMessage('🎉 All branches dumped! Great job!');
            spawnConfetti();
            playVictorySound();
            return;
        } else {
            showMessage(`Collect all branches first! ${collectedCount}/${TOTAL_BRANCHES}`);
        }
    }

    // Determine exits
    let options;
    if (fromHeading === null) {
        options = getAllExits(row, col);
    } else {
        options = getExitOptions(row, col, fromHeading);
    }
    train.exitOptions = options;

    if (options.length === 0) {
        // Dead end - turn around
        if (fromHeading !== null) {
            train.heading = oppositeHead[fromHeading];
            train.selectedExit = train.heading;
        }
        train.atJunction = false;
    } else if (options.length === 1) {
        // Single exit - auto select
        train.heading = options[0];
        train.selectedExit = options[0];
        train.atJunction = false;
        if (wantToMove || keys['ArrowUp']) {
            startMove();
        }
    } else {
        // Junction - multiple exits
        train.atJunction = true;
        if (fromHeading !== null && options.includes(fromHeading)) {
            train.selectedExit = fromHeading; // default straight
        } else {
            train.selectedExit = options[0];
        }
        train.heading = train.selectedExit;
        wantToMove = false;
    }
}

function getTrainPosition() {
    if (train.moving) {
        const from = cellCenter(train.fromRow, train.fromCol);
        const to = cellCenter(train.targetRow, train.targetCol);
        return {
            x: from.x + (to.x - from.x) * train.progress,
            y: from.y + (to.y - from.y) * train.progress
        };
    }
    return cellCenter(train.row, train.col);
}

function getTrainAngle() {
    if (train.moving) return headingAngle[train.heading];
    if (train.atJunction) return headingAngle[train.selectedExit];
    return headingAngle[train.heading];
}

// ============================================================
// GAME UPDATE
// ============================================================
function update() {
    frameCount++;

    if (gameState === 'victory') {
        updateConfetti();
        updateSparkles();
        return;
    }

    if (gameState !== 'playing') return;

    // Move train
    if (train.moving) {
        train.progress += MOVE_SPEED;
        if (train.progress >= 1) {
            train.progress = 1;
            arriveAtCell(train.targetRow, train.targetCol, train.heading);
        }
    }

    // Held UP - continuous movement
    if (keys['ArrowUp'] && !train.moving && !train.atJunction && gameState === 'playing') {
        wantToMove = true;
        startMove();
    }

    // Smoke from chimney
    if (train.moving && Math.random() < 0.35) {
        const pos = getTrainPosition();
        const angle = getTrainAngle();
        smokePuffs.push({
            x: pos.x - Math.cos(angle) * 12,
            y: pos.y - Math.sin(angle) * 12 - 5,
            size: 3 + Math.random() * 3,
            alpha: 0.5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 0.8
        });
    }

    // Update smoke
    smokePuffs = smokePuffs.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.15;
        p.alpha -= 0.012;
        return p.alpha > 0;
    });

    // Update sparkles
    updateSparkles();

    // Update position history for cargo car
    const pos = getTrainPosition();
    posHistory.push({ x: pos.x, y: pos.y, angle: getTrainAngle() });
    if (posHistory.length > 300) posHistory.shift();

    // Message timer
    if (messageTimer > 0) messageTimer--;
}

function updateSparkles() {
    pickupSparkles = pickupSparkles.filter(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.025;
        return s.alpha > 0;
    });
}

// ============================================================
// CONFETTI
// ============================================================
function spawnConfetti() {
    for (let i = 0; i < 60; i++) {
        confetti.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 400,
            y: -20 - Math.random() * 80,
            vx: (Math.random() - 0.5) * 6,
            vy: 2 + Math.random() * 3,
            size: 4 + Math.random() * 7,
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
        c.vy += 0.04;
        c.rotation += c.rotSpeed;
        return c.y < canvas.height + 20;
    });
}

// ============================================================
// DRAWING - BACKGROUND
// ============================================================
function drawBackground() {
    // Grass
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#66BB6A');
    gradient.addColorStop(0.5, '#4CAF50');
    gradient.addColorStop(1, '#388E3C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grass texture
    ctx.fillStyle = 'rgba(56, 142, 60, 0.4)';
    for (let i = 0; i < 80; i++) {
        const gx = (i * 53 + frameCount * 0.1) % canvas.width;
        const gy = (i * 37) % canvas.height;
        ctx.fillRect(gx, gy, 2, 6);
    }

    // Small flowers
    const flowerColors = ['#FFF176', '#F48FB1', '#CE93D8', '#81D4FA'];
    for (let i = 0; i < 20; i++) {
        const fx = (i * 97 + 20) % canvas.width;
        const fy = (i * 73 + 15) % canvas.height;
        // Only draw on non-track areas
        const gr = Math.floor((fy - OFFSET_Y) / CELL);
        const gc = Math.floor((fx - OFFSET_X) / CELL);
        if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS && trackMap[gr]?.[gc]) continue;
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
// DRAWING - TREES
// ============================================================
function drawTree(row, col) {
    const cx = OFFSET_X + col * CELL + CELL / 2;
    const cy = OFFSET_Y + row * CELL + CELL / 2;

    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(cx - 4, cy + 2, 8, 14);

    // Canopy layers
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 10, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================================
// DRAWING - TRACKS
// ============================================================
function drawTrackCell(row, col) {
    const cell = trackMap[row][col];
    if (!cell) return;

    const cx = OFFSET_X + col * CELL + CELL / 2;
    const cy = OFFSET_Y + row * CELL + CELL / 2;
    const half = CELL / 2;

    // Draw each connected direction as a half-segment from center to edge
    for (let h = 0; h < 4; h++) {
        if (!(cell & headingBit[h])) continue;

        const ex = cx + dCol[h] * half;
        const ey = cy + dRow[h] * half;
        const isVert = (h === HEAD_N || h === HEAD_S);

        // Gravel bed
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 28;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Railroad ties
        const tieCount = 3;
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let t = 1; t <= tieCount; t++) {
            const frac = t / (tieCount + 1);
            const tx = cx + (ex - cx) * frac;
            const ty = cy + (ey - cy) * frac;
            if (isVert) {
                ctx.beginPath();
                ctx.moveTo(tx - 14, ty);
                ctx.lineTo(tx + 14, ty);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(tx, ty - 14);
                ctx.lineTo(tx, ty + 14);
                ctx.stroke();
            }
        }

        // Rails (2 parallel silver lines)
        const railOff = 8;
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        if (isVert) {
            ctx.beginPath(); ctx.moveTo(cx - railOff, cy); ctx.lineTo(ex - railOff, ey); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + railOff, cy); ctx.lineTo(ex + railOff, ey); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.moveTo(cx, cy - railOff); ctx.lineTo(ex, ey - railOff); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy + railOff); ctx.lineTo(ex, ey + railOff); ctx.stroke();
        }
    }

    // Center hub where tracks meet
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Hub bolts
    ctx.fillStyle = '#BDBDBD';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawAllTracks() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawTrackCell(r, c);
        }
    }

    // START label
    const startPos = cellCenter(START.row, START.col);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(startPos.x - 28, startPos.y + 22, 56, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚂 START', startPos.x, startPos.y + 32);
}

// ============================================================
// DRAWING - BRANCHES
// ============================================================
function drawBranch(row, col) {
    const cx = OFFSET_X + col * CELL + CELL / 2;
    const cy = OFFSET_Y + row * CELL + CELL / 2;

    // Glow to make them visible
    ctx.fillStyle = 'rgba(255, 235, 59, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    // Main branch stick
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 6);
    ctx.lineTo(cx + 14, cy - 6);
    ctx.stroke();

    // Small twigs
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy);
    ctx.lineTo(cx - 7, cy - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 3);
    ctx.lineTo(cx + 12, cy - 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 3);
    ctx.lineTo(cx - 13, cy + 11);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath(); ctx.arc(cx - 7, cy - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 12, cy - 14, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath(); ctx.arc(cx - 14, cy + 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 4, cy - 8, 3, 0, Math.PI * 2); ctx.fill();

    // Bobbing animation indicator
    const bob = Math.sin(frameCount * 0.05) * 2;
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌿', cx, cy - 18 + bob);
}

// ============================================================
// DRAWING - DUMP
// ============================================================
function drawDump() {
    const cx = OFFSET_X + DUMP.col * CELL + CELL / 2;
    const cy = OFFSET_Y + DUMP.row * CELL + CELL / 2;

    // Dump area
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.roundRect(cx - 28, cy - 22, 56, 44, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 28, cy - 22, 56, 44, 6);
    ctx.stroke();

    // Inside color
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(cx - 24, cy - 18, 48, 36);

    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DUMP', cx, cy - 8);
    ctx.font = '18px Arial';
    ctx.fillText('🗑️', cx, cy + 10);

    // Glow when all branches collected
    if (collectedCount >= TOTAL_BRANCHES && gameState === 'playing') {
        const pulse = 0.3 + Math.sin(frameCount * 0.08) * 0.15;
        ctx.fillStyle = `rgba(255, 235, 59, ${pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD600';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('DRIVE HERE!', cx, cy + 28);
    }
}

// ============================================================
// DRAWING - LOCOMOTIVE
// ============================================================
function drawLocomotive(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.roundRect(-18, -12, 36, 24, 3);
    ctx.fill();

    // Cabin (rear)
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(-18, -12, 16, 24);

    // Cabin window
    ctx.fillStyle = '#90CAF9';
    ctx.fillRect(-15, -8, 10, 16);
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 1;
    ctx.strokeRect(-15, -8, 10, 16);

    // Boiler (middle)
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(-2, -10, 16, 20);

    // Chimney/smokestack
    ctx.fillStyle = '#333';
    ctx.fillRect(4, -16, 8, 7);
    ctx.fillStyle = '#555';
    ctx.fillRect(2, -18, 12, 4);

    // Cowcatcher (front)
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.lineTo(24, -6);
    ctx.lineTo(24, 6);
    ctx.lineTo(18, 12);
    ctx.closePath();
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#FFEE58';
    ctx.beginPath();
    ctx.arc(22, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Headlight glow
    ctx.fillStyle = 'rgba(255, 238, 88, 0.3)';
    ctx.beginPath();
    ctx.arc(22, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#212121';
    const wheelR = 4.5;
    [-10, 8].forEach(wx => {
        [-13, 13].forEach(wy => {
            ctx.beginPath();
            ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // Wheel rims
    ctx.fillStyle = '#757575';
    [-10, 8].forEach(wx => {
        [-13, 13].forEach(wy => {
            ctx.beginPath();
            ctx.arc(wx, wy, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // Number "1"
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 8, 0);

    ctx.restore();
}

// ============================================================
// DRAWING - CARGO CAR
// ============================================================
function drawCargoCar(x, y, angle, branchCount) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(1, 3, 17, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body frame
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 20, 2);
    ctx.fill();

    // Inside (cargo area)
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(-14, -8, 28, 16);

    // Draw branches inside
    if (branchCount > 0) {
        for (let i = 0; i < Math.min(branchCount, 5); i++) {
            const bx = -10 + (i % 3) * 9;
            const by = -5 + Math.floor(i / 3) * 8;
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 7, by + 3);
            ctx.stroke();
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(bx + 6, by - 1, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // "EMPTY" text
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EMPTY', 0, 0);
    }

    // Wheels
    ctx.fillStyle = '#212121';
    [-9, 9].forEach(wx => {
        [-12, 12].forEach(wy => {
            ctx.beginPath();
            ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // Coupling (connecting rod at front)
    ctx.fillStyle = '#757575';
    ctx.fillRect(14, -2, 5, 4);

    ctx.restore();
}

// ============================================================
// DRAWING - JUNCTION INDICATOR
// ============================================================
function drawJunctionIndicator() {
    if (!train.atJunction || gameState !== 'playing') return;

    const pos = cellCenter(train.row, train.col);

    // Draw direction arrows for each option
    train.exitOptions.forEach(h => {
        const isSelected = (h === train.selectedExit);
        const dx = dCol[h] * 28;
        const dy = dRow[h] * 28;
        const ax = pos.x + dx;
        const ay = pos.y + dy;

        // Arrow triangle
        const tipX = ax + dCol[h] * 12;
        const tipY = ay + dRow[h] * 12;
        const perpX = -dRow[h];
        const perpY = dCol[h];

        if (isSelected) {
            // Glow
            ctx.fillStyle = 'rgba(255, 214, 0, 0.35)';
            ctx.beginPath();
            ctx.arc(ax, ay, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = isSelected ? '#FFD600' : 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(ax + perpX * 8, ay + perpY * 8);
        ctx.lineTo(ax - perpX * 8, ay - perpY * 8);
        ctx.closePath();
        ctx.fill();

        if (isSelected) {
            ctx.strokeStyle = '#F57F17';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Hint text
    const bob = Math.sin(frameCount * 0.06) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(pos.x - 50, pos.y - 48 + bob, 100, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#FFD600';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⬅️ choose ➡️ then ⬆️', pos.x, pos.y - 38 + bob);
}

// ============================================================
// DRAWING - SMOKE & SPARKLES
// ============================================================
function drawSmoke() {
    smokePuffs.forEach(p => {
        ctx.fillStyle = `rgba(220, 220, 220, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawSparkles() {
    pickupSparkles.forEach(s => {
        ctx.fillStyle = s.color === '#4CAF50'
            ? `rgba(76, 175, 80, ${s.alpha})`
            : `rgba(141, 110, 99, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
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
// DRAWING - HUD
// ============================================================
function drawHUD() {
    // Branch counter
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(10, canvas.height - 50, 220, 40, 10);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🌿 Branches: ${collectedCount} / ${TOTAL_BRANCHES}`, 22, canvas.height - 30);

    // Dump reminder
    if (collectedCount >= TOTAL_BRANCHES && gameState === 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(240, canvas.height - 50, 180, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#FFD600';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('🗑️ Drive to DUMP!', 252, canvas.height - 30);
    }

    // Controls hint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 195, canvas.height - 50, 185, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('⬆️ Go  ⬅️➡️ Turn at junctions', canvas.width - 18, canvas.height - 30);

    // Message display
    if (messageTimer > 0) {
        const alpha = messageTimer < 30 ? messageTimer / 30 : 1;
        ctx.fillStyle = `rgba(0,0,0,${0.75 * alpha})`;
        const msgW = ctx.measureText(messageText).width + 50;
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - msgW / 2, 8, msgW, 34, 10);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 214, 0, ${alpha})`;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(messageText, canvas.width / 2, 26);
    }
}

// ============================================================
// DRAWING - VICTORY SCREEN
// ============================================================
function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.font = '60px Arial';
    ctx.fillText('🎉', canvas.width / 2, 130);

    ctx.fillStyle = '#FFD600';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('Great Job!', canvas.width / 2, 200);

    ctx.fillStyle = '#FFF';
    ctx.font = '22px Arial';
    ctx.fillText('All branches cleaned up!', canvas.width / 2, 255);

    ctx.font = '20px Arial';
    ctx.fillText('The train tracks are clean and safe! 🚂✨', canvas.width / 2, 300);

    // Stats
    ctx.fillStyle = '#81C784';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`🌿 ${TOTAL_BRANCHES} branches collected and dumped!`, canvas.width / 2, 360);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Press SPACE to play again!', canvas.width / 2, 440);

    drawConfetti();
}

// ============================================================
// SOUND EFFECTS
// ============================================================
function playChugSound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.12);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.12);
    } catch (e) { }
}

function playPickupSound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.15, ac.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + i * 0.08 + 0.15);
            osc.start(ac.currentTime + i * 0.08);
            osc.stop(ac.currentTime + i * 0.08 + 0.15);
        });
    } catch (e) { }
}

function playClickSound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.frequency.setValueAtTime(800, ac.currentTime);
        gain.gain.setValueAtTime(0.1, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.05);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.05);
    } catch (e) { }
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
    } catch (e) { }
}

// ============================================================
// MAIN GAME LOOP
// ============================================================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    drawBackground();

    // Trees (behind tracks)
    trees.forEach(t => drawTree(t.row, t.col));

    // Dump area (behind tracks)
    drawDump();

    // Tracks
    drawAllTracks();

    // Branches
    branches.forEach(b => {
        if (!b.collected) drawBranch(b.row, b.col);
    });

    // Smoke (behind train)
    drawSmoke();

    // Sparkles
    drawSparkles();

    // Cargo car (draw behind locomotive)
    const cargoIdx = Math.max(0, posHistory.length - CARGO_TRAIL_DELAY);
    if (posHistory.length > 0) {
        const cargoPos = posHistory[cargoIdx];
        drawCargoCar(cargoPos.x, cargoPos.y, cargoPos.angle, collectedCount);
    }

    // Locomotive
    const trainPos = getTrainPosition();
    const trainAngle = getTrainAngle();
    drawLocomotive(trainPos.x, trainPos.y, trainAngle);

    // Junction indicator
    drawJunctionIndicator();

    // HUD
    drawHUD();

    // Update game
    update();

    // Victory overlay
    if (gameState === 'victory') {
        drawVictoryScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize and start
initGame();
gameLoop();
