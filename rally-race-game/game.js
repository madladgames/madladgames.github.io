// ===== Rally Race Game =====

class RallyRaceGame {
    constructor() {
        // DOM elements
        this.garagePhase = document.getElementById('garagePhase');
        this.racePhase = document.getElementById('racePhase');
        this.startRallyBtn = document.getElementById('startRallyBtn');
        this.canvas = document.getElementById('raceCanvas');
        this.ctx = this.canvas.getContext('2d');

        // HUD elements
        this.hudSpeed = document.getElementById('hudSpeed');
        this.hudTime = document.getElementById('hudTime');
        this.hudStage = document.getElementById('hudStage');
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

        // Car build options — spoiler is ALWAYS big, pre-selected
        this.buildConfig = {
            color: null,
            rallyClass: null
        };

        // Rally classes (car types)
        this.rallyClasses = {
            wrc: { name: 'WRC', speedBonus: 40, handling: 1.0, accel: 1.4, width: 36, height: 68, desc: 'Top-tier rally machine' },
            rally2: { name: 'Rally2', speedBonus: 30, handling: 1.1, accel: 1.2, width: 38, height: 66, desc: 'Balanced and fast' },
            group_b: { name: 'Group B', speedBonus: 55, handling: 0.8, accel: 1.6, width: 40, height: 70, desc: 'Legendary speed beast' },
            rally4: { name: 'Rally4', speedBonus: 20, handling: 1.3, accel: 1.1, width: 34, height: 64, desc: 'Nimble and grippy' }
        };

        this.carColors = {
            red: '#e11d48',
            blue: '#2563eb',
            green: '#16a34a',
            yellow: '#eab308',
            orange: '#ea580c',
            white: '#f0f0f0',
            black: '#1e1e1e',
            cyan: '#06b6d4'
        };

        // Terrain types for rally stages
        this.terrainTypes = {
            gravel: { name: 'Gravel', color: '#8B7355', grip: 0.85, dustColor: 'rgba(180,160,120,0.6)' },
            dirt: { name: 'Dirt', color: '#6B4423', grip: 0.8, dustColor: 'rgba(140,100,60,0.6)' },
            mud: { name: 'Mud', color: '#4A3728', grip: 0.65, dustColor: 'rgba(100,70,40,0.7)' },
            snow: { name: 'Snow', color: '#D4D8E0', grip: 0.6, dustColor: 'rgba(220,230,255,0.7)' },
            tarmac: { name: 'Tarmac', color: '#444', grip: 1.0, dustColor: 'rgba(80,80,80,0.4)' }
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

        this.startRallyBtn.addEventListener('click', () => {
            if (this.isBuildComplete()) {
                this.startRace();
            }
        });
    }

    isBuildComplete() {
        return this.buildConfig.color && this.buildConfig.rallyClass;
    }

    checkBuildComplete() {
        this.startRallyBtn.disabled = !this.isBuildComplete();
    }

    drawPreview() {
        const c = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;
        c.clearRect(0, 0, w, h);

        // Draw gravel road background
        c.fillStyle = '#8B7355';
        c.fillRect(0, 0, w, h);

        // Some gravel texture dots
        c.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 60; i++) {
            c.beginPath();
            c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2);
            c.fill();
        }

        // Lane edges
        c.setLineDash([8, 8]);
        c.strokeStyle = 'rgba(255,255,255,0.4)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(w * 0.15, 0); c.lineTo(w * 0.15, h);
        c.moveTo(w * 0.85, 0); c.lineTo(w * 0.85, h);
        c.stroke();
        c.setLineDash([]);

        // Draw car preview — always with BIG spoiler
        const color = this.buildConfig.color ? this.carColors[this.buildConfig.color] : '#888';
        const rallyClass = this.buildConfig.rallyClass || 'wrc';

        this.drawRallyCar(c, w / 2, h / 2, color, rallyClass, true, 2.0);
    }

    drawRallyCar(ctx, cx, cy, color, rallyClass, hasBigSpoiler, scale) {
        scale = scale || 1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const body = this.rallyClasses[rallyClass] || this.rallyClasses.wrc;
        const hw = body.width / 2;
        const hh = body.height / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, hw + 4, hh + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tires — rally tires are chunkier
        ctx.fillStyle = '#1a1a1a';
        const tireW = 7, tireH = 15;
        // Front tires
        ctx.fillRect(-hw - tireW + 1, -hh + 6, tireW, tireH);
        ctx.fillRect(hw - 1, -hh + 6, tireW, tireH);
        // Rear tires
        ctx.fillRect(-hw - tireW + 1, hh - 20, tireW, tireH);
        ctx.fillRect(hw - 1, hh - 20, tireW, tireH);

        // Tire treads (rally knobby look)
        ctx.fillStyle = '#333';
        for (let t = 0; t < 3; t++) {
            const ty1 = -hh + 8 + t * 4;
            const ty2 = hh - 18 + t * 4;
            ctx.fillRect(-hw - tireW + 2, ty1, tireW - 2, 1);
            ctx.fillRect(hw, ty1, tireW - 2, 1);
            ctx.fillRect(-hw - tireW + 2, ty2, tireW - 2, 1);
            ctx.fillRect(hw, ty2, tireW - 2, 1);
        }

        // Main body — rally car shape (compact hatchback look)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, -hh);
        ctx.quadraticCurveTo(0, -hh - 3, hw * 0.5, -hh);
        ctx.lineTo(hw, -hh * 0.35);
        ctx.lineTo(hw, hh * 0.85);
        ctx.quadraticCurveTo(hw * 0.9, hh, hw * 0.7, hh);
        ctx.lineTo(-hw * 0.7, hh);
        ctx.quadraticCurveTo(-hw * 0.9, hh, -hw, hh * 0.85);
        ctx.lineTo(-hw, -hh * 0.35);
        ctx.closePath();
        ctx.fill();

        // Body highlights
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-hw + 3, -hh * 0.3, hw - 3, hh * 0.4);

        // Rally livery stripes
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(-hw * 0.15, -hh + 5, hw * 0.3, hh * 2 - 10);

        // Darker bottom
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-hw + 2, hh * 0.4, (hw - 2) * 2, hh * 0.3);

        // Rally number plate (door panel)
        ctx.fillStyle = 'white';
        ctx.fillRect(-hw + 4, -5, 14, 14);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', -hw + 11, 2);

        // Windshield
        ctx.fillStyle = 'rgba(120, 200, 255, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.55, -hh * 0.1);
        ctx.lineTo(hw * 0.55, -hh * 0.1);
        ctx.lineTo(hw * 0.42, -hh * 0.55);
        ctx.lineTo(-hw * 0.42, -hh * 0.55);
        ctx.closePath();
        ctx.fill();

        // Windshield glare
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.3, -hh * 0.15);
        ctx.lineTo(-hw * 0.08, -hh * 0.15);
        ctx.lineTo(-hw * 0.12, -hh * 0.45);
        ctx.lineTo(-hw * 0.28, -hh * 0.45);
        ctx.closePath();
        ctx.fill();

        // Rear window
        ctx.fillStyle = 'rgba(120, 200, 255, 0.45)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.45, hh * 0.15);
        ctx.lineTo(hw * 0.45, hh * 0.15);
        ctx.lineTo(hw * 0.35, hh * 0.42);
        ctx.lineTo(-hw * 0.35, hh * 0.42);
        ctx.closePath();
        ctx.fill();

        // Rally lights (4 lights on front — light pod)
        ctx.fillStyle = '#ffffcc';
        const lightY = -hh + 2;
        ctx.beginPath(); ctx.arc(-hw * 0.35, lightY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-hw * 0.12, lightY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hw * 0.12, lightY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hw * 0.35, lightY, 3, 0, Math.PI * 2); ctx.fill();
        // Light pod bar
        ctx.fillStyle = '#555';
        ctx.fillRect(-hw * 0.45, lightY - 1, hw * 0.9, 2);

        // Taillights
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(-hw * 0.55, hh - 4, 7, 3);
        ctx.fillRect(hw * 0.55 - 7, hh - 4, 7, 3);

        // Mud flaps
        ctx.fillStyle = '#222';
        ctx.fillRect(-hw - 2, hh - 8, 4, 6);
        ctx.fillRect(hw - 2, hh - 8, 4, 6);

        // ===== BIG SPOILER (always on!) =====
        if (hasBigSpoiler) {
            // Spoiler supports (two tall pillars)
            ctx.fillStyle = '#333';
            ctx.fillRect(-hw * 0.35, hh - 10, 3, 14);
            ctx.fillRect(hw * 0.35 - 3, hh - 10, 3, 14);

            // Main spoiler wing — BIG and wide
            const sw = hw * 1.5;
            ctx.fillStyle = '#222';
            ctx.fillRect(-sw, hh + 1, sw * 2, 7);

            // Spoiler top colored accent
            ctx.fillStyle = color;
            ctx.fillRect(-sw + 2, hh + 2, sw * 2 - 4, 4);

            // Endplates
            ctx.fillStyle = '#333';
            ctx.fillRect(-sw - 2, hh - 2, 4, 12);
            ctx.fillRect(sw - 2, hh - 2, 4, 12);

            // Gurney flap
            ctx.fillStyle = '#111';
            ctx.fillRect(-sw + 1, hh + 7, sw * 2 - 2, 2);
        }

        // Roof scoop / air intake
        ctx.fillStyle = '#333';
        ctx.fillRect(-5, -hh * 0.65, 10, 6);
        ctx.fillStyle = '#111';
        ctx.fillRect(-3, -hh * 0.65, 6, 3);

        ctx.restore();
    }

    // ===== RACE PHASE =====
    startRace() {
        this.showPhase('race');
        this.resizeCanvas();

        const rallyClass = this.rallyClasses[this.buildConfig.rallyClass];

        const topSpeed = 220 + rallyClass.speedBonus;
        const accel = 80 * rallyClass.accel;
        const handling = rallyClass.handling * 3.8;

        // Generate rally stages
        const numStages = 4 + Math.floor(Math.random() * 3); // 4-6 stages
        const stageLength = 4000 + Math.random() * 3000;
        const trackLength = numStages * stageLength;

        // Assign terrain to stages
        const terrainKeys = Object.keys(this.terrainTypes);
        const stages = [];
        for (let i = 0; i < numStages; i++) {
            const terrainKey = terrainKeys[Math.floor(Math.random() * terrainKeys.length)];
            stages.push({
                terrain: terrainKey,
                startDist: i * stageLength,
                endDist: (i + 1) * stageLength
            });
        }

        this.raceState = {
            player: {
                x: this.canvas.width / 2,
                y: this.canvas.height * 0.75,
                speed: 0,
                topSpeed: topSpeed,
                accel: accel,
                handling: handling,
                color: this.carColors[this.buildConfig.color],
                rallyClass: this.buildConfig.rallyClass,
                width: rallyClass.width * 2,
                height: rallyClass.height * 2,
                distance: 0,
                stage: 1,
                invincible: 0,
                driftAngle: 0
            },

            opponents: [],
            obstacles: [],

            trackWidth: 340,
            trackLength: trackLength,
            stageLength: stageLength,
            numStages: numStages,
            stages: stages,

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

            trackCurve: 0,
            targetCurve: 0,
            curveChangeTimer: 0,

            totalCrashes: 0,
            repairs: 0,

            // Trees & scenery
            scenery: [],
            sceneryTimer: 0,

            // Terrain dust particles
            dustParticles: []
        };

        this.generateOpponents();
        this.generateInitialObstacles();
        this.generateInitialScenery();
        this.doCountdown();
    }

    getCurrentTerrain() {
        const rs = this.raceState;
        const dist = rs.player.distance;
        for (const stage of rs.stages) {
            if (dist >= stage.startDist && dist < stage.endDist) {
                return this.terrainTypes[stage.terrain];
            }
        }
        return this.terrainTypes.gravel;
    }

    getCurrentTerrainKey() {
        const rs = this.raceState;
        const dist = rs.player.distance;
        for (const stage of rs.stages) {
            if (dist >= stage.startDist && dist < stage.endDist) {
                return stage.terrain;
            }
        }
        return 'gravel';
    }

    generateOpponents() {
        const colors = ['#2563eb', '#16a34a', '#eab308', '#9333ea', '#ea580c', '#06b6d4'];
        const classes = ['wrc', 'rally2', 'group_b', 'rally4'];
        const numOpponents = 5;

        for (let i = 0; i < numOpponents; i++) {
            const rc = classes[i % classes.length];
            const body = this.rallyClasses[rc];
            this.raceState.opponents.push({
                x: this.canvas.width / 2 + (i - 2) * 70,
                speed: 120 + Math.random() * 60,
                topSpeed: 170 + Math.random() * 50,
                color: colors[i % colors.length],
                rallyClass: rc,
                width: body.width * 2,
                height: body.height * 2,
                laneTarget: this.canvas.width / 2 + (Math.random() - 0.5) * 250,
                laneChangeTimer: 0,
                distance: (i + 1) * 250
            });
        }
    }

    generateInitialObstacles() {
        for (let i = 0; i < 10; i++) {
            this.spawnObstacle(500 + i * 350 + Math.random() * 250);
        }
    }

    generateInitialScenery() {
        for (let i = 0; i < 20; i++) {
            this.raceState.scenery.push({
                distanceOffset: Math.random() * 3000,
                side: Math.random() > 0.5 ? 'left' : 'right',
                type: Math.random() > 0.3 ? 'tree' : 'bush',
                size: 0.7 + Math.random() * 0.6
            });
        }
    }

    spawnObstacle(distanceAhead) {
        const rs = this.raceState;
        const cx = this.canvas.width / 2;
        const types = ['rock', 'puddle', 'haybale', 'log', 'cone'];
        const type = types[Math.floor(Math.random() * types.length)];

        let width, height;
        if (type === 'rock') { width = 24; height = 20; }
        else if (type === 'puddle') { width = 50; height = 25; }
        else if (type === 'haybale') { width = 40; height = 25; }
        else if (type === 'log') { width = 55; height = 14; }
        else { width = 16; height = 16; }

        rs.obstacles.push({
            x: cx + (Math.random() - 0.5) * (rs.trackWidth - 70),
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

        // Get current terrain for grip
        const terrain = this.getCurrentTerrain();
        const grip = terrain.grip;

        // --- Track curves ---
        rs.curveChangeTimer -= dt;
        if (rs.curveChangeTimer <= 0) {
            rs.targetCurve = (Math.random() - 0.5) * 3.0;
            rs.curveChangeTimer = 2 + Math.random() * 3;
        }
        rs.trackCurve += (rs.targetCurve - rs.trackCurve) * dt * 1.0;

        // --- Player acceleration (auto-accelerate — goes FAST!) ---
        const targetSpeed = player.topSpeed * grip;
        if (player.speed < targetSpeed) {
            player.speed += player.accel * dt;
            if (player.speed > targetSpeed) player.speed = targetSpeed;
        }

        // Braking
        if (this.keys['ArrowDown']) {
            player.speed -= player.accel * 2.2 * dt;
            if (player.speed < 25) player.speed = 25;
        }

        // Steering
        let steerInput = 0;
        if (this.keys['ArrowLeft']) steerInput = -1;
        if (this.keys['ArrowRight']) steerInput = 1;

        // Drift angle (visual effect)
        const targetDrift = steerInput * (player.speed / player.topSpeed) * 0.15;
        player.driftAngle += (targetDrift - player.driftAngle) * dt * 5;

        // Apply track curve effect — more slide on loose surfaces
        const curveForce = rs.trackCurve * (player.speed / player.topSpeed) * (120 / grip) * dt;
        player.x += curveForce;

        // Apply steering — rally cars handle fast
        player.x += steerInput * player.handling * (player.speed / 80) * 65 * dt;

        // Track boundaries
        const trackLeft = (cw - rs.trackWidth) / 2 + player.width / 2;
        const trackRight = (cw + rs.trackWidth) / 2 - player.width / 2;

        if (player.x < trackLeft) {
            player.x = trackLeft;
            player.speed *= 0.93;
        }
        if (player.x > trackRight) {
            player.x = trackRight;
            player.speed *= 0.93;
        }

        // Scroll
        rs.scrollSpeed = player.speed * 2.8;
        rs.scrollOffset += rs.scrollSpeed * dt;

        // Distance
        player.distance += player.speed * dt;

        // Stage tracking
        const currentStage = Math.floor(player.distance / rs.stageLength) + 1;
        if (currentStage > player.stage && player.stage < rs.numStages) {
            player.stage = currentStage;
            this.playLapSound();
        }

        // Check finish
        if (player.distance >= rs.trackLength) {
            this.finishRace();
            return;
        }

        // Spawn dust/dirt particles from tires
        if (player.speed > 40) {
            this.spawnDustParticles(player, terrain);
        }

        this.updateOpponents(dt);
        this.updateObstacles(dt);
        if (player.invincible <= 0) this.checkCollisions();
        this.updateParticles(dt);
        this.updateScenery();
        this.maybeSpawnObstacle();
        this.updateHUD();
    }

    spawnDustParticles(player, terrain) {
        const rs = this.raceState;
        for (let i = 0; i < 3; i++) {
            rs.dustParticles.push({
                x: player.x + (Math.random() - 0.5) * player.width * 0.8,
                y: player.y + player.height / 2 + 5 + Math.random() * 5,
                vx: (Math.random() - 0.5) * 40,
                vy: 20 + Math.random() * 40,
                color: terrain.dustColor,
                life: 0.4 + Math.random() * 0.4,
                size: 3 + Math.random() * 5
            });
        }
    }

    updateOpponents(dt) {
        const rs = this.raceState;
        const player = rs.player;

        rs.opponents.forEach(opp => {
            opp.speed += (opp.topSpeed - opp.speed) * dt * 0.5;
            opp.speed += (Math.random() - 0.5) * 25 * dt;
            if (opp.speed < 90) opp.speed = 90;
            if (opp.speed > opp.topSpeed + 10) opp.speed = opp.topSpeed + 10;

            opp.distance += opp.speed * dt;

            opp.laneChangeTimer -= dt;
            if (opp.laneChangeTimer <= 0) {
                opp.laneTarget = this.canvas.width / 2 + (Math.random() - 0.5) * (rs.trackWidth - 80);
                opp.laneChangeTimer = 2 + Math.random() * 4;
            }

            const dx = opp.laneTarget - opp.x;
            opp.x += dx * dt * 1.5;

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
        // Remove passed scenery and add new
        rs.scenery = rs.scenery.filter(s => s.distanceOffset > rs.player.distance - 300);
        rs.sceneryTimer++;
        if (rs.sceneryTimer % 15 === 0) {
            rs.scenery.push({
                distanceOffset: rs.player.distance + 2000 + Math.random() * 500,
                side: Math.random() > 0.5 ? 'left' : 'right',
                type: Math.random() > 0.25 ? 'tree' : 'bush',
                size: 0.7 + Math.random() * 0.6
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
        const colors = ['#ff4444', '#ff8800', '#ffff00', '#8B7355', '#333'];
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

        // Dust particles
        rs.dustParticles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.size *= 0.98;
        });
        rs.dustParticles = rs.dustParticles.filter(p => p.life > 0);
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

        let titleText = '🏆 RALLY COMPLETE!';
        if (position === 1) titleText = '🏆 YOU WIN! 1ST PLACE!';
        else if (position === 2) titleText = '🥈 2ND PLACE!';
        else if (position === 3) titleText = '🥉 3RD PLACE!';

        this.finishTitle.textContent = titleText;
        this.finishStats.innerHTML = `
            <div>⏱️ Total Time: ${timeStr}</div>
            <div>🏔️ Stages: ${rs.numStages}</div>
            <div>💥 Total Crashes: ${rs.totalCrashes}</div>
            <div>🔧 Repairs: ${rs.repairs}</div>
            <div>🏅 Position: ${position}/${rs.opponents.length + 1}</div>
            <div>🚀 Top Speed: ${Math.round(rs.player.topSpeed)} mph</div>
            <div>🏎️ Spoiler: BIG WING ✅</div>
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
        this.hudStage.textContent = `${Math.min(rs.player.stage, rs.numStages)}/${rs.numStages}`;
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

        const terrain = this.getCurrentTerrain();
        const terrainKey = this.getCurrentTerrainKey();

        // Sky gradient based on terrain
        let skyTop, skyBottom;
        if (terrainKey === 'snow') {
            skyTop = '#8eafc0'; skyBottom = '#c8d8e4';
        } else if (terrainKey === 'mud') {
            skyTop = '#5a6a4a'; skyBottom = '#8a9a6a';
        } else {
            skyTop = '#87ceeb'; skyBottom = '#e0f0e0';
        }

        // Draw sky (top third)
        const skyH = ch * 0.15;
        const grad = ctx.createLinearGradient(0, 0, 0, skyH);
        grad.addColorStop(0, skyTop);
        grad.addColorStop(1, skyBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, skyH);

        // Ground (sides of road)
        let groundColor;
        if (terrainKey === 'snow') groundColor = '#e8eee8';
        else if (terrainKey === 'mud') groundColor = '#3a5a2a';
        else if (terrainKey === 'tarmac') groundColor = '#2a6a2a';
        else groundColor = '#2d5a1e';

        ctx.fillStyle = groundColor;
        ctx.fillRect(0, skyH, cw, ch - skyH);

        // Grass/ground stripes
        const grassOffset = rs.scrollOffset % 50;
        ctx.fillStyle = terrainKey === 'snow' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
        for (let y = -50 + grassOffset % 50 + skyH; y < ch; y += 50) {
            ctx.fillRect(0, y, cw, 20);
        }

        // Draw track
        const trackLeft = (cw - rs.trackWidth) / 2;
        const trackRight = trackLeft + rs.trackWidth;

        // Road surface
        ctx.fillStyle = terrain.color;
        ctx.fillRect(trackLeft, skyH, rs.trackWidth, ch - skyH);

        // Road texture (gravel dots / snow flecks / etc.)
        if (terrainKey !== 'tarmac') {
            const texColor = terrainKey === 'snow' ? 'rgba(180,200,220,0.3)' : 'rgba(0,0,0,0.08)';
            ctx.fillStyle = texColor;
            const seed = Math.floor(rs.scrollOffset / 3) % 100;
            for (let i = 0; i < 40; i++) {
                const tx = trackLeft + ((seed * 7 + i * 37) % rs.trackWidth);
                const ty = skyH + ((seed * 13 + i * 53 + grassOffset) % (ch - skyH));
                ctx.beginPath();
                ctx.arc(tx, ty, 1 + (i % 3), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Track edges
        const rumbleOffset = Math.floor(rs.scrollOffset / 20) % 2;
        for (let y = skyH; y < ch; y += 20) {
            if (terrainKey === 'snow') {
                ctx.fillStyle = ((y / 20 + rumbleOffset) % 2 === 0) ? '#cc3333' : '#ffffff';
            } else {
                ctx.fillStyle = ((y / 20 + rumbleOffset) % 2 === 0) ? '#ff6600' : '#ffffff';
            }
            ctx.fillRect(trackLeft - 6, y, 6, 20);
            ctx.fillRect(trackRight, y, 6, 20);
        }

        // Lane markings (rally style — less formal, just edge hints)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        const markingOffset = rs.scrollOffset % 80;
        for (let y = -80 + markingOffset + skyH; y < ch; y += 80) {
            ctx.fillRect(trackLeft + rs.trackWidth * 0.5 - 1, y, 2, 30);
        }

        // Draw scenery (trees / bushes)
        rs.scenery.forEach(s => {
            const screenY = rs.player.y - (s.distanceOffset - rs.player.distance) * 2.5;
            if (screenY < -50 || screenY > ch + 50) return;
            const sx = s.side === 'left' ? trackLeft - 40 - Math.random() * 30 : trackRight + 20 + Math.random() * 30;
            this.drawScenery(ctx, sx, screenY, s.type, s.size, terrainKey);
        });

        // Draw stage markers
        for (let st = 1; st <= rs.numStages; st++) {
            const markDist = st * rs.stageLength;
            const screenY = rs.player.y - (markDist - rs.player.distance) * 2.5;
            if (screenY > -20 && screenY < ch + 20) {
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
                ctx.fillText(st === rs.numStages ? '🏁 FINISH' : `STAGE ${st + 1}`, cw / 2, screenY + 4);
            }
        }

        // Draw obstacles
        rs.obstacles.forEach(obs => {
            if (obs.screenY === undefined || obs.screenY < -50 || obs.screenY > ch + 50) return;
            this.drawObstacle(ctx, obs);
        });

        // Draw opponents (all with big spoiler)
        rs.opponents.forEach(opp => {
            if (opp.screenY === undefined || opp.screenY < -100 || opp.screenY > ch + 100) return;
            this.drawRallyCar(ctx, opp.x, opp.screenY, opp.color, opp.rallyClass, true, 1.0);
        });

        // Draw dust particles (behind cars)
        rs.dustParticles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life * 0.8);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw player car
        const blinkOff = rs.player.invincible > 0 && Math.floor(rs.player.invincible * 10) % 2 === 0;
        if (!blinkOff) {
            // Apply slight rotation for drift effect
            ctx.save();
            ctx.translate(rs.player.x, rs.player.y);
            ctx.rotate(rs.player.driftAngle);
            ctx.translate(-rs.player.x, -rs.player.y);

            this.drawRallyCar(ctx, rs.player.x, rs.player.y, rs.player.color,
                rs.player.rallyClass, true, 1.0);

            ctx.restore();

            // Speed lines when going fast
            if (rs.player.speed > 120) {
                ctx.strokeStyle = `rgba(255,255,255,${(rs.player.speed - 120) / 200})`;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 6; i++) {
                    const sx = rs.player.x + (Math.random() - 0.5) * rs.player.width;
                    const sy = rs.player.y + rs.player.height / 2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (Math.random() - 0.5) * 4, sy + 20 + Math.random() * 30);
                    ctx.stroke();
                }
            }
        }

        // Draw crash particles
        rs.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Terrain indicator
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, ch - 32, 110, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`🏔️ ${terrain.name}`, 18, ch - 16);

        // Minimap
        this.drawMinimap(ctx, cw, ch);
    }

    drawScenery(ctx, x, y, type, size, terrainKey) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size, size);

        if (type === 'tree') {
            // Tree trunk
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(-4, -10, 8, 25);

            // Tree crown
            if (terrainKey === 'snow') {
                ctx.fillStyle = '#1a6030';
                // Snow-capped pine
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(18, -10);
                ctx.lineTo(-18, -10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(10, -22);
                ctx.lineTo(-10, -22);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = '#2a8a2a';
                ctx.beginPath();
                ctx.arc(0, -18, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.arc(3, -15, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Bush
            ctx.fillStyle = terrainKey === 'snow' ? '#3a7a3a' : '#1a7a1a';
            ctx.beginPath();
            ctx.arc(0, -5, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,60,0,0.3)';
            ctx.beginPath();
            ctx.arc(4, -3, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawObstacle(ctx, obs) {
        ctx.save();
        ctx.translate(obs.x, obs.screenY);

        switch (obs.type) {
            case 'rock':
                ctx.fillStyle = '#777';
                ctx.beginPath();
                ctx.moveTo(-obs.width / 2, obs.height / 3);
                ctx.lineTo(-obs.width / 3, -obs.height / 2);
                ctx.lineTo(obs.width / 4, -obs.height / 2);
                ctx.lineTo(obs.width / 2, obs.height / 4);
                ctx.lineTo(obs.width / 3, obs.height / 2);
                ctx.lineTo(-obs.width / 3, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.moveTo(-obs.width / 3, -obs.height / 2);
                ctx.lineTo(0, -obs.height / 3);
                ctx.lineTo(-obs.width / 4, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case 'puddle':
                ctx.fillStyle = 'rgba(40, 60, 100, 0.6)';
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
                ctx.beginPath();
                ctx.ellipse(-5, -3, 12, 6, 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'haybale':
                ctx.fillStyle = '#c4a84a';
                ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
                // Horizontal lines for straw texture
                ctx.strokeStyle = '#a08830';
                ctx.lineWidth = 1;
                for (let ly = -obs.height / 2 + 4; ly < obs.height / 2; ly += 5) {
                    ctx.beginPath();
                    ctx.moveTo(-obs.width / 2, ly);
                    ctx.lineTo(obs.width / 2, ly);
                    ctx.stroke();
                }
                // Side circles (bale ends)
                ctx.fillStyle = '#b89838';
                ctx.beginPath();
                ctx.arc(-obs.width / 2, 0, obs.height / 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'log':
                ctx.fillStyle = '#6B4423';
                ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
                // Wood grain
                ctx.strokeStyle = '#5a3818';
                ctx.lineWidth = 1;
                for (let lx = -obs.width / 2 + 8; lx < obs.width / 2; lx += 10) {
                    ctx.beginPath();
                    ctx.moveTo(lx, -obs.height / 2);
                    ctx.lineTo(lx, obs.height / 2);
                    ctx.stroke();
                }
                // End circle
                ctx.fillStyle = '#8B6340';
                ctx.beginPath();
                ctx.ellipse(obs.width / 2, 0, obs.height / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#6B4423';
                ctx.beginPath();
                ctx.arc(obs.width / 2, 0, obs.height / 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'cone':
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.moveTo(0, -obs.height / 2);
                ctx.lineTo(obs.width / 2, obs.height / 2);
                ctx.lineTo(-obs.width / 2, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-4, -2, 8, 3);
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
        ctx.fillStyle = '#444';
        ctx.fillRect(mmX, mmY, mmW, mmH);

        // Stage divisions
        for (let i = 1; i <= rs.numStages; i++) {
            const ly = mmY + mmH - (i / rs.numStages) * mmH;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(mmX, ly, mmW, 1);
        }

        // Color stages by terrain
        for (let i = 0; i < rs.numStages; i++) {
            const stage = rs.stages[i];
            const terrain = this.terrainTypes[stage.terrain];
            const y1 = mmY + mmH - ((i + 1) / rs.numStages) * mmH;
            const segH = mmH / rs.numStages;
            ctx.fillStyle = terrain.color;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(mmX, y1, mmW, segH);
            ctx.globalAlpha = 1;
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
    new RallyRaceGame();
});
