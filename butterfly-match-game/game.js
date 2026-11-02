// Butterfly Match Game - Help butterflies fly to matching flowers!
(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Responsive sizing
    function resizeCanvas() {
        const parent = canvas.parentElement;
        const maxW = Math.min(parent.clientWidth - 20, 800);
        const ratio = 550 / 800;
        canvas.style.width = maxW + 'px';
        canvas.style.height = (maxW * ratio) + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const W = 800, H = 550;

    // ─── Game State ───
    let butterflies = [];
    let flowers = [];
    let dragging = null;
    let dragOffX = 0, dragOffY = 0;
    let score = 0;
    let totalPairs = 0;
    let particles = [];
    let message = '';
    let messageTimer = 0;
    let winState = false;
    let wingFrame = 0;
    let frameCount = 0;
    let level = 1;

    // ─── Colors & Shapes ───
    const COLORS = [
        { name: 'green', hex: '#2ecc71', light: '#a3f5c0' },
        { name: 'pink', hex: '#e84393', light: '#fab1d3' },
        { name: 'blue', hex: '#3498db', light: '#a8d8f0' },
        { name: 'orange', hex: '#e67e22', light: '#f5c68a' },
        { name: 'purple', hex: '#9b59b6', light: '#d2a8e0' },
    ];

    const SHAPES = ['circle', 'star', 'heart', 'diamond', 'triangle'];

    // ─── Helpers ───
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    // ─── Draw Shape Functions ───
    function drawShape(cx, cy, size, shape, color, fill) {
        ctx.save();
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
        } else if (shape === 'star') {
            drawStar(cx, cy, 5, size, size * 0.45);
        } else if (shape === 'heart') {
            drawHeart(cx, cy, size);
        } else if (shape === 'diamond') {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size * 0.7, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size * 0.7, cy);
            ctx.closePath();
        } else if (shape === 'triangle') {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy + size * 0.7);
            ctx.lineTo(cx - size, cy + size * 0.7);
            ctx.closePath();
        }
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    function drawStar(cx, cy, spikes, outerR, innerR) {
        let rot = -Math.PI / 2;
        let step = Math.PI / spikes;
        ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.closePath();
    }

    function drawHeart(cx, cy, size) {
        ctx.moveTo(cx, cy + size * 0.6);
        ctx.bezierCurveTo(cx - size * 1.2, cy - size * 0.3, cx - size * 0.5, cy - size * 1.1, cx, cy - size * 0.4);
        ctx.bezierCurveTo(cx + size * 0.5, cy - size * 1.1, cx + size * 1.2, cy - size * 0.3, cx, cy + size * 0.6);
        ctx.closePath();
    }

    // ─── Draw Butterfly ───
    function drawButterfly(b) {
        const x = b.x, y = b.y;
        const s = b.size || 30;
        const col = b.colorObj;
        const wingAngle = Math.sin(wingFrame * 0.15 + b.wingOffset) * 0.3;
        const bobY = Math.sin(frameCount * 0.05 + b.wingOffset) * 3;

        ctx.save();
        ctx.translate(x, y + bobY);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.7, s * 0.8, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Upper wings
        ctx.save();
        ctx.scale(1 - wingAngle * 0.3, 1);
        // Left upper wing
        ctx.beginPath();
        ctx.ellipse(-s * 0.55, -s * 0.25, s * 0.6, s * 0.5, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = col.hex;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right upper wing
        ctx.beginPath();
        ctx.ellipse(s * 0.55, -s * 0.25, s * 0.6, s * 0.5, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = col.hex;
        ctx.fill();
        ctx.stroke();

        // Lower wings
        ctx.beginPath();
        ctx.ellipse(-s * 0.4, s * 0.2, s * 0.4, s * 0.35, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = col.light;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(s * 0.4, s * 0.2, s * 0.4, s * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = col.light;
        ctx.fill();
        ctx.stroke();

        // Shape on wings
        drawShape(-s * 0.55, -s * 0.2, s * 0.35, b.shape, '#fff', true);
        drawShape(s * 0.55, -s * 0.2, s * 0.35, b.shape, '#fff', true);

        ctx.restore(); // undo wing scale

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.12, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4a3728';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, -s * 0.45, s * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#5a4738';
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.06, -s * 0.48, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.06, -s * 0.48, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-s * 0.05, -s * 0.48, s * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.05, -s * 0.48, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = '#4a3728';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.05, -s * 0.55);
        ctx.quadraticCurveTo(-s * 0.25, -s * 0.9, -s * 0.2, -s * 0.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.05, -s * 0.55);
        ctx.quadraticCurveTo(s * 0.25, -s * 0.9, s * 0.2, -s * 0.75);
        ctx.stroke();

        // Antenna tips
        ctx.fillStyle = col.hex;
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.75, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.2, -s * 0.75, 3, 0, Math.PI * 2);
        ctx.fill();

        // Matched checkmark
        if (b.matched) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✓', 0, 5);
        }

        ctx.restore();
    }

    // ─── Draw Flower ───
    function drawFlower(f) {
        const x = f.x, y = f.y;
        const s = f.size || 30;
        const col = f.colorObj;
        const sway = Math.sin(frameCount * 0.03 + f.swayOffset) * 3;

        ctx.save();
        ctx.translate(x + sway, y);

        // Stem
        ctx.strokeStyle = '#2d8f4e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.quadraticCurveTo(sway * 0.5, s * 0.8, 0, s * 1.3);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = '#3daa5e';
        ctx.beginPath();
        ctx.ellipse(-s * 0.25, s * 0.8, s * 0.2, s * 0.08, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.2, s * 0.95, s * 0.18, s * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Petals
        const petalCount = 6;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const px = Math.cos(angle) * s * 0.35;
            const py = Math.sin(angle) * s * 0.35;
            ctx.beginPath();
            ctx.ellipse(px, py, s * 0.3, s * 0.18, angle, 0, Math.PI * 2);
            ctx.fillStyle = f.matched ? '#ccc' : col.hex;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Center
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = f.matched ? '#ddd' : col.hex;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Shape indicator in center
        drawShape(0, 0, s * 0.22, f.shape, '#fff', true);

        // Glow ring for unmatched
        if (!f.matched) {
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = col.hex + '44';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Label
        ctx.fillStyle = '#555';
        ctx.font = 'bold ' + Math.max(10, s * 0.3) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(f.colorObj.name, 0, s * 1.6);

        ctx.restore();
    }

    // ─── Particles ───
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                size: 3 + Math.random() * 4,
                color: color,
                type: Math.random() > 0.5 ? 'circle' : 'star'
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.vx *= 0.98;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            if (p.type === 'star') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.beginPath();
                drawStar(0, 0, 5, p.size, p.size * 0.4);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });
    }

    // ─── Background ───
    function drawBackground() {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#87ceeb');
        skyGrad.addColorStop(0.6, '#b5e8f7');
        skyGrad.addColorStop(1, '#90ee90');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        drawCloud(100 + Math.sin(frameCount * 0.005) * 20, 60, 40);
        drawCloud(350 + Math.sin(frameCount * 0.004 + 1) * 15, 40, 30);
        drawCloud(600 + Math.sin(frameCount * 0.006 + 2) * 25, 70, 35);
        drawCloud(750 + Math.sin(frameCount * 0.003 + 3) * 10, 30, 25);

        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(700, 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF3B0';
        ctx.beginPath();
        ctx.arc(700, 60, 28, 0, Math.PI * 2);
        ctx.fill();

        // Ground
        const groundGrad = ctx.createLinearGradient(0, H - 120, 0, H);
        groundGrad.addColorStop(0, '#7ec850');
        groundGrad.addColorStop(1, '#5da83a');
        ctx.fillStyle = groundGrad;
        ctx.beginPath();
        ctx.moveTo(0, H - 100);
        for (let x = 0; x <= W; x += 40) {
            ctx.lineTo(x, H - 100 + Math.sin(x * 0.03) * 10);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();

        // Grass blades
        ctx.strokeStyle = '#4a9e2f';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 50; i++) {
            const gx = (i / 50) * W + Math.sin(i * 7) * 15;
            const gy = H - 90 + Math.sin(gx * 0.03) * 10;
            const gh = 8 + Math.sin(i * 3) * 4;
            const sw = Math.sin(frameCount * 0.04 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.quadraticCurveTo(gx + sw, gy - gh, gx + sw * 0.5, gy - gh);
            ctx.stroke();
        }
    }

    function drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x - size * 0.5, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // ─── UI ───
    function drawUI() {
        // Score
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(10, 10, 180, 50, 12);
        ctx.fill();
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2;
        roundRect(10, 10, 180, 50, 12);
        ctx.stroke();

        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🦋 Matched: ' + score + ' / ' + totalPairs, 24, 42);

        // Level
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(W - 130, 10, 120, 50, 12);
        ctx.fill();
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        roundRect(W - 130, 10, 120, 50, 12);
        ctx.stroke();

        ctx.fillStyle = '#e67e22';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Level ' + level, W - 70, 42);

        // Message
        if (messageTimer > 0) {
            const alpha = Math.min(1, messageTimer / 20);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            roundRect(W / 2 - 120, H / 2 - 30, 240, 60, 15);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(message, W / 2, H / 2 + 8);
            ctx.globalAlpha = 1;
            messageTimer--;
        }

        // Instructions at bottom
        if (!winState && score === 0 && messageTimer <= 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Drag each butterfly to the flower with the same color and shape!', W / 2, H - 10);
        }
    }

    function drawWinScreen() {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(W / 2 - 160, H / 2 - 80, 320, 160, 20);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        roundRect(W / 2 - 160, H / 2 - 80, 320, 160, 20);
        ctx.stroke();

        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 Great Job! 🎉', W / 2, H / 2 - 30);

        ctx.fillStyle = '#555';
        ctx.font = '18px Arial';
        ctx.fillText('All butterflies found their flowers!', W / 2, H / 2 + 5);

        // Next level button
        ctx.fillStyle = '#9b59b6';
        roundRect(W / 2 - 70, H / 2 + 25, 140, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Next Level ▶', W / 2, H / 2 + 50);
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ─── Level Setup ───
    function setupLevel() {
        butterflies = [];
        flowers = [];
        particles = [];
        score = 0;
        winState = false;
        message = '';
        messageTimer = 0;

        // Determine pair count based on level
        const pairCount = Math.min(2 + level, COLORS.length);
        totalPairs = pairCount;

        // Always include green as the first color
        let colorPool = [COLORS[0]]; // green is first
        let remaining = COLORS.slice(1);
        shuffle(remaining);
        for (let i = 0; i < pairCount - 1; i++) {
            colorPool.push(remaining[i]);
        }
        shuffle(colorPool);

        let shapePool = shuffle([...SHAPES]).slice(0, pairCount);

        // Create pairs
        const bStartY = 100;
        const fStartY = H - 155;
        const spacing = W / (pairCount + 1);

        // Create butterfly positions (top area, spread out)
        let bPositions = [];
        for (let i = 0; i < pairCount; i++) {
            bPositions.push({
                x: spacing * (i + 1),
                y: bStartY + Math.random() * 40 - 20
            });
        }
        // Shuffle butterfly positions so they don't align with flowers
        shuffle(bPositions);

        for (let i = 0; i < pairCount; i++) {
            const col = colorPool[i];
            const shape = shapePool[i];

            butterflies.push({
                x: bPositions[i].x,
                y: bPositions[i].y,
                origX: bPositions[i].x,
                origY: bPositions[i].y,
                size: 38,
                colorObj: col,
                shape: shape,
                matched: false,
                wingOffset: Math.random() * Math.PI * 2,
                returnAnim: null
            });

            flowers.push({
                x: spacing * (i + 1),
                y: fStartY,
                size: 44,
                colorObj: col,
                shape: shape,
                matched: false,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
    }

    // ─── Animate butterfly returning ───
    function animateReturn(b) {
        b.returnAnim = {
            startX: b.x,
            startY: b.y,
            endX: b.origX,
            endY: b.origY,
            t: 0,
            duration: 30
        };
    }

    function updateReturnAnimations() {
        butterflies.forEach(b => {
            if (b.returnAnim) {
                const a = b.returnAnim;
                a.t++;
                const progress = Math.min(a.t / a.duration, 1);
                // Ease out quad
                const ease = 1 - (1 - progress) * (1 - progress);
                b.x = a.startX + (a.endX - a.startX) * ease;
                b.y = a.startY + (a.endY - a.startY) * ease;
                if (progress >= 1) {
                    b.returnAnim = null;
                }
            }
        });
    }

    // ─── Input Handling ───
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        let cx, cy;
        if (e.touches) {
            cx = (e.touches[0].clientX - rect.left) * scaleX;
            cy = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            cx = (e.clientX - rect.left) * scaleX;
            cy = (e.clientY - rect.top) * scaleY;
        }
        return { x: cx, y: cy };
    }

    function onDown(e) {
        e.preventDefault();
        const pos = getPos(e);

        // Check win state click for "Next Level"
        if (winState) {
            if (pos.x > W / 2 - 70 && pos.x < W / 2 + 70 &&
                pos.y > H / 2 + 25 && pos.y < H / 2 + 65) {
                level++;
                setupLevel();
            }
            return;
        }

        // Find butterfly under pointer
        for (let i = butterflies.length - 1; i >= 0; i--) {
            const b = butterflies[i];
            if (b.matched || b.returnAnim) continue;
            if (dist(pos.x, pos.y, b.x, b.y) < b.size * 1.2) {
                dragging = b;
                dragOffX = b.x - pos.x;
                dragOffY = b.y - pos.y;
                // Move to top of draw order
                butterflies.splice(i, 1);
                butterflies.push(b);
                break;
            }
        }
    }

    function onMove(e) {
        e.preventDefault();
        if (!dragging) return;
        const pos = getPos(e);
        dragging.x = pos.x + dragOffX;
        dragging.y = pos.y + dragOffY;
    }

    function onUp(e) {
        e.preventDefault();
        if (!dragging) return;

        const b = dragging;
        dragging = null;

        // Check if dropped on matching flower
        let matched = false;
        for (const f of flowers) {
            if (f.matched) continue;
            if (dist(b.x, b.y, f.x, f.y) < f.size * 2) {
                // Check match
                if (b.colorObj.name === f.colorObj.name && b.shape === f.shape) {
                    // Correct match!
                    b.matched = true;
                    f.matched = true;
                    b.x = f.x;
                    b.y = f.y - 35;
                    score++;
                    spawnParticles(f.x, f.y, b.colorObj.hex, 20);
                    spawnParticles(f.x, f.y, '#FFD700', 10);
                    message = '🎉 Perfect Match!';
                    messageTimer = 50;
                    matched = true;

                    if (score === totalPairs) {
                        winState = true;
                        spawnParticles(W / 2, H / 2, '#FFD700', 40);
                        spawnParticles(W / 2, H / 2, '#2ecc71', 30);
                        spawnParticles(W / 2, H / 2, '#e84393', 30);
                    }
                    break;
                } else {
                    // Wrong match
                    message = 'Try again! 🤔';
                    messageTimer = 40;
                    animateReturn(b);
                    matched = true; // handled
                    break;
                }
            }
        }

        if (!matched) {
            // Not dropped on any flower, return
            animateReturn(b);
        }
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp, { passive: false });

    // ─── Main Loop ───
    function gameLoop() {
        frameCount++;
        wingFrame++;
        ctx.clearRect(0, 0, W, H);

        drawBackground();

        updateReturnAnimations();
        updateParticles();

        // Draw flowers first (behind butterflies)
        flowers.forEach(f => drawFlower(f));

        // Draw butterflies
        butterflies.forEach(b => drawButterfly(b));

        drawParticles();
        drawUI();

        if (winState) {
            drawWinScreen();
            // Continuous celebration particles
            if (frameCount % 10 === 0) {
                const rx = Math.random() * W;
                const ry = Math.random() * H * 0.5;
                const rColor = COLORS[Math.floor(Math.random() * COLORS.length)].hex;
                spawnParticles(rx, ry, rColor, 3);
            }
        }

        requestAnimationFrame(gameLoop);
    }

    // ─── Start ───
    setupLevel();
    gameLoop();
})();
