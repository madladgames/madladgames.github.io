// ===== Race Car Builder & Racing Game =====

class RaceCarGame {
    constructor() {
        // DOM elements
        this.buildPhase = document.getElementById('buildPhase');
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
            body: null,
            color: null,
            engine: null,
            tires: null,
            spoiler: null
        };

        // Car body types with stats
        this.carBodies = {
            formula: { name: 'Formula', speedBonus: 30, handling: 0.8, width: 34, height: 70 },
            stock: { name: 'Stock Car', speedBonus: 20, handling: 1.0, width: 38, height: 65 },
            sports: { name: 'Sports Car', speedBonus: 25, handling: 0.9, width: 36, height: 68 },
            muscle: { name: 'Muscle Car', speedBonus: 15, handling: 1.1, width: 40, height: 66 }
        };

        this.carColors = {
            red: '#e11d48',
            blue: '#2563eb',
            green: '#16a34a',
            yellow: '#eab308',
            orange: '#ea580c',
            purple: '#9333ea',
            black: '#1e1e1e',
            white: '#f0f0f0'
        };

        this.engines = {
            turbo: { name: '⚡ Turbo', speedBonus: 20, accel: 1.3 },
            supercharged: { name: '🔥 Supercharged', speedBonus: 30, accel: 1.1 },
            nitro: { name: '💨 Nitro', speedBonus: 40, accel: 1.5 }
        };

        this.tires = {
            slick: { name: '🏁 Slick', grip: 1.2, handling: 0.9 },
            allterrain: { name: '🌄 All-Terrain', grip: 1.0, handling: 1.0 },
            soft: { name: '🔴 Soft Racing', grip: 1.4, handling: 0.85 }
        };

        this.spoilers = {
            none: { name: '❌ None', downforce: 0 },
            small: { name: '📐 Small Wing', downforce: 0.15 },
            big: { name: '🏎️ Big Wing', downforce: 0.3 }
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
        this.bindBuildEvents();
        this.bindRaceEvents();
        this.showPhase('build');
        this.drawPreview();
    }

    // ===== PHASE MANAGEMENT =====
    showPhase(phase) {
        this.buildPhase.classList.remove('active');
        this.racePhase.classList.remove('active');
        if (phase === 'build') {
            this.buildPhase.classList.add('active');
        } else {
            this.racePhase.classList.add('active');
        }
    }

    // ===== BUILD PHASE =====
    bindBuildEvents() {
        // Option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const value = btn.dataset.value;

                // Deselect siblings
                document.querySelectorAll(`.option-btn[data-category="${category}"]`).forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                this.buildConfig[category] = value;

                this.checkBuildComplete();
                this.drawPreview();
            });
        });

        // Start race button
        this.startRaceBtn.addEventListener('click', () => {
            if (this.isBuildComplete()) {
                this.startRace();
            }
        });
    }

    isBuildComplete() {
        return this.buildConfig.body && this.buildConfig.color &&
               this.buildConfig.engine && this.buildConfig.tires &&
               this.buildConfig.spoiler;
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
        c.fillRect(0, 0, w, h);

        // Lane markings
        c.setLineDash([10, 10]);
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(w * 0.3, 0);
        c.lineTo(w * 0.3, h);
        c.moveTo(w * 0.7, 0);
        c.lineTo(w * 0.7, h);
        c.stroke();
        c.setLineDash([]);

        // Draw car preview
        const color = this.buildConfig.color ? this.carColors[this.buildConfig.color] : '#888';
        const bodyType = this.buildConfig.body || 'sports';
        const hasSpoiler = this.buildConfig.spoiler && this.buildConfig.spoiler !== 'none';
        const bigSpoiler = this.buildConfig.spoiler === 'big';

        this.drawCar(c, w / 2, h / 2, color, bodyType, hasSpoiler, bigSpoiler, 2.0);
    }

    drawCar(ctx, cx, cy, color, bodyType, hasSpoiler, bigSpoiler, scale) {
        scale = scale || 1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const body = this.carBodies[bodyType] || this.carBodies.sports;
        const hw = body.width / 2;
        const hh = body.height / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, hw + 4, hh + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tires
        ctx.fillStyle = '#222';
        const tireW = 6, tireH = 14;
        // Front tires
        ctx.fillRect(-hw - tireW + 1, -hh + 6, tireW, tireH);
        ctx.fillRect(hw - 1, -hh + 6, tireW, tireH);
        // Rear tires
        ctx.fillRect(-hw - tireW + 1, hh - 20, tireW, tireH);
        ctx.fillRect(hw - 1, hh - 20, tireW, tireH);

        // Tire rims
        ctx.fillStyle = '#999';
        ctx.fillRect(-hw - tireW + 3, -hh + 9, 2, 8);
        ctx.fillRect(hw + 1, -hh + 9, 2, 8);
        ctx.fillRect(-hw - tireW + 3, hh - 17, 2, 8);
        ctx.fillRect(hw + 1, hh - 17, 2, 8);

        // Main body
        ctx.fillStyle = color;
        if (bodyType === 'formula') {
            // Narrow front, wider rear
            ctx.beginPath();
            ctx.moveTo(-hw * 0.4, -hh);
            ctx.lineTo(hw * 0.4, -hh);
            ctx.lineTo(hw, -hh * 0.3);
            ctx.lineTo(hw, hh);
            ctx.lineTo(-hw, hh);
            ctx.lineTo(-hw, -hh * 0.3);
            ctx.closePath();
            ctx.fill();
        } else if (bodyType === 'muscle') {
            // Boxy body
            ctx.beginPath();
            ctx.moveTo(-hw * 0.7, -hh);
            ctx.lineTo(hw * 0.7, -hh);
            ctx.lineTo(hw, -hh * 0.5);
            ctx.lineTo(hw, hh);
            ctx.lineTo(-hw, hh);
            ctx.lineTo(-hw, -hh * 0.5);
            ctx.closePath();
            ctx.fill();
        } else {
            // Rounded for sports/stock
            ctx.beginPath();
            ctx.moveTo(-hw * 0.5, -hh);
            ctx.quadraticCurveTo(0, -hh - 4, hw * 0.5, -hh);
            ctx.lineTo(hw, -hh * 0.4);
            ctx.lineTo(hw, hh * 0.8);
            ctx.quadraticCurveTo(hw, hh, hw * 0.8, hh);
            ctx.lineTo(-hw * 0.8, hh);
            ctx.quadraticCurveTo(-hw, hh, -hw, hh * 0.8);
            ctx.lineTo(-hw, -hh * 0.4);
            ctx.closePath();
            ctx.fill();
        }

        // Body highlights
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-hw + 3, -hh * 0.3, hw - 3, hh * 0.5);

        // Darker bottom stripe
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-hw + 2, hh * 0.3, (hw - 2) * 2, hh * 0.3);

        // Windshield
        ctx.fillStyle = 'rgba(120, 180, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.55, -hh * 0.15);
        ctx.lineTo(hw * 0.55, -hh * 0.15);
        ctx.lineTo(hw * 0.45, -hh * 0.55);
        ctx.lineTo(-hw * 0.45, -hh * 0.55);
        ctx.closePath();
        ctx.fill();
        // Windshield glare
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.35, -hh * 0.2);
        ctx.lineTo(-hw * 0.1, -hh * 0.2);
        ctx.lineTo(-hw * 0.15, -hh * 0.45);
        ctx.lineTo(-hw * 0.35, -hh * 0.45);
        ctx.closePath();
        ctx.fill();

        // Rear window
        ctx.fillStyle = 'rgba(120, 180, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, hh * 0.15);
        ctx.lineTo(hw * 0.5, hh * 0.15);
        ctx.lineTo(hw * 0.4, hh * 0.45);
        ctx.lineTo(-hw * 0.4, hh * 0.45);
        ctx.closePath();
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath();
        ctx.arc(-hw * 0.4, -hh + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hw * 0.4, -hh + 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Taillights
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(-hw * 0.6, hh - 4, 6, 3);
        ctx.fillRect(hw * 0.6 - 6, hh - 4, 6, 3);

        // Racing number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('#1', 0, 5);

        // Spoiler
        if (hasSpoiler) {
            ctx.fillStyle = '#333';
            const sw = bigSpoiler ? hw * 1.4 : hw * 1.0;
            const sh = bigSpoiler ? 6 : 4;
            ctx.fillRect(-sw, hh - 2, sw * 2, sh);
            // Spoiler supports
            ctx.fillRect(-hw * 0.4, hh - 6, 3, 8);
            ctx.fillRect(hw * 0.4 - 3, hh - 6, 3, 8);
            if (bigSpoiler) {
                ctx.fillStyle = color;
                ctx.fillRect(-sw + 2, hh - 1, sw * 2 - 4, sh - 2);
            }
        }

        // Air intake on hood (formula/sports)
        if (bodyType === 'formula' || bodyType === 'sports') {
            ctx.fillStyle = '#222';
            ctx.fillRect(-4, -hh * 0.7, 8, 5);
        }

        ctx.restore();
    }

    // ===== RACE PHASE =====
    startRace() {
        this.showPhase('race');
        this.resizeCanvas();

        // Calculate car stats from build
        const body = this.carBodies[this.buildConfig.body];
        const engine = this.engines[this.buildConfig.engine];
        const tire = this.tires[this.buildConfig.tires];
        const spoiler = this.spoilers[this.buildConfig.spoiler];

        const topSpeed = 180 + body.speedBonus + engine.speedBonus;
        const accel = 60 * engine.accel;
        const handling = body.handling * tire.handling * (1 + spoiler.downforce);
        const grip = tire.grip * (1 + spoiler.downforce * 0.5);

        // Determine race duration (120-400 seconds) based on laps
        // At avg speed ~200, we need trackLength 24000-80000 for 120-400s races
        const totalLaps = 4 + Math.floor(Math.random() * 5); // 4-8 laps
        const lapLength = 5000 + Math.random() * 5000; // 5000-10000 units
        const trackLength = totalLaps * lapLength;

        this.raceState = {
            // Player car
            player: {
                x: this.canvas.width / 2,
                y: this.canvas.height * 0.75,
                speed: 0,
                topSpeed: topSpeed,
                accel: accel,
                handling: handling * 3.5,
                grip: grip,
                color: this.carColors[this.buildConfig.color],
                bodyType: this.buildConfig.body,
                hasSpoiler: this.buildConfig.spoiler !== 'none',
                bigSpoiler: this.buildConfig.spoiler === 'big',
                width: body.width * 2,
                height: body.height * 2,
                steerAngle: 0,
                distance: 0,
                lap: 1,
                invincible: 0 // invincibility frames after crash
            },

            // AI opponents
            opponents: [],

            // Obstacles (other traffic/barriers)
            obstacles: [],

            // Track
            trackWidth: 360,
            roadMarkings: [],
            trackLength: trackLength,
            lapLength: lapLength,
            totalLaps: totalLaps,

            // Race info
            raceTime: 0,
            raceFinished: false,
            paused: false,

            // Crashes
            crashCount: 0,
            maxCrashes: 3,
            carBroken: false,
            repairProgress: 0,
            repairNeeded: 15, // space presses needed

            // Scrolling
            scrollSpeed: 0,
            scrollOffset: 0,

            // Particles
            particles: [],

            // Track curves
            trackCurve: 0,
            targetCurve: 0,
            curveChangeTimer: 0,

            // Total crashes in race (for stats)
            totalCrashes: 0,
            repairs: 0
        };

        // Generate AI opponents
        this.generateOpponents();

        // Generate initial obstacles
        this.generateInitialObstacles();

        // Init road markings
        this.initRoadMarkings();

        // Start countdown
        this.doCountdown();
    }

    generateOpponents() {
        const colors = ['#2563eb', '#16a34a', '#eab308', '#9333ea', '#ea580c'];
        const bodies = ['formula', 'stock', 'sports', 'muscle'];
        const numOpponents = 4;

        for (let i = 0; i < numOpponents; i++) {
            const body = this.carBodies[bodies[i % bodies.length]];
            this.raceState.opponents.push({
                x: this.canvas.width / 2 + (i - 1.5) * 80,
                relativeY: (i + 1) * 200, // distance ahead or behind
                speed: 100 + Math.random() * 60,
                topSpeed: 150 + Math.random() * 40,
                color: colors[i % colors.length],
                bodyType: bodies[i % bodies.length],
                hasSpoiler: Math.random() > 0.3,
                bigSpoiler: Math.random() > 0.6,
                width: body.width * 2,
                height: body.height * 2,
                laneTarget: this.canvas.width / 2 + (Math.random() - 0.5) * 250,
                laneChangeTimer: 0,
                distance: (i + 1) * 200
            });
        }
    }

    generateInitialObstacles() {
        // Place some obstacles ahead
        for (let i = 0; i < 8; i++) {
            this.spawnObstacle(600 + i * 400 + Math.random() * 300);
        }
    }

    spawnObstacle(distanceAhead) {
        const rs = this.raceState;
        const trackHalf = rs.trackWidth / 2;
        const cx = this.canvas.width / 2;
        const types = ['barrier', 'cone', 'oil', 'tire'];
        const type = types[Math.floor(Math.random() * types.length)];

        let width, height;
        if (type === 'barrier') { width = 50; height = 20; }
        else if (type === 'cone') { width = 16; height = 16; }
        else if (type === 'oil') { width = 40; height = 30; }
        else { width = 20; height = 20; }

        this.raceState.obstacles.push({
            x: cx + (Math.random() - 0.5) * (rs.trackWidth - 60),
            distanceOffset: distanceAhead,
            type: type,
            width: width,
            height: height,
            active: true
        });
    }

    initRoadMarkings() {
        for (let i = 0; i < 30; i++) {
            this.raceState.roadMarkings.push({
                y: i * 40
            });
        }
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
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Space for repair
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

        // Touch controls
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

        // Play again
        this.playAgainBtn.addEventListener('click', () => {
            this.finishOverlay.classList.remove('active');
            this.crashOverlay.classList.remove('active');
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.raceState = null;
            this.showPhase('build');
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.raceState) {
                this.resizeCanvas();
            }
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
            // Car repaired!
            rs.carBroken = false;
            rs.crashCount = 0;
            rs.repairProgress = 0;
            rs.repairs++;
            rs.player.invincible = 2.0; // 2 seconds invincibility
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
        const ch = this.canvas.height;

        // Update race time
        rs.raceTime += dt;

        // Invincibility countdown
        if (player.invincible > 0) {
            player.invincible -= dt;
        }

        // --- Track curves ---
        rs.curveChangeTimer -= dt;
        if (rs.curveChangeTimer <= 0) {
            rs.targetCurve = (Math.random() - 0.5) * 2.5;
            rs.curveChangeTimer = 3 + Math.random() * 4;
        }
        rs.trackCurve += (rs.targetCurve - rs.trackCurve) * dt * 0.8;

        // --- Player acceleration ---
        // Auto-accelerate (car goes fast!)
        const targetSpeed = player.topSpeed;
        if (player.speed < targetSpeed) {
            player.speed += player.accel * dt;
            if (player.speed > targetSpeed) player.speed = targetSpeed;
        }

        // Braking (down arrow)
        if (this.keys['ArrowDown']) {
            player.speed -= player.accel * 2 * dt;
            if (player.speed < 30) player.speed = 30;
        }

        // Steering
        let steerInput = 0;
        if (this.keys['ArrowLeft']) steerInput = -1;
        if (this.keys['ArrowRight']) steerInput = 1;

        // Apply track curve effect on steering
        const curveForce = rs.trackCurve * (player.speed / player.topSpeed) * 100 * dt;
        player.x += curveForce;

        // Apply steering
        player.x += steerInput * player.handling * (player.speed / 80) * 60 * dt;

        // Track boundaries
        const trackLeft = (cw - rs.trackWidth) / 2 + player.width / 2;
        const trackRight = (cw + rs.trackWidth) / 2 - player.width / 2;

        if (player.x < trackLeft) {
            player.x = trackLeft;
            player.speed *= 0.95; // Wall scrape slows down
        }
        if (player.x > trackRight) {
            player.x = trackRight;
            player.speed *= 0.95;
        }

        // Scroll speed = player speed
        rs.scrollSpeed = player.speed * 2.5;
        rs.scrollOffset += rs.scrollSpeed * dt;

        // Distance tracking
        player.distance += player.speed * dt;

        // Lap tracking
        const currentLap = Math.floor(player.distance / rs.lapLength) + 1;
        if (currentLap > player.lap && player.lap < rs.totalLaps) {
            player.lap = currentLap;
            this.playLapSound();
        }

        // Check race finish
        if (player.distance >= rs.trackLength) {
            this.finishRace();
            return;
        }

        // --- Update opponents ---
        this.updateOpponents(dt);

        // --- Update obstacles ---
        this.updateObstacles(dt);

        // --- Check collisions ---
        if (player.invincible <= 0) {
            this.checkCollisions();
        }

        // --- Update particles ---
        this.updateParticles(dt);

        // --- Spawn new obstacles ---
        this.maybeSpawnObstacle();

        // --- Update HUD ---
        this.updateHUD();
    }

    updateOpponents(dt) {
        const rs = this.raceState;
        const player = rs.player;

        rs.opponents.forEach(opp => {
            // AI speed variation
            opp.speed += (opp.topSpeed - opp.speed) * dt * 0.5;
            opp.speed += (Math.random() - 0.5) * 20 * dt;
            if (opp.speed < 80) opp.speed = 80;
            if (opp.speed > opp.topSpeed + 10) opp.speed = opp.topSpeed + 10;

            // Distance
            opp.distance += opp.speed * dt;

            // Lane changes
            opp.laneChangeTimer -= dt;
            if (opp.laneChangeTimer <= 0) {
                opp.laneTarget = this.canvas.width / 2 + (Math.random() - 0.5) * (rs.trackWidth - 80);
                opp.laneChangeTimer = 2 + Math.random() * 4;
            }

            // Move toward lane target
            const dx = opp.laneTarget - opp.x;
            opp.x += dx * dt * 1.5;

            // Screen Y position based on relative distance to player
            const relDist = opp.distance - player.distance;
            opp.screenY = player.y - relDist * 2.5;
        });
    }

    updateObstacles(dt) {
        const rs = this.raceState;

        rs.obstacles.forEach(obs => {
            // Move obstacles relative to player scroll
            obs.screenY = this.canvas.height * 0.75 - (obs.distanceOffset - rs.player.distance) * 2.5;
        });

        // Remove off-screen obstacles
        rs.obstacles = rs.obstacles.filter(obs => {
            return obs.active && obs.distanceOffset > rs.player.distance - 200;
        });
    }

    maybeSpawnObstacle() {
        const rs = this.raceState;
        // Keep obstacles ahead
        const farthest = rs.obstacles.reduce((max, o) => Math.max(max, o.distanceOffset), rs.player.distance);
        if (farthest < rs.player.distance + 2500) {
            this.spawnObstacle(rs.player.distance + 2000 + Math.random() * 1000);
        }
    }

    checkCollisions() {
        const rs = this.raceState;
        const player = rs.player;
        const ph = player.height / 2;
        const pw = player.width / 2;

        // Check obstacles
        rs.obstacles.forEach(obs => {
            if (!obs.active) return;
            const oy = obs.screenY;
            if (oy === undefined) return;

            // Simple AABB collision on screen
            const py = player.y;
            if (Math.abs(player.x - obs.x) < (pw + obs.width / 2) &&
                Math.abs(py - oy) < (ph + obs.height / 2)) {
                obs.active = false;
                this.handleCrash();
            }
        });

        // Check opponent collisions
        rs.opponents.forEach(opp => {
            if (opp.screenY === undefined) return;
            if (Math.abs(player.x - opp.x) < (pw + opp.width / 2) &&
                Math.abs(player.y - opp.screenY) < (ph + opp.height / 2)) {
                // Push opponent away
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

        // Screen shake
        this.canvasWrap.classList.add('screen-shake');
        setTimeout(() => this.canvasWrap.classList.remove('screen-shake'), 400);

        // Slow down
        rs.player.speed *= 0.3;

        // Spawn crash particles
        this.spawnCrashParticles(rs.player.x, rs.player.y);
        this.playCrashSound();

        if (rs.crashCount >= rs.maxCrashes) {
            // Car is broken!
            rs.carBroken = true;
            rs.player.speed = 0;
            rs.repairProgress = 0;
            this.repairBarFill.style.width = '0%';
            this.crashText.textContent = `💥 CAR BROKEN! (Crash ${rs.totalCrashes})`;
            this.crashOverlay.classList.add('active');
        }

        this.updateHUD();
    }

    spawnCrashParticles(x, y) {
        const rs = this.raceState;
        const colors = ['#ff4444', '#ff8800', '#ffff00', '#ff6600', '#333'];
        for (let i = 0; i < 20; i++) {
            rs.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0.5 + Math.random() * 0.5,
                size: 3 + Math.random() * 6
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
    }

    finishRace() {
        const rs = this.raceState;
        rs.raceFinished = true;

        // Calculate position (based on distance vs opponents)
        let position = 1;
        rs.opponents.forEach(opp => {
            if (opp.distance > rs.player.distance) position++;
        });

        const minutes = Math.floor(rs.raceTime / 60);
        const seconds = Math.floor(rs.raceTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        let titleText = '🏆 RACE COMPLETE!';
        if (position === 1) titleText = '🏆 YOU WIN! 1ST PLACE!';
        else if (position === 2) titleText = '🥈 2ND PLACE!';
        else if (position === 3) titleText = '🥉 3RD PLACE!';

        this.finishTitle.textContent = titleText;
        this.finishStats.innerHTML = `
            <div>⏱️ Time: ${timeStr}</div>
            <div>🏁 Laps: ${rs.totalLaps}</div>
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
        this.hudLap.textContent = `${rs.player.lap}/${rs.totalLaps}`;
        this.hudCrash.textContent = `${rs.crashCount}/${rs.maxCrashes}`;

        // Position
        let position = 1;
        rs.opponents.forEach(opp => {
            if (opp.distance > rs.player.distance) position++;
        });
        const suffix = ['st', 'nd', 'rd', 'th', 'th'];
        this.hudPosition.textContent = position + suffix[position - 1];
    }

    // ===== DRAWING =====
    drawRace() {
        const ctx = this.ctx;
        const rs = this.raceState;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        // Clear
        ctx.fillStyle = '#1a5c1a';
        ctx.fillRect(0, 0, cw, ch);

        // Draw grass stripes
        const grassOffset = rs.scrollOffset % 60;
        ctx.fillStyle = '#1e6b1e';
        for (let y = -60 + grassOffset % 60; y < ch; y += 60) {
            ctx.fillRect(0, y, cw, 25);
        }

        // Draw track (road)
        const trackLeft = (cw - rs.trackWidth) / 2;
        const trackRight = trackLeft + rs.trackWidth;

        // Road surface
        ctx.fillStyle = '#444';
        ctx.fillRect(trackLeft, 0, rs.trackWidth, ch);

        // Track edges (rumble strips)
        const rumbleOffset = Math.floor(rs.scrollOffset / 20) % 2;
        for (let y = 0; y < ch; y += 20) {
            ctx.fillStyle = ((y / 20 + rumbleOffset) % 2 === 0) ? '#ff0000' : '#ffffff';
            ctx.fillRect(trackLeft - 8, y, 8, 20);
            ctx.fillRect(trackRight, y, 8, 20);
        }

        // Lane markings
        ctx.fillStyle = '#fff';
        const markingOffset = rs.scrollOffset % 80;
        for (let y = -80 + markingOffset; y < ch; y += 80) {
            // 3 lane dividers
            for (let l = 1; l <= 3; l++) {
                const lx = trackLeft + (rs.trackWidth / 4) * l - 2;
                ctx.fillRect(lx, y, 4, 35);
            }
        }

        // Center line (different color)
        ctx.fillStyle = '#ffff00';
        for (let y = -80 + markingOffset; y < ch; y += 80) {
            const lx = trackLeft + rs.trackWidth / 2 - 2;
            ctx.fillRect(lx, y, 4, 35);
        }

        // Draw lap markers
        const lapMarkDist = rs.lapLength;
        for (let lap = 1; lap <= rs.totalLaps; lap++) {
            const markDist = lap * lapMarkDist;
            const screenY = rs.player.y - (markDist - rs.player.distance) * 2.5;
            if (screenY > -20 && screenY < ch + 20) {
                // Checkered pattern
                ctx.fillStyle = '#000';
                ctx.fillRect(trackLeft, screenY - 10, rs.trackWidth, 20);
                for (let bx = 0; bx < rs.trackWidth; bx += 20) {
                    for (let by = 0; by < 20; by += 10) {
                        if (((bx / 20) + (by / 10)) % 2 === 0) {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(trackLeft + bx, screenY - 10 + by, 20, 10);
                        }
                    }
                }
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(lap === rs.totalLaps ? '🏁 FINISH' : `LAP ${lap}`, cw / 2, screenY + 4);
            }
        }

        // Draw obstacles
        rs.obstacles.forEach(obs => {
            if (obs.screenY === undefined || obs.screenY < -50 || obs.screenY > ch + 50) return;
            this.drawObstacle(ctx, obs);
        });

        // Draw opponents
        rs.opponents.forEach(opp => {
            if (opp.screenY === undefined || opp.screenY < -100 || opp.screenY > ch + 100) return;
            this.drawCar(ctx, opp.x, opp.screenY, opp.color, opp.bodyType, opp.hasSpoiler, opp.bigSpoiler, 1.0);
        });

        // Draw player car
        const blinkOff = rs.player.invincible > 0 && Math.floor(rs.player.invincible * 10) % 2 === 0;
        if (!blinkOff) {
            this.drawCar(ctx, rs.player.x, rs.player.y, rs.player.color,
                rs.player.bodyType, rs.player.hasSpoiler, rs.player.bigSpoiler, 1.0);

            // Speed lines when going fast
            if (rs.player.speed > 100) {
                ctx.strokeStyle = `rgba(255,255,255,${(rs.player.speed - 100) / 200})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    const sx = rs.player.x + (Math.random() - 0.5) * rs.player.width;
                    const sy = rs.player.y + rs.player.height / 2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (Math.random() - 0.5) * 4, sy + 15 + Math.random() * 25);
                    ctx.stroke();
                }
            }

            // Exhaust particles when accelerating
            if (rs.player.speed > 50) {
                for (let i = 0; i < 2; i++) {
                    rs.particles.push({
                        x: rs.player.x + (Math.random() - 0.5) * 10,
                        y: rs.player.y + rs.player.height / 2 + 5,
                        vx: (Math.random() - 0.5) * 30,
                        vy: 50 + Math.random() * 50,
                        color: `rgba(150,150,150,0.5)`,
                        life: 0.3 + Math.random() * 0.2,
                        size: 2 + Math.random() * 3
                    });
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

        // Minimap
        this.drawMinimap(ctx, cw, ch);
    }

    drawObstacle(ctx, obs) {
        ctx.save();
        ctx.translate(obs.x, obs.screenY);

        switch (obs.type) {
            case 'barrier':
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-obs.width / 2 + 5, -obs.height / 2 + 3, 8, obs.height - 6);
                ctx.fillRect(obs.width / 2 - 13, -obs.height / 2 + 3, 8, obs.height - 6);
                break;
            case 'cone':
                ctx.fillStyle = '#ff8800';
                ctx.beginPath();
                ctx.moveTo(0, -obs.height / 2);
                ctx.lineTo(obs.width / 2, obs.height / 2);
                ctx.lineTo(-obs.width / 2, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-4, -2, 8, 4);
                break;
            case 'oil':
                ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
                ctx.beginPath();
                ctx.ellipse(-5, -3, 8, 5, 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'tire':
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(0, 0, obs.width / 4, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    drawMinimap(ctx, cw, ch) {
        const rs = this.raceState;
        const mmW = 30;
        const mmH = 120;
        const mmX = cw - mmW - 15;
        const mmY = 15;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(mmX, mmY, mmW, mmH);

        // Progress marker
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

        // Lap lines
        for (let i = 1; i <= rs.totalLaps; i++) {
            const ly = mmY + mmH - (i / rs.totalLaps) * mmH;
            ctx.fillStyle = '#fff';
            ctx.fillRect(mmX, ly, mmW, 1);
        }
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
            // Noise burst for crash
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
    new RaceCarGame();
});
