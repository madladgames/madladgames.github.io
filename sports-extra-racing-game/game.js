// ===== Sports Extra Racing Game =====

class SportsExtraRacing {
    constructor() {
        // DOM elements
        this.garagePhase = document.getElementById('garagePhase');
        this.racePhase = document.getElementById('racePhase');
        this.startRaceBtn = document.getElementById('startRaceBtn');
        this.canvas = document.getElementById('raceCanvas');
        this.ctx = this.canvas.getContext('2d');

        // HUD elements
        this.hudSpeed = document.getElementById('hudSpeed');
        this.hudTime = document.getElementById('hudTime');
        this.hudLap = document.getElementById('hudLap');
        this.hudCrash = document.getElementById('hudCrash');
        this.hudPosition = document.getElementById('hudPosition');

        // Overlay elements
        this.crashOverlay = document.getElementById('crashOverlay');
        this.crashText = document.getElementById('crashText');
        this.repairBarFill = document.getElementById('repairBarFill');
        this.finishOverlay = document.getElementById('finishOverlay');
        this.finishTitle = document.getElementById('finishTitle');
        this.finishStats = document.getElementById('finishStats');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.countdownContent = document.getElementById('countdownContent');
        this.canvasWrap = document.getElementById('canvasWrap');

        // Preview canvas
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Car build options
        this.buildConfig = {
            color: null,
            carClass: null
        };

        // Sports car classes
        this.carClasses = {
            supercar: { name: 'Supercar', speedBonus: 50, handling: 0.9, accel: 1.5, width: 34, height: 70, desc: 'Blazing fast!' },
            gt: { name: 'GT Racer', speedBonus: 35, handling: 1.1, accel: 1.3, width: 36, height: 68, desc: 'Balance of speed & grip' },
            touring: { name: 'Touring Car', speedBonus: 25, handling: 1.25, accel: 1.15, width: 38, height: 66, desc: 'Great handling' },
            formula: { name: 'Formula', speedBonus: 60, handling: 1.0, accel: 1.6, width: 30, height: 72, desc: 'Open-wheel beast' }
        };

        this.carColors = {
            red: '#e11d48',
            blue: '#2563eb',
            green: '#16a34a',
            yellow: '#eab308',
            orange: '#ea580c',
            white: '#f0f0f0',
            black: '#1e1e1e',
            purple: '#9333ea'
        };

        // Race state
        this.raceState = null;
        this.keys = {};
        this.animFrame = null;
        this.lastTime = 0;

        // Audio context (lazy init)
        this.audioCtx = null;

        this.init();
    }

    init() {
        this.bindGarageEvents();
        this.bindRaceEvents();
        this.showPhase('garage');
        this.drawPreview();
    }

    // ===== PHASE MANAGEMENT =====
    showPhase(phase) {
        this.garagePhase.classList.remove('active');
        this.racePhase.classList.remove('active');
        if (phase === 'garage') {
            this.garagePhase.classList.add('active');
        } else {
            this.racePhase.classList.add('active');
        }
    }

    // ===== GARAGE PHASE =====
    bindGarageEvents() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const value = btn.dataset.value;

                document.querySelectorAll(`.option-btn[data-category="${category}"]`).forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                this.buildConfig[category] = value;

                this.checkBuildComplete();
                this.drawPreview();
            });
        });

        this.startRaceBtn.addEventListener('click', () => {
            if (this.isBuildComplete()) {
                this.startRace();
            }
        });
    }

    isBuildComplete() {
        return this.buildConfig.color && this.buildConfig.carClass;
    }

    checkBuildComplete() {
        this.startRaceBtn.disabled = !this.isBuildComplete();
    }

    drawPreview() {
        const c = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;
        c.clearRect(0, 0, w, h);

        // Draw road background
        c.fillStyle = '#555';
        c.fillRect(w * 0.15, 0, w * 0.7, h);

        // Road markings
        c.setLineDash([12, 12]);
        c.strokeStyle = 'rgba(255,255,255,0.5)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(w * 0.5, 0);
        c.lineTo(w * 0.5, h);
        c.stroke();
        c.setLineDash([]);

        // Road edges
        c.fillStyle = '#cc0000';
        c.fillRect(w * 0.12, 0, 6, h);
        c.fillStyle = '#fff';
        c.fillRect(w * 0.12 + 6, 0, 4, h);
        c.fillStyle = '#cc0000';
        c.fillRect(w * 0.85 - 2, 0, 6, h);
        c.fillStyle = '#fff';
        c.fillRect(w * 0.85 - 6, 0, 4, h);

        // Draw car preview
        const color = this.buildConfig.color ? this.carColors[this.buildConfig.color] : '#888';
        const carClass = this.buildConfig.carClass || 'gt';

        this.drawSportsCar(c, w / 2, h / 2, color, carClass, 2.0);
    }

    drawSportsCar(ctx, cx, cy, color, carClass, scale) {
        scale = scale || 1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const body = this.carClasses[carClass] || this.carClasses.gt;
        const hw = body.width / 2;
        const hh = body.height / 2;
        const isFormula = carClass === 'formula';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, hw + 4, hh + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tires
        ctx.fillStyle = '#1a1a1a';
        const tireW = isFormula ? 8 : 6;
        const tireH = isFormula ? 16 : 14;
        // Front tires
        ctx.fillRect(-hw - tireW + 2, -hh + 8, tireW, tireH);
        ctx.fillRect(hw - 2, -hh + 8, tireW, tireH);
        // Rear tires
        ctx.fillRect(-hw - tireW + 2, hh - 22, tireW, tireH);
        ctx.fillRect(hw - 2, hh - 22, tireW, tireH);

        if (isFormula) {
            // Formula car — open-wheel body
            // Nose cone
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-3, -hh - 2);
            ctx.lineTo(3, -hh - 2);
            ctx.lineTo(6, -hh + 15);
            ctx.lineTo(-6, -hh + 15);
            ctx.closePath();
            ctx.fill();

            // Main body (narrow center)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-hw * 0.45, -hh + 10);
            ctx.lineTo(hw * 0.45, -hh + 10);
            ctx.lineTo(hw * 0.5, hh * 0.6);
            ctx.lineTo(hw * 0.55, hh);
            ctx.lineTo(-hw * 0.55, hh);
            ctx.lineTo(-hw * 0.5, hh * 0.6);
            ctx.closePath();
            ctx.fill();

            // Front wing
            ctx.fillStyle = color;
            ctx.fillRect(-hw - 2, -hh + 2, hw * 2 + 4, 4);
            ctx.fillStyle = '#333';
            ctx.fillRect(-hw - 3, -hh, 3, 6);
            ctx.fillRect(hw, -hh, 3, 6);

            // Rear wing
            ctx.fillStyle = '#222';
            ctx.fillRect(-hw * 0.35, hh - 8, 3, 12);
            ctx.fillRect(hw * 0.35 - 3, hh - 8, 3, 12);
            ctx.fillStyle = color;
            ctx.fillRect(-hw - 1, hh + 2, hw * 2 + 2, 5);
            ctx.fillStyle = '#111';
            ctx.fillRect(-hw - 2, hh + 6, hw * 2 + 4, 2);

            // Cockpit
            ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
            ctx.beginPath();
            ctx.ellipse(0, -hh * 0.1, 7, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Helmet
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, -hh * 0.2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Air intake (above driver)
            ctx.fillStyle = '#333';
            ctx.fillRect(-4, -hh * 0.35, 8, 6);

        } else {
            // Sports car / GT / Touring body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-hw * 0.4, -hh);
            ctx.quadraticCurveTo(0, -hh - 4, hw * 0.4, -hh);
            ctx.lineTo(hw, -hh * 0.3);
            ctx.lineTo(hw, hh * 0.85);
            ctx.quadraticCurveTo(hw * 0.9, hh, hw * 0.65, hh);
            ctx.lineTo(-hw * 0.65, hh);
            ctx.quadraticCurveTo(-hw * 0.9, hh, -hw, hh * 0.85);
            ctx.lineTo(-hw, -hh * 0.3);
            ctx.closePath();
            ctx.fill();

            // Body highlights
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(-hw + 3, -hh * 0.3, hw - 3, hh * 0.35);

            // Racing stripe
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(-3, -hh + 4, 6, hh * 2 - 8);

            // Darker bottom
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(-hw + 2, hh * 0.4, (hw - 2) * 2, hh * 0.3);

            // Windshield
            ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(-hw * 0.5, -hh * 0.05);
            ctx.lineTo(hw * 0.5, -hh * 0.05);
            ctx.lineTo(hw * 0.38, -hh * 0.5);
            ctx.lineTo(-hw * 0.38, -hh * 0.5);
            ctx.closePath();
            ctx.fill();

            // Windshield glare
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(-hw * 0.25, -hh * 0.1);
            ctx.lineTo(-hw * 0.08, -hh * 0.1);
            ctx.lineTo(-hw * 0.12, -hh * 0.42);
            ctx.lineTo(-hw * 0.22, -hh * 0.42);
            ctx.closePath();
            ctx.fill();

            // Rear window
            ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-hw * 0.4, hh * 0.15);
            ctx.lineTo(hw * 0.4, hh * 0.15);
            ctx.lineTo(hw * 0.3, hh * 0.4);
            ctx.lineTo(-hw * 0.3, hh * 0.4);
            ctx.closePath();
            ctx.fill();

            // Headlights
            ctx.fillStyle = '#ffffcc';
            ctx.beginPath(); ctx.arc(-hw * 0.4, -hh + 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hw * 0.4, -hh + 3, 3.5, 0, Math.PI * 2); ctx.fill();

            // Taillights
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(-hw * 0.55, hh - 5, 8, 4);
            ctx.fillRect(hw * 0.55 - 8, hh - 5, 8, 4);

            // Race number
            ctx.fillStyle = 'white';
            ctx.fillRect(-hw + 3, -4, 13, 13);
            ctx.fillStyle = '#222';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('7', -hw + 9.5, 2.5);

            // Rear spoiler (GT and Touring get a smaller spoiler)
            if (carClass === 'gt' || carClass === 'supercar') {
                ctx.fillStyle = '#333';
                ctx.fillRect(-hw * 0.3, hh - 6, 3, 10);
                ctx.fillRect(hw * 0.3 - 3, hh - 6, 3, 10);
                const sw = hw * 1.2;
                ctx.fillStyle = '#222';
                ctx.fillRect(-sw, hh + 2, sw * 2, 5);
                ctx.fillStyle = color;
                ctx.fillRect(-sw + 2, hh + 3, sw * 2 - 4, 3);
            }
        }

        ctx.restore();
    }

    // ===== RACE PHASE =====
    startRace() {
        this.showPhase('race');
        this.resizeCanvas();

        const carClass = this.carClasses[this.buildConfig.carClass];
        const topSpeed = 200 + carClass.speedBonus;
        const accel = 75 * carClass.accel;
        const handling = carClass.handling * 4.0;

        // Generate a winding road path using curve segments
        const totalLaps = 3;
        const lapLength = 8000;
        const trackLength = totalLaps * lapLength;

        // Generate road curve data — series of curve segments
        const curveSegments = this.generateWindingRoad(120);

        this.raceState = {
            player: {
                x: this.canvas.width / 2,
                y: this.canvas.height * 0.75,
                speed: 0,
                topSpeed: topSpeed,
                accel: accel,
                handling: handling,
                color: this.carColors[this.buildConfig.color],
                carClass: this.buildConfig.carClass,
                width: carClass.width * 2,
                height: carClass.height * 2,
                distance: 0,
                lap: 1,
                invincible: 0
            },

            opponents: [],
            obstacles: [],

            trackWidth: 320,
            trackLength: trackLength,
            lapLength: lapLength,
            totalLaps: totalLaps,

            // Winding road data
            curveSegments: curveSegments,
            roadCurve: 0,       // current visual road offset
            roadCurveSpeed: 0,  // rate of change

            raceTime: 0,
            raceFinished: false,
            paused: false,

            crashCount: 0,
            maxCrashes: 3,
            carBroken: false,
            repairProgress: 0,
            repairNeeded: 15,

            scrollSpeed: 0,
            scrollOffset: 0,

            particles: [],
            tireMarks: [],

            totalCrashes: 0,
            repairs: 0,

            scenery: [],
            sceneryTimer: 0,

            bestLapTime: Infinity,
            lapStartTime: 0
        };

        this.generateOpponents();
        this.generateInitialObstacles();
        this.generateInitialScenery();
        this.doCountdown();
    }

    generateWindingRoad(numSegments) {
        // Generate a sequence of curve segments that define the winding road
        const segments = [];
        let curvature = 0;

        for (let i = 0; i < numSegments; i++) {
            // Each segment has: length, curve direction/strength
            const segLength = 150 + Math.random() * 200;

            // Create variety: straights, gentle curves, sharp bends, S-curves
            const r = Math.random();
            let targetCurve;
            if (r < 0.2) {
                // Straight
                targetCurve = 0;
            } else if (r < 0.5) {
                // Gentle curve
                targetCurve = (Math.random() - 0.5) * 3;
            } else if (r < 0.75) {
                // Medium curve
                targetCurve = (Math.random() - 0.5) * 5;
            } else if (r < 0.9) {
                // Sharp bend
                targetCurve = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 3);
            } else {
                // S-curve (opposite of current)
                targetCurve = -curvature * 0.8 + (Math.random() - 0.5) * 2;
            }

            curvature = targetCurve;
            segments.push({
                length: segLength,
                curve: targetCurve
            });
        }

        return segments;
    }

    getCurveAtDistance(dist) {
        // Given distance traveled, return the road curve at that point
        const segments = this.raceState.curveSegments;
        const lapDist = dist % this.raceState.lapLength;
        // Map lapDist to segment
        let accumulated = 0;
        const totalSegLength = segments.reduce((sum, s) => sum + s.length, 0);
        const scaledDist = (lapDist / this.raceState.lapLength) * totalSegLength;

        for (let i = 0; i < segments.length; i++) {
            if (scaledDist < accumulated + segments[i].length) {
                // We're in this segment — interpolate to next segment
                const t = (scaledDist - accumulated) / segments[i].length;
                const nextIdx = (i + 1) % segments.length;
                const c1 = segments[i].curve;
                const c2 = segments[nextIdx].curve;
                // Smooth interpolation
                const smoothT = t * t * (3 - 2 * t); // smoothstep
                return c1 + (c2 - c1) * smoothT;
            }
            accumulated += segments[i].length;
        }
        return 0;
    }

    generateOpponents() {
        const colors = ['#e11d48', '#16a34a', '#eab308', '#9333ea', '#ea580c', '#06b6d4'];
        const classes = ['supercar', 'gt', 'touring', 'formula'];
        const numOpponents = 5;

        for (let i = 0; i < numOpponents; i++) {
            const rc = classes[i % classes.length];
            const body = this.carClasses[rc];
            this.raceState.opponents.push({
                x: this.canvas.width / 2 + (i - 2) * 65,
                speed: 110 + Math.random() * 60,
                topSpeed: 160 + Math.random() * 55,
                color: colors[i % colors.length],
                carClass: rc,
                width: body.width * 2,
                height: body.height * 2,
                laneTarget: this.canvas.width / 2 + (Math.random() - 0.5) * 220,
                laneChangeTimer: 0,
                distance: (i + 1) * 220
            });
        }
    }

    generateInitialObstacles() {
        for (let i = 0; i < 8; i++) {
            this.spawnObstacle(600 + i * 400 + Math.random() * 300);
        }
    }

    generateInitialScenery() {
        for (let i = 0; i < 25; i++) {
            this.raceState.scenery.push({
                distanceOffset: Math.random() * 3000,
                side: Math.random() > 0.5 ? 'left' : 'right',
                type: this.randomSceneryType(),
                size: 0.7 + Math.random() * 0.5
            });
        }
    }

    randomSceneryType() {
        const types = ['tree', 'tree', 'tree', 'bush', 'banner', 'tirewall'];
        return types[Math.floor(Math.random() * types.length)];
    }

    spawnObstacle(distanceAhead) {
        const rs = this.raceState;
        const cx = this.canvas.width / 2;
        const types = ['cone', 'oilslick', 'barrier', 'debris', 'cone'];
        const type = types[Math.floor(Math.random() * types.length)];

        let width, height;
        if (type === 'cone') { width = 16; height = 16; }
        else if (type === 'oilslick') { width = 45; height = 22; }
        else if (type === 'barrier') { width = 50; height = 16; }
        else if (type === 'debris') { width = 30; height = 18; }
        else { width = 16; height = 16; }

        rs.obstacles.push({
            x: cx + (Math.random() - 0.5) * (rs.trackWidth - 80),
            distanceOffset: distanceAhead,
            type: type,
            width: width,
            height: height,
            active: true
        });
    }

    doCountdown() {
        this.countdownOverlay.classList.add('active');
        let count = 3;

        const tick = () => {
            if (count > 0) {
                this.countdownContent.innerHTML = `<div class="countdown-number">${count}</div>`;
                this.playCountSound();
                count--;
                setTimeout(tick, 900);
            } else {
                this.countdownContent.innerHTML = `<div class="countdown-go">GO!</div>`;
                this.playGoSound();
                setTimeout(() => {
                    this.countdownOverlay.classList.remove('active');
                    this.raceState.lapStartTime = 0;
                    this.beginRaceLoop();
                }, 600);
            }
        };
        tick();
    }

    beginRaceLoop() {
        this.lastTime = performance.now();
        this.raceLoop(this.lastTime);
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    bindRaceEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.raceState && this.raceState.carBroken) {
                    this.doRepair();
                }
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        const leftBtn = document.getElementById('touchLeft');
        const rightBtn = document.getElementById('touchRight');
        const repairBtn = document.getElementById('touchRepair');

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['ArrowLeft'] = true; });
            leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['ArrowLeft'] = false; });
        }
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['ArrowRight'] = true; });
            rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['ArrowRight'] = false; });
        }
        if (repairBtn) {
            repairBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.raceState && this.raceState.carBroken) {
                    this.doRepair();
                }
            });
        }

        this.playAgainBtn.addEventListener('click', () => {
            this.finishOverlay.classList.remove('active');
            this.crashOverlay.classList.remove('active');
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.raceState = null;
            this.showPhase('garage');
        });

        window.addEventListener('resize', () => {
            if (this.raceState) this.resizeCanvas();
        });
    }

    // ===== REPAIR MECHANIC =====
    doRepair() {
        const rs = this.raceState;
        if (!rs || !rs.carBroken) return;

        rs.repairProgress++;
        this.playRepairSound();

        const pct = Math.min(100, (rs.repairProgress / rs.repairNeeded) * 100);
        this.repairBarFill.style.width = pct + '%';

        if (rs.repairProgress >= rs.repairNeeded) {
            rs.carBroken = false;
            rs.crashCount = 0;
            rs.repairProgress = 0;
            rs.repairs++;
            rs.player.invincible = 2.0;
            rs.player.speed = 0;
            this.crashOverlay.classList.remove('active');
            this.repairBarFill.style.width = '0%';
            this.playFixedSound();
        }
    }

    // ===== MAIN RACE LOOP =====
    raceLoop(timestamp) {
        const rs = this.raceState;
        if (!rs || rs.raceFinished) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (!rs.carBroken && !rs.paused) {
            this.updateRace(dt);
        }

        this.drawRace();
        this.animFrame = requestAnimationFrame((t) => this.raceLoop(t));
    }

    updateRace(dt) {
        const rs = this.raceState;
        const player = rs.player;
        const cw = this.canvas.width;

        rs.raceTime += dt;

        if (player.invincible > 0) player.invincible -= dt;

        // --- Get road curve at player's position ---
        const curveAtPlayer = this.getCurveAtDistance(player.distance);
        rs.roadCurve = curveAtPlayer;

        // --- Player acceleration (auto-accelerate) ---
        // Reduce grip in sharp curves
        const curveFactor = Math.max(0.6, 1 - Math.abs(curveAtPlayer) * 0.04);
        const targetSpeed = player.topSpeed * curveFactor;

        if (player.speed < targetSpeed) {
            player.speed += player.accel * dt;
            if (player.speed > targetSpeed) player.speed = targetSpeed;
        } else {
            // Slow down in sharp turns
            player.speed -= player.accel * 0.8 * dt;
            if (player.speed < targetSpeed) player.speed = targetSpeed;
        }

        // Braking
        if (this.keys['ArrowDown']) {
            player.speed -= player.accel * 2.2 * dt;
            if (player.speed < 20) player.speed = 20;
        }

        // Steering
        let steerInput = 0;
        if (this.keys['ArrowLeft']) steerInput = -1;
        if (this.keys['ArrowRight']) steerInput = 1;

        // Apply road curve force — pushes car sideways
        const curveForce = curveAtPlayer * (player.speed / player.topSpeed) * 130 * dt;
        player.x += curveForce;

        // Apply steering
        player.x += steerInput * player.handling * (player.speed / 80) * 60 * dt;

        // Track boundaries
        const trackLeft = (cw - rs.trackWidth) / 2 + player.width / 2;
        const trackRight = (cw + rs.trackWidth) / 2 - player.width / 2;

        if (player.x < trackLeft) {
            player.x = trackLeft;
            player.speed *= 0.92;
        }
        if (player.x > trackRight) {
            player.x = trackRight;
            player.speed *= 0.92;
        }

        // Leave tire marks on sharp turns
        if (Math.abs(curveAtPlayer) > 2.5 && player.speed > 80) {
            rs.tireMarks.push({
                x: player.x,
                dist: player.distance,
                life: 3.0
            });
        }

        // Scroll
        rs.scrollSpeed = player.speed * 2.8;
        rs.scrollOffset += rs.scrollSpeed * dt;

        // Distance
        player.distance += player.speed * dt;

        // Lap tracking
        const currentLap = Math.floor(player.distance / rs.lapLength) + 1;
        if (currentLap > player.lap && player.lap < rs.totalLaps) {
            // Lap completed!
            const lapTime = rs.raceTime - rs.lapStartTime;
            if (lapTime < rs.bestLapTime) rs.bestLapTime = lapTime;
            rs.lapStartTime = rs.raceTime;
            player.lap = currentLap;
            this.playLapSound();
        }

        // Check finish
        if (player.distance >= rs.trackLength) {
            // Final lap time
            const lapTime = rs.raceTime - rs.lapStartTime;
            if (lapTime < rs.bestLapTime) rs.bestLapTime = lapTime;
            this.finishRace();
            return;
        }

        // Spawn tire smoke on hard cornering
        if (Math.abs(curveAtPlayer) > 3 && player.speed > 100) {
            this.spawnTireSmoke(player);
        }

        this.updateOpponents(dt);
        this.updateObstacles(dt);
        if (player.invincible <= 0) this.checkCollisions();
        this.updateParticles(dt);
        this.updateScenery();
        this.maybeSpawnObstacle();
        this.updateHUD();
    }

    spawnTireSmoke(player) {
        const rs = this.raceState;
        for (let i = 0; i < 2; i++) {
            rs.particles.push({
                x: player.x + (Math.random() - 0.5) * player.width * 0.7,
                y: player.y + player.height / 2 + 3 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 30,
                vy: 15 + Math.random() * 30,
                color: 'rgba(200,200,200,0.5)',
                life: 0.3 + Math.random() * 0.3,
                size: 4 + Math.random() * 6
            });
        }
    }

    updateOpponents(dt) {
        const rs = this.raceState;
        const player = rs.player;

        rs.opponents.forEach(opp => {
            // Opponents also affected by curves
            const oppCurve = this.getCurveAtDistance(opp.distance);
            opp.speed += (opp.topSpeed - opp.speed) * dt * 0.5;
            opp.speed += (Math.random() - 0.5) * 20 * dt;

            // Slow down in curves like the player
            const oppCurveFactor = Math.max(0.65, 1 - Math.abs(oppCurve) * 0.035);
            const oppMaxSpeed = opp.topSpeed * oppCurveFactor;
            if (opp.speed > oppMaxSpeed) opp.speed = oppMaxSpeed;
            if (opp.speed < 80) opp.speed = 80;

            opp.distance += opp.speed * dt;

            opp.laneChangeTimer -= dt;
            if (opp.laneChangeTimer <= 0) {
                opp.laneTarget = this.canvas.width / 2 + (Math.random() - 0.5) * (rs.trackWidth - 80);
                opp.laneChangeTimer = 2 + Math.random() * 4;
            }

            const dx = opp.laneTarget - opp.x;
            opp.x += dx * dt * 1.5;

            // Apply curve force to opponents too
            opp.x += oppCurve * (opp.speed / opp.topSpeed) * 90 * dt;

            // Keep opponents on track
            const tl = (this.canvas.width - rs.trackWidth) / 2 + opp.width / 2;
            const tr = (this.canvas.width + rs.trackWidth) / 2 - opp.width / 2;
            if (opp.x < tl) opp.x = tl;
            if (opp.x > tr) opp.x = tr;

            const relDist = opp.distance - player.distance;
            opp.screenY = player.y - relDist * 2.5;
        });
    }

    updateObstacles(dt) {
        const rs = this.raceState;
        rs.obstacles.forEach(obs => {
            obs.screenY = this.canvas.height * 0.75 - (obs.distanceOffset - rs.player.distance) * 2.5;
        });
        rs.obstacles = rs.obstacles.filter(obs => {
            return obs.active && obs.distanceOffset > rs.player.distance - 200;
        });
    }

    updateScenery() {
        const rs = this.raceState;
        rs.scenery = rs.scenery.filter(s => s.distanceOffset > rs.player.distance - 300);
        rs.sceneryTimer++;
        if (rs.sceneryTimer % 12 === 0) {
            rs.scenery.push({
                distanceOffset: rs.player.distance + 2000 + Math.random() * 500,
                side: Math.random() > 0.5 ? 'left' : 'right',
                type: this.randomSceneryType(),
                size: 0.7 + Math.random() * 0.5
            });
        }
    }

    maybeSpawnObstacle() {
        const rs = this.raceState;
        const farthest = rs.obstacles.reduce((max, o) => Math.max(max, o.distanceOffset), rs.player.distance);
        if (farthest < rs.player.distance + 2000) {
            this.spawnObstacle(rs.player.distance + 1500 + Math.random() * 800);
        }
    }

    checkCollisions() {
        const rs = this.raceState;
        const player = rs.player;
        const ph = player.height / 2;
        const pw = player.width / 2;

        rs.obstacles.forEach(obs => {
            if (!obs.active) return;
            const oy = obs.screenY;
            if (oy === undefined) return;

            if (Math.abs(player.x - obs.x) < (pw + obs.width / 2) &&
                Math.abs(player.y - oy) < (ph + obs.height / 2)) {
                obs.active = false;
                this.handleCrash();
            }
        });

        rs.opponents.forEach(opp => {
            if (opp.screenY === undefined) return;
            if (Math.abs(player.x - opp.x) < (pw + opp.width / 2) &&
                Math.abs(player.y - opp.screenY) < (ph + opp.height / 2)) {
                opp.x += (opp.x > player.x ? 1 : -1) * 50;
                opp.distance += 50;
                this.handleCrash();
            }
        });
    }

    handleCrash() {
        const rs = this.raceState;
        rs.crashCount++;
        rs.totalCrashes++;

        this.canvasWrap.classList.add('screen-shake');
        setTimeout(() => this.canvasWrap.classList.remove('screen-shake'), 400);

        rs.player.speed *= 0.25;
        this.spawnCrashParticles(rs.player.x, rs.player.y);
        this.playCrashSound();

        if (rs.crashCount >= rs.maxCrashes) {
            rs.carBroken = true;
            rs.player.speed = 0;
            rs.repairProgress = 0;
            this.repairBarFill.style.width = '0%';
            this.crashText.textContent = `💥 CAR WRECKED! (Crash ${rs.totalCrashes})`;
            this.crashOverlay.classList.add('active');
        }

        this.updateHUD();
    }

    spawnCrashParticles(x, y) {
        const rs = this.raceState;
        const colors = ['#ff4444', '#ff8800', '#ffff00', '#888', '#333'];
        for (let i = 0; i < 25; i++) {
            rs.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 350,
                vy: (Math.random() - 0.5) * 350,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0.5 + Math.random() * 0.6,
                size: 3 + Math.random() * 7
            });
        }
    }

    updateParticles(dt) {
        const rs = this.raceState;
        rs.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.size *= 0.97;
        });
        rs.particles = rs.particles.filter(p => p.life > 0);

        // Tire marks fade
        rs.tireMarks.forEach(m => m.life -= dt);
        rs.tireMarks = rs.tireMarks.filter(m => m.life > 0);
    }

    finishRace() {
        const rs = this.raceState;
        rs.raceFinished = true;

        let position = 1;
        rs.opponents.forEach(opp => {
            if (opp.distance > rs.player.distance) position++;
        });

        const minutes = Math.floor(rs.raceTime / 60);
        const seconds = Math.floor(rs.raceTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const bestMin = Math.floor(rs.bestLapTime / 60);
        const bestSec = (rs.bestLapTime % 60).toFixed(1);
        const bestLapStr = rs.bestLapTime < Infinity ? `${bestMin}:${bestSec.padStart(4, '0')}` : '--:--';

        let titleText = '🏆 RACE COMPLETE!';
        if (position === 1) titleText = '🏆 YOU WIN! 1ST PLACE!';
        else if (position === 2) titleText = '🥈 2ND PLACE!';
        else if (position === 3) titleText = '🥉 3RD PLACE!';

        this.finishTitle.textContent = titleText;
        this.finishStats.innerHTML = `
            <div>⏱️ Total Time: ${timeStr}</div>
            <div>🔄 Laps: ${rs.totalLaps}</div>
            <div>⚡ Best Lap: ${bestLapStr}</div>
            <div>💥 Total Crashes: ${rs.totalCrashes}</div>
            <div>🔧 Repairs: ${rs.repairs}</div>
            <div>🏅 Position: ${position}/${rs.opponents.length + 1}</div>
            <div>🚀 Top Speed: ${Math.round(rs.player.topSpeed)} mph</div>
        `;
        this.finishOverlay.classList.add('active');
        this.playVictorySound();
    }

    updateHUD() {
        const rs = this.raceState;
        this.hudSpeed.textContent = Math.round(rs.player.speed) + ' mph';
        const minutes = Math.floor(rs.raceTime / 60);
        const seconds = Math.floor(rs.raceTime % 60);
        this.hudTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.hudLap.textContent = `${Math.min(rs.player.lap, rs.totalLaps)}/${rs.totalLaps}`;
        this.hudCrash.textContent = `${rs.crashCount}/${rs.maxCrashes}`;

        let position = 1;
        rs.opponents.forEach(opp => {
            if (opp.distance > rs.player.distance) position++;
        });
        const suffix = ['st', 'nd', 'rd', 'th', 'th', 'th'];
        this.hudPosition.textContent = position + suffix[position - 1];
    }

    // ===== DRAWING =====
    drawRace() {
        const ctx = this.ctx;
        const rs = this.raceState;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        const curveAtPlayer = rs.roadCurve;

        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, ch * 0.2);
        grad.addColorStop(0, '#4a90d9');
        grad.addColorStop(1, '#87ceeb');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch * 0.2);

        // Hills on horizon — shift with road curve for parallax
        const hillShift = curveAtPlayer * -15;
        ctx.fillStyle = '#3a7a3a';
        for (let i = 0; i < 5; i++) {
            const hx = (i * cw / 3) - cw * 0.2 + hillShift + (rs.scrollOffset * 0.02 % cw);
            ctx.beginPath();
            ctx.arc(hx % (cw + 200) - 100, ch * 0.2, 80 + i * 20, Math.PI, 0);
            ctx.fill();
        }

        // Ground
        ctx.fillStyle = '#2d6a1e';
        ctx.fillRect(0, ch * 0.15, cw, ch * 0.85);

        // Grass stripes
        const grassOffset = rs.scrollOffset % 50;
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y = -50 + grassOffset % 50 + ch * 0.15; y < ch; y += 50) {
            ctx.fillRect(0, y, cw, 20);
        }

        // === DRAW WINDING ROAD ===
        // The road is drawn as segments from bottom to top, with each row
        // offset horizontally based on the curve at that distance
        const trackLeft0 = (cw - rs.trackWidth) / 2;
        const trackRight0 = trackLeft0 + rs.trackWidth;
        const playerDist = rs.player.distance;

        // Draw road segments row by row
        const rowHeight = 4;
        const numRows = Math.ceil((ch * 0.85) / rowHeight);
        const startY = ch;

        for (let row = 0; row < numRows; row++) {
            const y = startY - row * rowHeight;
            if (y < ch * 0.12) break;

            // Distance at this screen row
            const distAhead = (row * rowHeight) / 2.5; // scale factor
            const distAtRow = playerDist + distAhead;

            // Get curve at this distance
            const curveHere = this.getCurveAtDistance(distAtRow);

            // Perspective scaling — farther rows are narrower and more centered
            const perspectiveT = row / numRows;
            const perspScale = 1 - perspectiveT * 0.4;
            const roadW = rs.trackWidth * perspScale;

            // Horizontal offset from curve (accumulates with distance)
            const curveOffset = curveHere * perspectiveT * 60;

            const roadCenter = cw / 2 + curveOffset;
            const rLeft = roadCenter - roadW / 2;
            const rRight = roadCenter + roadW / 2;

            // Road surface
            ctx.fillStyle = '#555';
            ctx.fillRect(rLeft, y - rowHeight, roadW, rowHeight + 1);

            // Road edge rumble strips (alternating red/white)
            const rumbleIdx = Math.floor((rs.scrollOffset + row * rowHeight) / 18) % 2;
            ctx.fillStyle = rumbleIdx === 0 ? '#cc0000' : '#ffffff';
            ctx.fillRect(rLeft - 6, y - rowHeight, 6, rowHeight + 1);
            ctx.fillRect(rRight, y - rowHeight, 6, rowHeight + 1);

            // Center lane marking (dashed)
            const dashIdx = Math.floor((rs.scrollOffset + row * rowHeight) / 24) % 2;
            if (dashIdx === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(roadCenter - 1, y - rowHeight, 2, rowHeight + 1);
            }

            // Road shading — darker near edges for depth
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(rLeft, y - rowHeight, roadW * 0.15, rowHeight + 1);
            ctx.fillRect(rRight - roadW * 0.15, y - rowHeight, roadW * 0.15, rowHeight + 1);
        }

        // === Draw scenery (trees/bushes/banners alongside the winding road) ===
        rs.scenery.forEach(s => {
            const relDist = s.distanceOffset - playerDist;
            if (relDist < -50 || relDist > 1200) return;
            const screenRow = relDist * 2.5;
            const screenY = ch - screenRow;
            if (screenY < ch * 0.1 || screenY > ch + 50) return;

            // Get road position at this distance
            const curveHere = this.getCurveAtDistance(s.distanceOffset);
            const perspT = screenRow / (ch * 0.85);
            const perspS = 1 - perspT * 0.4;
            const roadW = rs.trackWidth * perspS;
            const curveOff = curveHere * perspT * 60;
            const roadCenter = cw / 2 + curveOff;

            const sx = s.side === 'left'
                ? roadCenter - roadW / 2 - 30 - Math.random() * 20
                : roadCenter + roadW / 2 + 15 + Math.random() * 20;

            this.drawScenery(ctx, sx, screenY, s.type, s.size * perspS);
        });

        // Draw tire marks
        rs.tireMarks.forEach(m => {
            const relDist = m.dist - playerDist;
            const screenRow = relDist * 2.5;
            const screenY = ch - screenRow;
            if (screenY < 0 || screenY > ch) return;

            const curveHere = this.getCurveAtDistance(m.dist);
            const perspT = screenRow / (ch * 0.85);
            const curveOff = curveHere * perspT * 60;

            ctx.globalAlpha = Math.min(1, m.life * 0.4);
            ctx.fillStyle = '#222';
            ctx.fillRect(m.x + curveOff - cw / 2 + cw / 2 - 8, screenY, 4, 6);
            ctx.fillRect(m.x + curveOff - cw / 2 + cw / 2 + 4, screenY, 4, 6);
        });
        ctx.globalAlpha = 1;

        // Draw lap markers
        for (let lap = 1; lap <= rs.totalLaps; lap++) {
            const markDist = lap * rs.lapLength;
            const relDist = markDist - playerDist;
            if (relDist < -20 || relDist > 800) continue;
            const screenRow = relDist * 2.5;
            const screenY = ch - screenRow;
            if (screenY < 0 || screenY > ch) continue;

            const curveHere = this.getCurveAtDistance(markDist);
            const perspT = screenRow / (ch * 0.85);
            const perspS = 1 - perspT * 0.4;
            const roadW = rs.trackWidth * perspS;
            const curveOff = curveHere * perspT * 60;
            const roadCenter = cw / 2 + curveOff;
            const rl = roadCenter - roadW / 2;

            // Checkered line
            ctx.fillStyle = '#000';
            ctx.fillRect(rl, screenY - 8, roadW, 16);
            for (let bx = 0; bx < roadW; bx += 16) {
                for (let by = 0; by < 16; by += 8) {
                    if (((bx / 16) + (by / 8)) % 2 === 0) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(rl + bx, screenY - 8 + by, 16, 8);
                    }
                }
            }
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(lap === rs.totalLaps ? '🏁 FINISH' : `LAP ${lap + 1}`, roadCenter, screenY + 3);
        }

        // Draw obstacles
        rs.obstacles.forEach(obs => {
            if (obs.screenY === undefined || obs.screenY < -50 || obs.screenY > ch + 50) return;
            this.drawObstacle(ctx, obs);
        });

        // Draw opponents
        rs.opponents.forEach(opp => {
            if (opp.screenY === undefined || opp.screenY < -100 || opp.screenY > ch + 100) return;
            this.drawSportsCar(ctx, opp.x, opp.screenY, opp.color, opp.carClass, 1.0);
        });

        // Draw player car
        const blinkOff = rs.player.invincible > 0 && Math.floor(rs.player.invincible * 10) % 2 === 0;
        if (!blinkOff) {
            this.drawSportsCar(ctx, rs.player.x, rs.player.y, rs.player.color,
                rs.player.carClass, 1.0);

            // Speed lines when going fast
            if (rs.player.speed > 130) {
                ctx.strokeStyle = `rgba(255,255,255,${(rs.player.speed - 130) / 200})`;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 6; i++) {
                    const sx = rs.player.x + (Math.random() - 0.5) * rs.player.width;
                    const sy = rs.player.y + rs.player.height / 2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (Math.random() - 0.5) * 3, sy + 20 + Math.random() * 30);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        rs.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Curve indicator arrow
        if (Math.abs(curveAtPlayer) > 1.5) {
            const arrowDir = curveAtPlayer > 0 ? '➡️' : '⬅️';
            const sharpness = Math.abs(curveAtPlayer) > 4 ? '⚠️ SHARP ' : '';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(cw / 2 - 60, 8, 120, 28);
            ctx.fillStyle = Math.abs(curveAtPlayer) > 4 ? '#ff4444' : '#fbbf24';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${sharpness}${arrowDir} CURVE`, cw / 2, 26);
        }

        // Minimap
        this.drawMinimap(ctx, cw, ch);
    }

    drawScenery(ctx, x, y, type, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (type === 'tree') {
            ctx.fillStyle = '#4a3418';
            ctx.fillRect(-3, -8, 6, 22);
            ctx.fillStyle = '#1a7a2a';
            ctx.beginPath();
            ctx.arc(0, -16, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(3, -13, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'bush') {
            ctx.fillStyle = '#1a6a1a';
            ctx.beginPath();
            ctx.arc(0, -4, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,40,0,0.3)';
            ctx.beginPath();
            ctx.arc(3, -2, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'banner') {
            // Advertising banner
            ctx.fillStyle = '#888';
            ctx.fillRect(-2, -30, 4, 35);
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(-18, -30, 36, 14);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 7px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SPORTS', 0, -21);
            ctx.fillText('EXTRA', 0, -13);
        } else if (type === 'tirewall') {
            // Tire barrier
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(i * 10 - 10, -5, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(i * 10 - 10, -5, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawObstacle(ctx, obs) {
        ctx.save();
        ctx.translate(obs.x, obs.screenY);

        switch (obs.type) {
            case 'cone':
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.moveTo(0, -obs.height / 2);
                ctx.lineTo(obs.width / 2, obs.height / 2);
                ctx.lineTo(-obs.width / 2, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-4, -1, 8, 3);
                break;

            case 'oilslick':
                ctx.fillStyle = 'rgba(20, 20, 40, 0.7)';
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                // Rainbow sheen
                ctx.fillStyle = 'rgba(100, 50, 150, 0.2)';
                ctx.beginPath();
                ctx.ellipse(-5, -2, 12, 6, 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(50, 150, 100, 0.15)';
                ctx.beginPath();
                ctx.ellipse(5, 2, 10, 5, -0.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'barrier':
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
                // White stripes
                ctx.fillStyle = '#fff';
                for (let sx = -obs.width / 2 + 8; sx < obs.width / 2; sx += 16) {
                    ctx.fillRect(sx, -obs.height / 2, 8, obs.height);
                }
                break;

            case 'debris':
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.moveTo(-obs.width / 2, obs.height / 4);
                ctx.lineTo(-obs.width / 3, -obs.height / 2);
                ctx.lineTo(obs.width / 3, -obs.height / 3);
                ctx.lineTo(obs.width / 2, obs.height / 3);
                ctx.lineTo(0, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(-obs.width / 3, -obs.height / 2);
                ctx.lineTo(0, -obs.height / 3);
                ctx.lineTo(-obs.width / 4, 0);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    drawMinimap(ctx, cw, ch) {
        const rs = this.raceState;
        const mmW = 30;
        const mmH = 130;
        const mmX = cw - mmW - 15;
        const mmY = 15;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(mmX, mmY, mmW, mmH);

        // Lap divisions
        for (let i = 1; i <= rs.totalLaps; i++) {
            const ly = mmY + mmH - (i / rs.totalLaps) * mmH;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(mmX, ly, mmW, 1);
        }

        // Player marker
        const progress = rs.player.distance / rs.trackLength;
        const py = mmY + mmH - progress * mmH;
        ctx.fillStyle = rs.player.color;
        ctx.fillRect(mmX + 4, py - 3, mmW - 8, 6);

        // Opponent markers
        rs.opponents.forEach(opp => {
            const op = opp.distance / rs.trackLength;
            const oy = mmY + mmH - op * mmH;
            ctx.fillStyle = opp.color;
            ctx.fillRect(mmX + 6, oy - 2, mmW - 12, 4);
        });
    }

    // ===== SOUND EFFECTS =====
    getAudioCtx() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioCtx;
    }

    playCountSound() {
        try {
            const ctx = this.getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch(e) {}
    }

    playGoSound() {
        try {
            const ctx = this.getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    playCrashSound() {
        try {
            const ctx = this.getAudioCtx();
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            source.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            source.start(ctx.currentTime);
        } catch(e) {}
    }

    playRepairSound() {
        try {
            const ctx = this.getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const freq = 300 + (this.raceState.repairProgress / this.raceState.repairNeeded) * 500;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch(e) {}
    }

    playFixedSound() {
        try {
            const ctx = this.getAudioCtx();
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                osc.start(ctx.currentTime + i * 0.1);
                osc.stop(ctx.currentTime + i * 0.1 + 0.2);
            });
        } catch(e) {}
    }

    playLapSound() {
        try {
            const ctx = this.getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    playVictorySound() {
        try {
            const ctx = this.getAudioCtx();
            const notes = [523, 659, 784, 1047, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.3);
            });
        } catch(e) {}
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new SportsExtraRacing();
});
