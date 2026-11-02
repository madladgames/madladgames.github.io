// ============================================================
// 3D CIRCUIT RACING GAME - Three.js
// ============================================================

(function () {
    'use strict';

    // ===== CAR DATA =====
    const CAR_DATA = [
        {
            name: 'Pickup Truck',
            desc: 'A tough and rugged pickup truck with a big open bed and serious attitude.',
            color: 0xe11d48,
            accent: 0x1a1a1a,
            stats: { speed: 68, handling: 60, accel: 65, brake: 62 },
            maxSpeed: 110,
            accel: 48,
            turnRate: 1.9,
            brakeForce: 58,
            builder: buildPickupTruck
        },
        {
            name: 'Muscle Car',
            desc: 'Raw American muscle with massive horsepower. Grip it and rip it!',
            color: 0x2563eb,
            accent: 0xffffff,
            stats: { speed: 90, handling: 65, accel: 85, brake: 60 },
            maxSpeed: 145,
            accel: 65,
            turnRate: 1.8,
            brakeForce: 55,
            builder: buildMuscleCar
        },
        {
            name: 'Formula Racer',
            desc: 'Open-wheel single-seater built purely for circuit speed.',
            color: 0xeab308,
            accent: 0x111111,
            stats: { speed: 95, handling: 92, accel: 90, brake: 88 },
            maxSpeed: 160,
            accel: 75,
            turnRate: 2.6,
            brakeForce: 85,
            builder: buildF1Car
        },
        {
            name: 'Supercar',
            desc: 'An angular supercar with scissor-door attitude and brutal acceleration.',
            color: 0x16a34a,
            accent: 0x111111,
            stats: { speed: 88, handling: 82, accel: 92, brake: 80 },
            maxSpeed: 150,
            accel: 70,
            turnRate: 2.3,
            brakeForce: 78,
            builder: buildSupercar
        },
        {
            name: 'Rally Car',
            desc: 'A high-riding rally machine with a roof light bar and aggressive stance.',
            color: 0xf8fafc,
            accent: 0xea580c,
            stats: { speed: 72, handling: 78, accel: 70, brake: 72 },
            maxSpeed: 115,
            accel: 50,
            turnRate: 2.5,
            brakeForce: 65,
            builder: buildRallyCar
        }
    ];

    // ===== TRACK CONTROL POINTS =====
    const TRACK_POINTS = [
        [0, 0, 60],
        [0, 0, -30],
        [10, 0, -80],
        [50, 0, -120],
        [110, 0, -135],
        [170, 0, -115],
        [210, 0, -75],
        [220, 0, -25],
        [205, 0, 25],
        [170, 0, 55],
        [130, 0, 70],
        [100, 0, 95],
        [70, 0, 120],
        [30, 0, 110],
        [5, 0, 90]
    ];

    const ROAD_WIDTH = 16;
    const ROAD_HALF = ROAD_WIDTH / 2;
    const TRACK_SAMPLES = 800;
    const TOTAL_LAPS = 3;

    // ===== GLOBALS =====
    let scene, camera, renderer;
    let previewScene, previewCamera, previewRenderer;
    let playerCar = null;
    let selectedCarIndex = 0;
    let previewCarModel = null;
    let previewAngle = 0;

    let speed = 0;
    let heading = 0;
    let carPosition = new THREE.Vector3(0, 0, 0);

    let keys = {};
    let gameState = 'menu'; // menu, countdown, racing, finished
    let raceTime = 0;
    let lapTimes = [];
    let bestLap = Infinity;
    let currentLap = 1;
    let lastTrackT = 0;
    let lapCrossings = 0;

    let trackCurve = null;
    let trackSamplePoints = [];
    let trackSampleTangents = [];

    let clock = new THREE.Clock();

    // ===== MATERIALS (shared) =====
    function makeBodyMat(color) {
        return new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.25,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08
        });
    }

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.35,
        metalness: 0.1,
        roughness: 0.0,
        side: THREE.DoubleSide
    });

    const darkGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0x222244,
        transparent: true,
        opacity: 0.5,
        metalness: 0.2,
        roughness: 0.0,
        side: THREE.DoubleSide
    });

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.0 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.15 });
    const darkRimMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.05 });
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 0.8 });
    const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 });
    const brakeLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff2200, emissiveIntensity: 1.0 });
    const turnSignalMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.6 });
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.3 });
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });

    // ===== WHEEL BUILDER =====
    function createWheel(radius, width, spokeCount, rimColor) {
        const wheel = new THREE.Group();
        const rMat = rimColor ? new THREE.MeshStandardMaterial({ color: rimColor, metalness: 0.95, roughness: 0.15 }) : rimMat;

        // Tire (torus)
        const tireThick = radius * 0.35;
        const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, tireThick, 16, 32), tireMat);
        tire.rotation.y = Math.PI / 2;
        wheel.add(tire);

        // Tire sidewall detail
        const sidewall = new THREE.Mesh(
            new THREE.CylinderGeometry(radius + tireThick * 0.3, radius + tireThick * 0.3, width * 0.9, 32, 1, true),
            tireMat
        );
        sidewall.rotation.z = Math.PI / 2;
        wheel.add(sidewall);

        // Rim disc
        const rimDisc = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, width * 0.6, 32), rMat);
        rimDisc.rotation.z = Math.PI / 2;
        wheel.add(rimDisc);

        // Spokes
        for (let i = 0; i < spokeCount; i++) {
            const angle = (i / spokeCount) * Math.PI * 2;
            const spoke = new THREE.Mesh(
                new THREE.BoxGeometry(radius * 0.12, radius * 1.5, width * 0.35),
                rMat
            );
            spoke.rotation.z = Math.PI / 2;
            spoke.rotation.x = angle;
            spoke.position.set(0, 0, 0);
            wheel.add(spoke);
        }

        // Hub cap
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.18, width * 0.7, 16), chromeMat);
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);

        // Hub bolt details
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, width * 0.72, 8), chromeMat);
            bolt.rotation.z = Math.PI / 2;
            bolt.position.set(width * 0.36, Math.cos(angle) * radius * 0.12, Math.sin(angle) * radius * 0.12);
            wheel.add(bolt);
        }

        // Brake disc
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, 0.04, 32),
            new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 })
        );
        disc.rotation.z = Math.PI / 2;
        wheel.add(disc);

        // Brake caliper
        const caliper = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 0.2, radius * 0.35, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.5 })
        );
        caliper.position.set(-width * 0.2, radius * 0.45, 0);
        wheel.add(caliper);

        return wheel;
    }

    function addWheels(car, params) {
        const { wheelRadius, wheelWidth, spokeCount, rimColor, frontX, rearX, trackWidth, yPos } = params;
        const positions = [
            { x: trackWidth / 2, y: yPos, z: frontX, name: 'wheelFL' },
            { x: -trackWidth / 2, y: yPos, z: frontX, name: 'wheelFR' },
            { x: trackWidth / 2, y: yPos, z: rearX, name: 'wheelRL' },
            { x: -trackWidth / 2, y: yPos, z: rearX, name: 'wheelRR' }
        ];
        positions.forEach(p => {
            const w = createWheel(wheelRadius, wheelWidth, spokeCount, rimColor);
            w.position.set(p.x, p.y, p.z);
            if (p.x < 0) w.rotation.y = Math.PI;
            w.name = p.name;
            car.add(w);
        });
    }

    // ===== PICKUP TRUCK =====
    function buildPickupTruck(color, accent) {
        const car = new THREE.Group();
        const bodyMat = makeBodyMat(color);
        const accentMat = makeBodyMat(accent);
        const bedMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8, metalness: 0.2 });

        // Frame / chassis (sits higher)
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 5.2), accentMat);
        frame.position.set(0, 0.3, 0);
        car.add(frame);

        // Main body - cab section
        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 2.4), bodyMat);
        cabBody.position.set(0, 0.6, -0.8);
        car.add(cabBody);

        // Side panels cab
        [-1, 1].forEach(side => {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 2.3), bodyMat);
            panel.position.set(side * 1.02, 0.62, -0.8);
            car.add(panel);
        });

        // Hood (long, flat, high)
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 1.6), bodyMat);
        hood.position.set(0, 0.82, -1.8);
        hood.rotation.x = 0.03;
        car.add(hood);

        // Hood emblem ridge
        const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.2), bodyMat);
        hoodRidge.position.set(0, 0.88, -1.7);
        car.add(hoodRidge);

        // Cabin (tall, upright)
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.5), bodyMat);
        cabin.position.set(0, 1.1, -0.15);
        car.add(cabin);

        // Roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.4), bodyMat);
        roof.position.set(0, 1.43, -0.15);
        car.add(roof);

        // Windshield (upright, truck style)
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 0.06), glassMat);
        windshield.position.set(0, 1.12, -0.88);
        windshield.rotation.x = 0.2;
        car.add(windshield);

        // Rear window
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.06), darkGlassMat);
        rearWin.position.set(0, 1.12, 0.58);
        rearWin.rotation.x = -0.1;
        car.add(rearWin);

        // Side windows
        [-1, 1].forEach(side => {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 1.1), glassMat);
            sw.position.set(side * 0.88, 1.1, -0.15);
            car.add(sw);
        });

        // === TRUCK BED ===
        // Bed floor
        const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 2.2), bedMat);
        bedFloor.position.set(0, 0.52, 1.65);
        car.add(bedFloor);

        // Bed walls
        // Left wall
        const bedLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 2.2), bodyMat);
        bedLeft.position.set(0.95, 0.75, 1.65);
        car.add(bedLeft);
        // Right wall
        const bedRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 2.2), bodyMat);
        bedRight.position.set(-0.95, 0.75, 1.65);
        car.add(bedRight);
        // Rear wall (tailgate)
        const tailgate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.1), bodyMat);
        tailgate.position.set(0, 0.75, 2.75);
        car.add(tailgate);
        // Cab-to-bed wall
        const cabBedWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.1), bodyMat);
        cabBedWall.position.set(0, 0.75, 0.58);
        car.add(cabBedWall);

        // Bed rail caps (chrome)
        [-1, 1].forEach(side => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 2.2), chromeMat);
            rail.position.set(side * 0.95, 0.97, 1.65);
            car.add(rail);
        });
        // Rear rail
        const rearRail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.1), chromeMat);
        rearRail.position.set(0, 0.97, 2.75);
        car.add(rearRail);

        // Tailgate handle
        const tgHandle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), chromeMat);
        tgHandle.position.set(0, 0.8, 2.82);
        car.add(tgHandle);

        // Bed liner ridges
        for (let i = 0; i < 5; i++) {
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.06), bedMat);
            ridge.position.set(0, 0.57, 0.9 + i * 0.4);
            car.add(ridge);
        }

        // Front bumper (big, chrome)
        const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.2), chromeMat);
        frontBumper.position.set(0, 0.38, -2.6);
        car.add(frontBumper);

        // Front grille (big, bold)
        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.08), chromeMat);
        grille.position.set(0, 0.62, -2.58);
        car.add(grille);
        // Grille inner (dark)
        const grilleInner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.04), grilleMat);
        grilleInner.position.set(0, 0.62, -2.58);
        car.add(grilleInner);
        // Grille bars
        for (let i = 0; i < 5; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.06), chromeMat);
            bar.position.set(0, 0.5 + i * 0.06, -2.58);
            car.add(bar);
        }

        // Headlights (big, rectangular)
        [-0.8, 0.8].forEach(x => {
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), accentMat);
            hlHousing.position.set(x, 0.65, -2.58);
            car.add(hlHousing);
            const hlLens = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.06), headlightMat);
            hlLens.position.set(x, 0.65, -2.62);
            car.add(hlLens);
        });

        // Turn signals
        [-0.8, 0.8].forEach(x => {
            const ts = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.06), turnSignalMat);
            ts.position.set(x, 0.5, -2.62);
            car.add(ts);
        });

        // Fog lights
        [-0.5, 0.5].forEach(x => {
            const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), headlightMat);
            fog.rotation.x = Math.PI / 2;
            fog.position.set(x, 0.35, -2.62);
            car.add(fog);
        });

        // Rear bumper (big, chrome)
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.15), chromeMat);
        rearBumper.position.set(0, 0.35, 2.82);
        car.add(rearBumper);

        // Rear step (on bumper)
        const rearStep = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
        rearStep.position.set(0, 0.28, 2.85);
        car.add(rearStep);

        // Taillights
        [-0.8, 0.8].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.06), taillightMat);
            tl.position.set(x, 0.7, 2.78);
            car.add(tl);
        });

        // Side mirrors (big, truck style)
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.04), accentMat);
            arm.position.set(side * 1.2, 1.1, -0.6);
            car.add(arm);
            const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.12), accentMat);
            mirrorHead.position.set(side * 1.38, 1.1, -0.6);
            car.add(mirrorHead);
            const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.1), glassMat);
            mirrorGlass.position.set(side * 1.41, 1.1, -0.6);
            car.add(mirrorGlass);
        });

        // Side steps / running boards
        [-1, 1].forEach(side => {
            const step = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 2.0), accentMat);
            step.position.set(side * 1.05, 0.28, -0.3);
            car.add(step);
            // Step brackets
            [-0.6, 0.2, 1.0].forEach(z => {
                const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.06), accentMat);
                bracket.position.set(side * 1.05, 0.22, z - 0.3);
                car.add(bracket);
            });
        });

        // Door handles
        [-1, 1].forEach(side => {
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.14), chromeMat);
            handle.position.set(side * 1.04, 0.9, -0.3);
            car.add(handle);
        });

        // Exhaust (single, big)
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.2, 16), chromeMat);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.6, 0.28, 2.9);
        car.add(exhaust);

        // Tow hitch
        const hitch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 }));
        hitch.position.set(0, 0.2, 2.95);
        car.add(hitch);
        const hitchBall = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), chromeMat);
        hitchBall.position.set(0, 0.28, 3.0);
        car.add(hitchBall);

        // Fender flares
        [-1, 1].forEach(side => {
            [-1.6, 1.6].forEach(z => {
                const flare = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.9), bodyMat);
                flare.position.set(side * 1.05, 0.6, z);
                car.add(flare);
            });
        });

        // Antenna
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.8, 6), accentMat);
        antenna.position.set(0.7, 1.8, -0.1);
        car.add(antenna);

        // Wheels (big, truck style)
        addWheels(car, {
            wheelRadius: 0.4, wheelWidth: 0.26, spokeCount: 6, rimColor: 0xaaaaaa,
            frontX: -1.6, rearX: 1.8, trackWidth: 1.85, yPos: 0.4
        });

        return car;
    }

    // ===== MUSCLE CAR =====
    function buildMuscleCar(color, accent) {
        const car = new THREE.Group();
        const bodyMat = makeBodyMat(color);
        const stripeMat = makeBodyMat(accent);

        // Main body - boxy, long
        const bodyMain = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 4.8), bodyMat);
        bodyMain.position.set(0, 0.35, 0);
        car.add(bodyMain);

        // Body side panels
        [-1, 1].forEach(side => {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 4.6), bodyMat);
            panel.position.set(side * 1.03, 0.4, 0);
            car.add(panel);
        });

        // Long hood
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 2.2), bodyMat);
        hood.position.set(0, 0.58, -0.9);
        hood.rotation.x = 0.04;
        car.add(hood);

        // Hood scoop (big)
        const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.8), accent !== 0xffffff ? carbonMat : bodyMat);
        hoodScoop.position.set(0, 0.66, -0.6);
        car.add(hoodScoop);
        const scoopOpening = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.2), grilleMat);
        scoopOpening.position.set(0, 0.74, -0.3);
        car.add(scoopOpening);

        // Racing stripes
        [-0.3, 0.3].forEach(x => {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 4.6), stripeMat);
            stripe.position.set(x, 0.6, 0);
            car.add(stripe);
        });

        // Cabin (fastback)
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.5), bodyMat);
        cabin.position.set(0, 0.72, 0.7);
        car.add(cabin);

        // Roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.2), bodyMat);
        roof.position.set(0, 1.0, 0.6);
        car.add(roof);

        // Windshield
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.06), glassMat);
        windshield.position.set(0, 0.78, -0.02);
        windshield.rotation.x = 0.3;
        car.add(windshield);

        // Rear window (fastback angle)
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.06), darkGlassMat);
        rearWin.position.set(0, 0.78, 1.42);
        rearWin.rotation.x = -0.55;
        car.add(rearWin);

        // Side windows
        [-1, 1].forEach(side => {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.33, 1.2), glassMat);
            sw.position.set(side * 0.78, 0.78, 0.65);
            car.add(sw);
        });

        // Short trunk
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 0.6), bodyMat);
        trunk.position.set(0, 0.52, 2.0);
        car.add(trunk);

        // Rear lip spoiler
        const lipSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.08), carbonMat);
        lipSpoiler.position.set(0, 0.64, 2.3);
        car.add(lipSpoiler);

        // Front bumper - aggressive
        const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.25, 0.2), bodyMat);
        frontBumper.position.set(0, 0.22, -2.35);
        car.add(frontBumper);

        // Front grille (big)
        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.06), grilleMat);
        grille.position.set(0, 0.3, -2.38);
        car.add(grille);
        // Grille bars
        for (let i = 0; i < 6; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.015, 0.04), chromeMat);
            bar.position.set(0, 0.22 + i * 0.035, -2.38);
            car.add(bar);
        }

        // Headlights (round, muscle car style)
        [-0.7, 0.7].forEach(x => {
            const hlOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 20), chromeMat);
            hlOuter.rotation.x = Math.PI / 2;
            hlOuter.position.set(x, 0.38, -2.38);
            car.add(hlOuter);
            const hlInner = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 20), headlightMat);
            hlInner.rotation.x = Math.PI / 2;
            hlInner.position.set(x, 0.38, -2.4);
            car.add(hlInner);
        });

        // Rear bumper
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.12), bodyMat);
        rearBumper.position.set(0, 0.22, 2.35);
        car.add(rearBumper);

        // Taillights (wide bar style)
        [-0.6, 0.6].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.06), taillightMat);
            tl.position.set(x, 0.42, 2.38);
            car.add(tl);
        });

        // Side mirrors
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), chromeMat);
            arm.position.set(side * 1.15, 0.72, 0.2);
            car.add(arm);
            const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.13), chromeMat);
            mirror.position.set(side * 1.26, 0.72, 0.2);
            car.add(mirror);
        });

        // Dual exhaust (big)
        [-0.4, 0.4].forEach(x => {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.2, 16), chromeMat);
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(x, 0.2, 2.45);
            car.add(pipe);
        });

        // Door handles
        [-1, 1].forEach(side => {
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.12), chromeMat);
            handle.position.set(side * 1.04, 0.55, 0.4);
            car.add(handle);
        });

        // Wheels (bigger, fatter for muscle car)
        addWheels(car, {
            wheelRadius: 0.36, wheelWidth: 0.26, spokeCount: 6, rimColor: 0xaaaaaa,
            frontX: -1.5, rearX: 1.6, trackWidth: 1.8, yPos: 0.36
        });

        return car;
    }

    // ===== FORMULA RACER =====
    function buildF1Car(color, accent) {
        const car = new THREE.Group();
        const bodyMat = makeBodyMat(color);
        const accentMat = makeBodyMat(accent);

        // Nose cone
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 1.2), bodyMat);
        nose.position.set(0, 0.28, -1.8);
        car.add(nose);

        // Nose tip
        const noseTip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.4), bodyMat);
        noseTip.position.set(0, 0.25, -2.45);
        car.add(noseTip);

        // Front wing main plane
        const frontWingMain = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.35), carbonMat);
        frontWingMain.position.set(0, 0.14, -2.6);
        car.add(frontWingMain);

        // Front wing flap
        const frontWingFlap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.18), carbonMat);
        frontWingFlap.position.set(0, 0.2, -2.7);
        frontWingFlap.rotation.x = -0.2;
        car.add(frontWingFlap);

        // Front wing endplates
        [-1, 1].forEach(side => {
            const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.45), bodyMat);
            endplate.position.set(side * 0.95, 0.18, -2.6);
            car.add(endplate);
        });

        // Main monocoque body
        const monocoque = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 2.8), bodyMat);
        monocoque.position.set(0, 0.35, -0.2);
        car.add(monocoque);

        // Side pods
        [-1, 1].forEach(side => {
            const sidepod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 1.8), bodyMat);
            sidepod.position.set(side * 0.65, 0.32, 0.2);
            car.add(sidepod);

            // Side pod intake
            const intake = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.06), grilleMat);
            intake.position.set(side * 0.65, 0.38, -0.65);
            car.add(intake);

            // Side pod exit
            const exit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), grilleMat);
            exit.position.set(side * 0.65, 0.25, 1.1);
            car.add(exit);
        });

        // Cockpit opening
        const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.7), interiorMat);
        cockpit.position.set(0, 0.5, -0.4);
        car.add(cockpit);

        // Halo device
        const haloFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
        haloFront.position.set(0, 0.62, -0.75);
        car.add(haloFront);
        const haloTop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.6), carbonMat);
        haloTop.position.set(0, 0.72, -0.5);
        car.add(haloTop);
        [-1, 1].forEach(side => {
            const haloSide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), carbonMat);
            haloSide.position.set(side * 0.25, 0.58, -0.2);
            car.add(haloSide);
        });

        // Driver helmet
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
        helmet.position.set(0, 0.6, -0.35);
        helmet.scale.set(1, 0.8, 1.1);
        car.add(helmet);

        // Engine cover / airbox
        const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.3), bodyMat);
        airbox.position.set(0, 0.6, -0.05);
        car.add(airbox);
        const airboxIntake = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.06), grilleMat);
        airboxIntake.position.set(0, 0.62, -0.2);
        car.add(airboxIntake);

        // Engine cover (tapers back)
        const engineCover = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.5), bodyMat);
        engineCover.position.set(0, 0.35, 1.2);
        car.add(engineCover);

        // Rear crash structure
        const rearCrash = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.3), accentMat);
        rearCrash.position.set(0, 0.3, 2.0);
        car.add(rearCrash);

        // Rear wing main plane
        const rearWingMain = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), carbonMat);
        rearWingMain.position.set(0, 0.82, 1.7);
        car.add(rearWingMain);

        // Rear wing flap
        const rearWingFlap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.2), bodyMat);
        rearWingFlap.position.set(0, 0.88, 1.6);
        rearWingFlap.rotation.x = -0.15;
        car.add(rearWingFlap);

        // Rear wing endplates
        [-1, 1].forEach(side => {
            const ep = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.5), bodyMat);
            ep.position.set(side * 0.55, 0.75, 1.7);
            car.add(ep);
        });

        // Rear wing supports
        [-1, 1].forEach(side => {
            const support = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), carbonMat);
            support.position.set(side * 0.2, 0.55, 1.85);
            car.add(support);
        });

        // Floor / diffuser
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 4.2), carbonMat);
        floor.position.set(0, 0.13, -0.2);
        car.add(floor);

        // Rear diffuser vanes
        for (let i = -2; i <= 2; i++) {
            const vane = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.4), carbonMat);
            vane.position.set(i * 0.15, 0.18, 1.85);
            vane.rotation.x = 0.2;
            car.add(vane);
        }

        // Rear light
        const rearLight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.04), taillightMat);
        rearLight.position.set(0, 0.35, 2.05);
        car.add(rearLight);

        // Wheels (F1 style - wider rear)
        const fl = createWheel(0.33, 0.18, 5, 0x333333);
        fl.position.set(0.8, 0.33, -1.5);
        car.add(fl);
        const fr = createWheel(0.33, 0.18, 5, 0x333333);
        fr.position.set(-0.8, 0.33, -1.5);
        fr.rotation.y = Math.PI;
        car.add(fr);
        const rl = createWheel(0.35, 0.28, 5, 0x333333);
        rl.position.set(0.75, 0.35, 1.4);
        car.add(rl);
        const rr = createWheel(0.35, 0.28, 5, 0x333333);
        rr.position.set(-0.75, 0.35, 1.4);
        rr.rotation.y = Math.PI;
        car.add(rr);

        // Suspension arms (visible on F1)
        [-1, 1].forEach(side => {
            [-1.5, 1.4].forEach((z, idx) => {
                const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), carbonMat);
                upper.rotation.z = side * 0.3;
                upper.position.set(side * 0.55, 0.4, z);
                car.add(upper);
                const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), carbonMat);
                lower.rotation.z = side * 0.2;
                lower.position.set(side * 0.55, 0.28, z + 0.15);
                car.add(lower);
            });
        });

        return car;
    }

    // ===== SUPERCAR =====
    function buildSupercar(color, accent) {
        const car = new THREE.Group();
        const bodyMat = makeBodyMat(color);
        const accentMat = makeBodyMat(accent);

        // Main body - very low
        const bodyMain = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.3, 4.5), bodyMat);
        bodyMain.position.set(0, 0.3, 0);
        car.add(bodyMain);

        // Angular side panels
        [-1, 1].forEach(side => {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 4.3), bodyMat);
            panel.position.set(side * 1.05, 0.35, 0);
            car.add(panel);
        });

        // Sharp hood with angular crease
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 1.8), bodyMat);
        hood.position.set(0, 0.5, -1.1);
        hood.rotation.x = 0.06;
        car.add(hood);

        // Hood vents (angular)
        [-0.45, 0.45].forEach(x => {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.6), grilleMat);
            vent.position.set(x, 0.53, -0.7);
            car.add(vent);
        });

        // Very low cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.3), bodyMat);
        cabin.position.set(0, 0.65, 0.2);
        car.add(cabin);

        // Angular roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.0), bodyMat);
        roof.position.set(0, 0.88, 0.15);
        car.add(roof);

        // Windshield (very raked)
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.06), glassMat);
        windshield.position.set(0, 0.68, -0.42);
        windshield.rotation.x = 0.5;
        car.add(windshield);

        // Rear window (small, angular)
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.06), darkGlassMat);
        rearWin.position.set(0, 0.72, 0.82);
        rearWin.rotation.x = -0.6;
        car.add(rearWin);

        // Side windows
        [-1, 1].forEach(side => {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.9), glassMat);
            sw.position.set(side * 0.76, 0.72, 0.2);
            car.add(sw);
        });

        // Scissor door lines
        [-1, 1].forEach(side => {
            const doorLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 1.3), new THREE.MeshStandardMaterial({ color: 0x000000 }));
            doorLine.position.set(side * 1.06, 0.5, 0.1);
            car.add(doorLine);
            // Diagonal upper line
            const diagLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.01), new THREE.MeshStandardMaterial({ color: 0x000000 }));
            diagLine.position.set(side * 1.06, 0.6, -0.3);
            diagLine.rotation.z = side * 0.3;
            car.add(diagLine);
        });

        // Engine cover (rear)
        const engineCover = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.2), bodyMat);
        engineCover.position.set(0, 0.48, 1.5);
        car.add(engineCover);

        // Engine cover glass (visible engine)
        const engineGlass = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.6), darkGlassMat);
        engineGlass.position.set(0, 0.55, 1.4);
        car.add(engineGlass);

        // Large rear air intakes
        [-1, 1].forEach(side => {
            const intake = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.06), grilleMat);
            intake.position.set(side * 0.7, 0.4, 0.85);
            car.add(intake);
        });

        // Active rear wing
        const rearWingSupport1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
        rearWingSupport1.position.set(-0.4, 0.65, 2.0);
        car.add(rearWingSupport1);
        const rearWingSupport2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
        rearWingSupport2.position.set(0.4, 0.65, 2.0);
        car.add(rearWingSupport2);
        const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.25), carbonMat);
        rearWing.position.set(0, 0.8, 2.0);
        car.add(rearWing);

        // Front bumper - angular
        const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 0.15), accentMat);
        frontBumper.position.set(0, 0.2, -2.25);
        car.add(frontBumper);

        // Front splitter
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.03, 0.25), carbonMat);
        splitter.position.set(0, 0.11, -2.3);
        car.add(splitter);

        // Angular headlights (sharp)
        [-0.65, 0.65].forEach(x => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.06), headlightMat);
            hl.position.set(x, 0.38, -2.25);
            car.add(hl);
            // DRL strip
            const drl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 }));
            drl.position.set(x, 0.42, -2.25);
            car.add(drl);
        });

        // Rear bumper
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.12), accentMat);
        rearBumper.position.set(0, 0.2, 2.2);
        car.add(rearBumper);

        // Taillights (thin strip)
        const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.04), taillightMat);
        tailStrip.position.set(0, 0.42, 2.22);
        car.add(tailStrip);

        // Hexagonal exhaust
        [-0.3, 0, 0.3].forEach(x => {
            const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 6), exhaustMat);
            ex.rotation.x = Math.PI / 2;
            ex.position.set(x, 0.2, 2.28);
            car.add(ex);
        });

        // Side mirrors
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), bodyMat);
            arm.position.set(side * 1.18, 0.6, -0.15);
            car.add(arm);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), bodyMat);
            head.position.set(side * 1.32, 0.6, -0.15);
            car.add(head);
        });

        // Side skirts
        [-1, 1].forEach(side => {
            const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 3.8), carbonMat);
            skirt.position.set(side * 1.08, 0.15, 0);
            car.add(skirt);
        });

        // Diffuser
        const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.3), carbonMat);
        diffuser.position.set(0, 0.12, 2.2);
        car.add(diffuser);

        // Wheels
        addWheels(car, {
            wheelRadius: 0.34, wheelWidth: 0.24, spokeCount: 7, rimColor: 0x222222,
            frontX: -1.5, rearX: 1.5, trackWidth: 1.85, yPos: 0.34
        });

        return car;
    }

    // ===== RALLY CAR =====
    function buildRallyCar(color, accent) {
        const car = new THREE.Group();
        const bodyMat = makeBodyMat(color);
        const accentMat = makeBodyMat(accent);

        // Main body - higher ride
        const bodyMain = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.4, 4.2), bodyMat);
        bodyMain.position.set(0, 0.45, 0);
        car.add(bodyMain);

        // Side panels
        [-1, 1].forEach(side => {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 4.0), bodyMat);
            panel.position.set(side * 0.95, 0.48, 0);
            car.add(panel);
        });

        // Hood
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.5), bodyMat);
        hood.position.set(0, 0.7, -1.0);
        hood.rotation.x = 0.06;
        car.add(hood);

        // Hood vent scoop
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.25), grilleMat);
        vent.position.set(0, 0.77, -0.5);
        car.add(vent);

        // Cabin (boxy, hatchback style)
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.6), bodyMat);
        cabin.position.set(0, 0.85, 0.3);
        car.add(cabin);

        // Roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.4), bodyMat);
        roof.position.set(0, 1.15, 0.25);
        car.add(roof);

        // Roof light bar
        const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.15), carbonMat);
        lightBar.position.set(0, 1.22, -0.3);
        car.add(lightBar);
        // Individual lights
        [-0.45, -0.15, 0.15, 0.45].forEach(x => {
            const light = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), headlightMat);
            light.rotation.x = Math.PI / 2;
            light.position.set(x, 1.22, -0.4);
            car.add(light);
        });

        // Windshield
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.5, 0.06), glassMat);
        windshield.position.set(0, 0.9, -0.48);
        windshield.rotation.x = 0.3;
        car.add(windshield);

        // Rear window
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.4, 0.06), darkGlassMat);
        rearWin.position.set(0, 0.9, 1.06);
        rearWin.rotation.x = -0.35;
        car.add(rearWin);

        // Side windows
        [-1, 1].forEach(side => {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 1.2), glassMat);
            sw.position.set(side * 0.78, 0.9, 0.3);
            car.add(sw);
        });

        // Roll cage (visible through windows)
        [-1, 1].forEach(side => {
            const rollBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), chromeMat);
            rollBar.position.set(side * 0.6, 0.9, 0.3);
            car.add(rollBar);
        });
        const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), chromeMat);
        crossBar.rotation.z = Math.PI / 2;
        crossBar.position.set(0, 1.12, 0.3);
        car.add(crossBar);

        // Rear hatch
        const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 0.1), bodyMat);
        hatch.position.set(0, 0.65, 2.05);
        car.add(hatch);

        // Big rear spoiler
        const spoilerSupport1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
        spoilerSupport1.position.set(-0.5, 0.85, 2.0);
        car.add(spoilerSupport1);
        const spoilerSupport2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
        spoilerSupport2.position.set(0.5, 0.85, 2.0);
        car.add(spoilerSupport2);
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.3), carbonMat);
        spoiler.position.set(0, 1.0, 2.0);
        car.add(spoiler);

        // Front bumper with skid plate
        const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.15), bodyMat);
        frontBumper.position.set(0, 0.32, -2.1);
        car.add(frontBumper);
        const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 }));
        skidPlate.position.set(0, 0.2, -2.15);
        car.add(skidPlate);

        // Headlights
        [-0.6, 0.6].forEach(x => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), headlightMat);
            hl.position.set(x, 0.48, -2.1);
            car.add(hl);
        });

        // Fog lights
        [-0.35, 0.35].forEach(x => {
            const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), headlightMat);
            fog.rotation.x = Math.PI / 2;
            fog.position.set(x, 0.28, -2.15);
            car.add(fog);
        });

        // Rear bumper
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.12), bodyMat);
        rearBumper.position.set(0, 0.32, 2.1);
        car.add(rearBumper);

        // Taillights
        [-0.6, 0.6].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), taillightMat);
            tl.position.set(x, 0.52, 2.1);
            car.add(tl);
        });

        // Accent stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.01, 0.3), accentMat);
        stripe.position.set(0, 0.66, -0.2);
        car.add(stripe);
        // Number circle
        [-1, 1].forEach(side => {
            const circle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 20), accentMat);
            circle.rotation.z = Math.PI / 2;
            circle.position.set(side * 0.96, 0.6, 0.5);
            car.add(circle);
        });

        // Wide fenders / flares
        [-1, 1].forEach(side => {
            [-1.3, 1.3].forEach(z => {
                const flare = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), bodyMat);
                flare.position.set(side * 1.02, 0.55, z);
                car.add(flare);
            });
        });

        // Mud flaps
        [-1, 1].forEach(side => {
            const flap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.04), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
            flap.position.set(side * 0.85, 0.3, 1.75);
            car.add(flap);
        });

        // Exhaust
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.15, 12), exhaustMat);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.4, 0.3, 2.18);
        car.add(exhaust);

        // Side mirrors
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), bodyMat);
            arm.position.set(side * 1.05, 0.85, -0.1);
            car.add(arm);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), bodyMat);
            head.position.set(side * 1.15, 0.85, -0.1);
            car.add(head);
        });

        // Tow strap (front)
        const towStrap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.15), accentMat);
        towStrap.position.set(-0.7, 0.28, -2.12);
        car.add(towStrap);

        // Wheels (higher, rally style)
        addWheels(car, {
            wheelRadius: 0.35, wheelWidth: 0.22, spokeCount: 6, rimColor: 0x999999,
            frontX: -1.3, rearX: 1.3, trackWidth: 1.7, yPos: 0.35
        });

        return car;
    }

    // ===== TRACK GENERATION =====
    function buildTrack() {
        const group = new THREE.Group();

        // Create spline curve
        const points = TRACK_POINTS.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        trackCurve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);

        // Pre-compute sample points
        trackSamplePoints = [];
        trackSampleTangents = [];
        for (let i = 0; i < TRACK_SAMPLES; i++) {
            const t = i / TRACK_SAMPLES;
            trackSamplePoints.push(trackCurve.getPointAt(t));
            trackSampleTangents.push(trackCurve.getTangentAt(t));
        }

        // Build road surface mesh
        const roadVerts = [];
        const roadUVs = [];
        const roadNormals = [];
        const roadIndices = [];

        for (let i = 0; i <= TRACK_SAMPLES; i++) {
            const t = (i % TRACK_SAMPLES) / TRACK_SAMPLES;
            const pt = trackCurve.getPointAt(t);
            const tan = trackCurve.getTangentAt(t);
            const normal = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

            const left = pt.clone().add(normal.clone().multiplyScalar(ROAD_HALF));
            const right = pt.clone().sub(normal.clone().multiplyScalar(ROAD_HALF));

            roadVerts.push(left.x, 0.01, left.z);
            roadVerts.push(right.x, 0.01, right.z);
            roadNormals.push(0, 1, 0, 0, 1, 0);
            roadUVs.push(0, i / 10);
            roadUVs.push(1, i / 10);

            if (i < TRACK_SAMPLES) {
                const vi = i * 2;
                roadIndices.push(vi, vi + 1, vi + 2);
                roadIndices.push(vi + 1, vi + 3, vi + 2);
            }
        }

        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
        roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
        roadGeo.setIndex(roadIndices);

        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.85,
            metalness: 0.0
        });
        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        group.add(roadMesh);

        // White center dashed line
        for (let i = 0; i < TRACK_SAMPLES; i += 8) {
            if ((Math.floor(i / 8)) % 2 === 0) continue; // skip every other for dashes
            const t = i / TRACK_SAMPLES;
            const tNext = ((i + 4) % TRACK_SAMPLES) / TRACK_SAMPLES;
            const p1 = trackCurve.getPointAt(t);
            const p2 = trackCurve.getPointAt(tNext);
            const mid = p1.clone().add(p2).multiplyScalar(0.5);
            const len = p1.distanceTo(p2);
            const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

            const dash = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.005, len),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
            );
            dash.position.set(mid.x, 0.02, mid.z);
            dash.rotation.y = angle;
            group.add(dash);
        }

        // Edge lines (white)
        [ROAD_HALF - 0.3, -(ROAD_HALF - 0.3)].forEach(offset => {
            for (let i = 0; i < TRACK_SAMPLES; i += 3) {
                const t = i / TRACK_SAMPLES;
                const tNext = ((i + 3) % TRACK_SAMPLES) / TRACK_SAMPLES;
                const p1 = trackCurve.getPointAt(t);
                const p2 = trackCurve.getPointAt(tNext);
                const tan1 = trackCurve.getTangentAt(t);

                const n1 = new THREE.Vector3(-tan1.z, 0, tan1.x).normalize();
                const edgeP1 = p1.clone().add(n1.clone().multiplyScalar(offset));
                const tan2 = trackCurve.getTangentAt(tNext);
                const n2 = new THREE.Vector3(-tan2.z, 0, tan2.x).normalize();
                const edgeP2 = p2.clone().add(n2.clone().multiplyScalar(offset));

                const mid = edgeP1.clone().add(edgeP2).multiplyScalar(0.5);
                const len = edgeP1.distanceTo(edgeP2);
                const angle = Math.atan2(edgeP2.x - edgeP1.x, edgeP2.z - edgeP1.z);

                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(0.15, 0.005, len),
                    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 })
                );
                line.position.set(mid.x, 0.02, mid.z);
                line.rotation.y = angle;
                group.add(line);
            }
        });

        // Barriers along track edges
        [ROAD_HALF + 0.8, -(ROAD_HALF + 0.8)].forEach(offset => {
            for (let i = 0; i < TRACK_SAMPLES; i += 6) {
                const t = i / TRACK_SAMPLES;
                const pt = trackCurve.getPointAt(t);
                const tan = trackCurve.getTangentAt(t);
                const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
                const pos = pt.clone().add(n.clone().multiplyScalar(offset));
                const angle = Math.atan2(tan.x, tan.z);

                const isRed = (Math.floor(i / 6)) % 2 === 0;
                const barrier = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.6, 1.8),
                    new THREE.MeshStandardMaterial({
                        color: isRed ? 0xcc2222 : 0xeeeeee,
                        roughness: 0.7
                    })
                );
                barrier.position.set(pos.x, 0.3, pos.z);
                barrier.rotation.y = angle;
                group.add(barrier);
            }
        });

        // Kerbs at corners (red/white alternating)
        [ROAD_HALF - 0.1, -(ROAD_HALF - 0.1)].forEach(offset => {
            for (let i = 0; i < TRACK_SAMPLES; i += 4) {
                const t = i / TRACK_SAMPLES;
                const pt = trackCurve.getPointAt(t);
                const tan = trackCurve.getTangentAt(t);

                // Only at corners (when curvature is high)
                const tPrev = ((i - 4 + TRACK_SAMPLES) % TRACK_SAMPLES) / TRACK_SAMPLES;
                const tanPrev = trackCurve.getTangentAt(tPrev);
                const curvature = tan.clone().sub(tanPrev).length();

                if (curvature > 0.02) {
                    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
                    const pos = pt.clone().add(n.clone().multiplyScalar(offset));
                    const angle = Math.atan2(tan.x, tan.z);
                    const isRed = (Math.floor(i / 4)) % 2 === 0;

                    const kerb = new THREE.Mesh(
                        new THREE.BoxGeometry(1.0, 0.03, 1.0),
                        new THREE.MeshStandardMaterial({ color: isRed ? 0xcc0000 : 0xffffff, roughness: 0.6 })
                    );
                    kerb.position.set(pos.x, 0.015, pos.z);
                    kerb.rotation.y = angle;
                    group.add(kerb);
                }
            }
        });

        // Start/finish line
        const startPt = trackCurve.getPointAt(0);
        const startTan = trackCurve.getTangentAt(0);
        const startNormal = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
        const startAngle = Math.atan2(startNormal.x, startNormal.z);

        const startLine = new THREE.Mesh(
            new THREE.BoxGeometry(ROAD_WIDTH, 0.01, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        startLine.position.set(startPt.x, 0.025, startPt.z);
        startLine.rotation.y = startAngle;
        group.add(startLine);

        // Checkerboard pattern on start line
        for (let ix = -4; ix <= 4; ix++) {
            for (let iz = 0; iz < 3; iz++) {
                if ((ix + iz) % 2 === 0) {
                    const sq = new THREE.Mesh(
                        new THREE.BoxGeometry(1.4, 0.005, 0.45),
                        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
                    );
                    const localX = ix * 1.5;
                    const localZ = (iz - 1) * 0.45;
                    sq.position.set(
                        startPt.x + startNormal.x * localX + startTan.x * localZ,
                        0.03,
                        startPt.z + startNormal.z * localX + startTan.z * localZ
                    );
                    sq.rotation.y = startAngle;
                    group.add(sq);
                }
            }
        }

        return group;
    }

    // ===== ENVIRONMENT =====
    function buildEnvironment() {
        const group = new THREE.Group();

        // Ground plane
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(600, 600),
            new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.95 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        group.add(ground);

        // Gravel runoff areas around track
        for (let i = 0; i < TRACK_SAMPLES; i += 15) {
            const t = i / TRACK_SAMPLES;
            const pt = trackCurve.getPointAt(t);
            const tan = trackCurve.getTangentAt(t);
            const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

            [ROAD_HALF + 3, -(ROAD_HALF + 3)].forEach(offset => {
                const pos = pt.clone().add(n.clone().multiplyScalar(offset));
                const gravel = new THREE.Mesh(
                    new THREE.BoxGeometry(4, 0.005, 4),
                    new THREE.MeshStandardMaterial({ color: 0xb8a88a, roughness: 0.95 })
                );
                gravel.position.set(pos.x, 0.005, pos.z);
                gravel.rotation.y = Math.atan2(tan.x, tan.z);
                group.add(gravel);
            });
        }

        // Trees scattered around
        const treeColors = [0x2d5a27, 0x3a7d44, 0x1a4d1a, 0x4a8c3f];
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 200;
            const x = Math.cos(angle) * dist + 100;
            const z = Math.sin(angle) * dist;

            // Check if too close to track
            let tooClose = false;
            for (let j = 0; j < TRACK_SAMPLES; j += 20) {
                const tp = trackSamplePoints[j];
                const dx = x - tp.x;
                const dz = z - tp.z;
                if (dx * dx + dz * dz < (ROAD_HALF + 8) * (ROAD_HALF + 8)) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            const treeGroup = new THREE.Group();

            // Trunk
            const trunkHeight = 1.5 + Math.random() * 2;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 8),
                new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 })
            );
            trunk.position.y = trunkHeight / 2;
            treeGroup.add(trunk);

            // Foliage (2-3 layers)
            const layers = 2 + Math.floor(Math.random() * 2);
            const treeColor = treeColors[Math.floor(Math.random() * treeColors.length)];
            for (let l = 0; l < layers; l++) {
                const radius = 1.5 - l * 0.35 + Math.random() * 0.3;
                const foliage = new THREE.Mesh(
                    new THREE.ConeGeometry(radius, 2.0, 8),
                    new THREE.MeshStandardMaterial({ color: treeColor, roughness: 0.85 })
                );
                foliage.position.y = trunkHeight + l * 1.2 + 0.5;
                treeGroup.add(foliage);
            }

            treeGroup.position.set(x, 0, z);
            group.add(treeGroup);
        }

        // Grandstand near start/finish
        const startPt = trackCurve.getPointAt(0);
        const startTan = trackCurve.getTangentAt(0);
        const startN = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
        const grandstandPos = startPt.clone().add(startN.clone().multiplyScalar(-(ROAD_HALF + 12)));

        const grandstand = new THREE.Group();
        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(20, 1, 6),
            new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 })
        );
        base.position.y = 0.5;
        grandstand.add(base);

        // Tiered seating
        for (let row = 0; row < 4; row++) {
            const tier = new THREE.Mesh(
                new THREE.BoxGeometry(19, 0.4, 1.2),
                new THREE.MeshStandardMaterial({ color: row % 2 === 0 ? 0x2255aa : 0xcc3333, roughness: 0.7 })
            );
            tier.position.set(0, 1.2 + row * 0.7, -1.5 + row * 1.2);
            grandstand.add(tier);
        }

        // Roof
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(22, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 })
        );
        roofMesh.position.set(0, 4.5, 0);
        grandstand.add(roofMesh);

        // Support pillars
        [-9, -3, 3, 9].forEach(x => {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 4.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 })
            );
            pillar.position.set(x, 2.25, 2.5);
            grandstand.add(pillar);
        });

        grandstand.position.set(grandstandPos.x, 0, grandstandPos.z);
        grandstand.rotation.y = Math.atan2(startTan.x, startTan.z);
        group.add(grandstand);

        // Pit buildings on opposite side
        const pitPos = startPt.clone().add(startN.clone().multiplyScalar(ROAD_HALF + 10));
        for (let b = 0; b < 4; b++) {
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(5, 3, 4),
                new THREE.MeshStandardMaterial({
                    color: [0x666666, 0x555555, 0x777777, 0x606060][b],
                    roughness: 0.7
                })
            );
            building.position.set(
                pitPos.x + startTan.x * (b * 6 - 9),
                1.5,
                pitPos.z + startTan.z * (b * 6 - 9)
            );
            building.rotation.y = Math.atan2(startTan.x, startTan.z);
            group.add(building);

            // Garage door
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2.2, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
            );
            door.position.set(
                pitPos.x + startTan.x * (b * 6 - 9) - startN.x * 2.05,
                1.1,
                pitPos.z + startTan.z * (b * 6 - 9) - startN.z * 2.05
            );
            door.rotation.y = Math.atan2(startTan.x, startTan.z);
            group.add(door);
        }

        return group;
    }

    // ===== SCENE SETUP =====
    function initScene() {
        const container = document.getElementById('gameCanvas');

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 100, 350);

        camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 500);
        camera.position.set(0, 10, 20);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.6);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
        sunLight.position.set(80, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 300;
        sunLight.shadow.camera.left = -150;
        sunLight.shadow.camera.right = 150;
        sunLight.shadow.camera.top = 150;
        sunLight.shadow.camera.bottom = -150;
        scene.add(sunLight);

        // Build track & environment
        const trackGroup = buildTrack();
        scene.add(trackGroup);

        const envGroup = buildEnvironment();
        scene.add(envGroup);

        // Resize handler
        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // ===== PREVIEW SCENE =====
    function initPreviewScene() {
        const container = document.getElementById('carPreviewContainer');

        previewScene = new THREE.Scene();
        previewScene.background = new THREE.Color(0x0f0a1a);

        previewCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        previewCamera.position.set(4, 2.5, 4);
        previewCamera.lookAt(0, 0.5, 0);

        previewRenderer = new THREE.WebGLRenderer({ antialias: true });
        previewRenderer.setSize(container.clientWidth, container.clientHeight);
        previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        previewRenderer.toneMappingExposure = 1.5;
        container.appendChild(previewRenderer.domElement);

        // Lights for preview
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        previewScene.add(ambient);

        const hemi = new THREE.HemisphereLight(0x6366f1, 0x1e1b4b, 0.5);
        previewScene.add(hemi);

        const key = new THREE.DirectionalLight(0xffffff, 1.0);
        key.position.set(5, 8, 5);
        previewScene.add(key);

        const fill = new THREE.DirectionalLight(0x6366f1, 0.3);
        fill.position.set(-5, 3, -5);
        previewScene.add(fill);

        const rim = new THREE.DirectionalLight(0xa78bfa, 0.4);
        rim.position.set(0, 5, -8);
        previewScene.add(rim);

        // Platform
        const platform = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 0.1, 32),
            new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.5, roughness: 0.3 })
        );
        platform.position.y = -0.05;
        previewScene.add(platform);

        // Grid ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(3, 0.02, 8, 64),
            new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x6366f1, emissiveIntensity: 0.3 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.01;
        previewScene.add(ring);

        // Show initial car
        updatePreviewCar();
    }

    function updatePreviewCar() {
        if (previewCarModel) {
            previewScene.remove(previewCarModel);
        }
        const data = CAR_DATA[selectedCarIndex];
        previewCarModel = data.builder(data.color, data.accent);
        previewCarModel.rotation.y = previewAngle;
        previewScene.add(previewCarModel);

        // Update UI
        document.getElementById('carName').textContent = data.name;
        document.getElementById('carDesc').textContent = data.desc;
        document.getElementById('carCounter').textContent = (selectedCarIndex + 1) + ' / ' + CAR_DATA.length;
        document.getElementById('statSpeed').style.width = data.stats.speed + '%';
        document.getElementById('statHandling').style.width = data.stats.handling + '%';
        document.getElementById('statAccel').style.width = data.stats.accel + '%';
        document.getElementById('statBrake').style.width = data.stats.brake + '%';
    }

    // ===== INPUT =====
    function setupInput() {
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                e.preventDefault();
            }
            // Emergency stop
            if (e.code === 'Digit9' || e.code === 'Numpad9') {
                speed = 0;
            }
        });
        window.addEventListener('keyup', e => {
            keys[e.code] = false;
        });
    }

    // ===== PHYSICS =====
    function updatePhysics(dt) {
        if (gameState !== 'racing') return;

        const data = CAR_DATA[selectedCarIndex];
        const maxSpd = data.maxSpeed;
        const accelForce = data.accel;
        const turnRate = data.turnRate;
        const brakeForce = data.brakeForce;

        // Check if on road or grass
        const onRoad = isOnRoad(carPosition);
        const surfaceMult = onRoad ? 1.0 : 0.45; // grass slows you significantly
        const grassDrag = onRoad ? 1.0 : 0.97;

        // Acceleration
        if (keys['ArrowUp']) {
            speed += accelForce * surfaceMult * dt;
        }
        if (keys['ArrowDown']) {
            speed -= brakeForce * surfaceMult * dt;
        }

        // Clamp speed
        speed = Math.max(-maxSpd * 0.3, Math.min(maxSpd, speed));

        // Friction / drag
        if (!keys['ArrowUp'] && !keys['ArrowDown']) {
            speed *= Math.pow(0.985, dt * 60);
        }
        speed *= Math.pow(grassDrag, dt * 60);

        // Tiny speed = stop
        if (Math.abs(speed) < 0.1) speed *= 0.9;

        // Steering (depends on speed)
        const steerFactor = Math.min(1, Math.abs(speed) / 20);
        if (keys['ArrowLeft']) {
            heading += turnRate * steerFactor * dt;
        }
        if (keys['ArrowRight']) {
            heading -= turnRate * steerFactor * dt;
        }

        // Move car
        const forward = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
        carPosition.addScaledVector(forward, speed * dt);

        // Track boundary collision
        enforceTrackBounds();

        // Update car object
        if (playerCar) {
            playerCar.position.copy(carPosition);
            playerCar.rotation.y = heading;

            // Slight body roll on steering
            const targetRoll = 0;
            if (keys['ArrowLeft']) playerCar.rotation.z = -0.03 * steerFactor;
            else if (keys['ArrowRight']) playerCar.rotation.z = 0.03 * steerFactor;
            else playerCar.rotation.z *= 0.9;

            // Slight pitch on accel/brake
            if (keys['ArrowUp']) playerCar.rotation.x = 0.015;
            else if (keys['ArrowDown']) playerCar.rotation.x = -0.02;
            else playerCar.rotation.x *= 0.9;

            // Spin wheels
            const wheelSpeed = speed * dt * 3;
            ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'].forEach(name => {
                const w = playerCar.getObjectByName(name);
                if (w) {
                    w.children.forEach(child => {
                        if (child.geometry && child.geometry.type === 'TorusGeometry') {
                            // Rotate the whole wheel group on the axle
                        }
                    });
                }
            });
        }
    }

    function isOnRoad(pos) {
        let minDist = Infinity;
        for (let i = 0; i < TRACK_SAMPLES; i += 4) {
            const tp = trackSamplePoints[i];
            const dx = pos.x - tp.x;
            const dz = pos.z - tp.z;
            const dist = dx * dx + dz * dz;
            if (dist < minDist) minDist = dist;
        }
        return Math.sqrt(minDist) < ROAD_HALF;
    }

    function getNearestTrackInfo(pos) {
        let minDist = Infinity;
        let bestIdx = 0;
        for (let i = 0; i < TRACK_SAMPLES; i += 2) {
            const tp = trackSamplePoints[i];
            const dx = pos.x - tp.x;
            const dz = pos.z - tp.z;
            const dist = dx * dx + dz * dz;
            if (dist < minDist) {
                minDist = dist;
                bestIdx = i;
            }
        }
        return {
            index: bestIdx,
            t: bestIdx / TRACK_SAMPLES,
            point: trackSamplePoints[bestIdx],
            tangent: trackSampleTangents[bestIdx],
            distance: Math.sqrt(minDist)
        };
    }

    function enforceTrackBounds() {
        // No hard stop — just apply increasing friction the further off-track you go.
        // The grass drag in updatePhysics already slows off-road driving.
        // Here we add extra drag for being very far off the track.
        const info = getNearestTrackInfo(carPosition);
        const offRoadDist = info.distance - ROAD_HALF;
        if (offRoadDist > 0) {
            // Progressive drag: the further off-track, the more friction
            const extraDrag = Math.min(0.92, 1 - offRoadDist * 0.004);
            speed *= extraDrag;
            // Reduce steering responsiveness off-road
        }
        // Only enforce a very far boundary to prevent going to infinity
        const absoluteMax = ROAD_HALF + 60;
        if (info.distance > absoluteMax) {
            const dir = new THREE.Vector3(
                carPosition.x - info.point.x,
                0,
                carPosition.z - info.point.z
            ).normalize();
            carPosition.copy(info.point).addScaledVector(dir, absoluteMax - 0.5);
        }
    }

    // ===== LAP DETECTION =====
    function updateLapDetection() {
        if (gameState !== 'racing') return;

        const info = getNearestTrackInfo(carPosition);
        const currentT = info.t;

        // Detect crossing the start line (t wraps from ~1.0 to ~0.0)
        if (lastTrackT > 0.9 && currentT < 0.1 && speed > 1) {
            lapCrossings++;
            if (lapCrossings >= 1) {
                const lapTime = raceTime - lapTimes.reduce((a, b) => a + b, 0);
                if (currentLap >= 1) {
                    lapTimes.push(lapTime);
                    if (lapTime < bestLap) bestLap = lapTime;
                }
                currentLap++;
                if (currentLap > TOTAL_LAPS) {
                    finishRace();
                }
            }
        }

        // Detect wrong way (going backward past start)
        if (lastTrackT < 0.1 && currentT > 0.9 && speed > 1) {
            if (lapCrossings > 0) lapCrossings--;
        }

        lastTrackT = currentT;
    }

    // ===== CAMERA =====
    function updateCamera() {
        if (!playerCar) return;

        const cameraOffset = new THREE.Vector3(0, 4.5, 10);
        const rotatedOffset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
        const desiredPos = carPosition.clone().add(rotatedOffset);

        camera.position.lerp(desiredPos, 0.06);

        const lookTarget = carPosition.clone().add(new THREE.Vector3(0, 1.2, 0));
        // Look slightly ahead
        const fwd = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
        lookTarget.addScaledVector(fwd, 3);
        camera.lookAt(lookTarget);
    }

    // ===== HUD =====
    function updateHUD() {
        const mph = Math.abs(Math.round(speed * 1.5)); // scale to feel like MPH
        document.getElementById('hudSpeed').textContent = mph;
        document.getElementById('hudLap').textContent = Math.min(currentLap, TOTAL_LAPS) + ' / ' + TOTAL_LAPS;

        const mins = Math.floor(raceTime / 60);
        const secs = (raceTime % 60).toFixed(1);
        document.getElementById('hudTime').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;

        if (bestLap < Infinity) {
            const bm = Math.floor(bestLap / 60);
            const bs = (bestLap % 60).toFixed(2);
            document.getElementById('hudBest').textContent = bm + ':' + (bs < 10 ? '0' : '') + bs;
        }
    }

    // ===== GAME FLOW =====
    function startCountdown() {
        gameState = 'countdown';
        document.getElementById('carSelectOverlay').style.display = 'none';
        document.getElementById('raceHUD').style.display = 'flex';
        document.getElementById('countdownOverlay').style.display = 'flex';
        document.getElementById('raceCompleteOverlay').style.display = 'none';

        // Place car at start
        const startPt = trackCurve.getPointAt(0);
        const startTan = trackCurve.getTangentAt(0);
        heading = Math.atan2(-startTan.x, -startTan.z);
        carPosition.set(startPt.x, 0, startPt.z);
        speed = 0;
        raceTime = 0;
        lapTimes = [];
        bestLap = Infinity;
        currentLap = 1;
        lapCrossings = 0;
        lastTrackT = 0;

        // Build player car
        if (playerCar) scene.remove(playerCar);
        const data = CAR_DATA[selectedCarIndex];
        playerCar = data.builder(data.color, data.accent);
        playerCar.position.copy(carPosition);
        playerCar.rotation.y = heading;
        scene.add(playerCar);

        // Position camera
        const cameraOffset = new THREE.Vector3(0, 4.5, 10);
        const rotatedOffset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
        camera.position.copy(carPosition.clone().add(rotatedOffset));
        camera.lookAt(carPosition);

        // Countdown sequence
        let count = 3;
        const countdownText = document.getElementById('countdownText');
        countdownText.textContent = count;

        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.textContent = count;
            } else if (count === 0) {
                countdownText.textContent = 'GO!';
                countdownText.style.color = '#10b981';
            } else {
                clearInterval(countInterval);
                document.getElementById('countdownOverlay').style.display = 'none';
                countdownText.style.color = '#fff';
                gameState = 'racing';
            }
        }, 1000);
    }

    function finishRace() {
        gameState = 'finished';
        document.getElementById('raceCompleteOverlay').style.display = 'flex';

        const totalTime = raceTime;
        const tm = Math.floor(totalTime / 60);
        const ts = (totalTime % 60).toFixed(2);

        let resultsHTML = '';
        resultsHTML += '<div><span class="result-label">Total Time:</span><span class="result-value">' + tm + ':' + (ts < 10 ? '0' : '') + ts + '</span></div>';

        lapTimes.forEach((lt, i) => {
            const lm = Math.floor(lt / 60);
            const ls = (lt % 60).toFixed(2);
            const isBest = lt <= bestLap + 0.01;
            resultsHTML += '<div><span class="result-label">Lap ' + (i + 1) + ':</span><span class="result-value">' +
                lm + ':' + (ls < 10 ? '0' : '') + ls +
                (isBest ? ' ⭐ Best!' : '') + '</span></div>';
        });

        document.getElementById('raceResults').innerHTML = resultsHTML;
    }

    function resetToMenu() {
        gameState = 'menu';
        speed = 0;
        if (playerCar) {
            scene.remove(playerCar);
            playerCar = null;
        }
        document.getElementById('carSelectOverlay').style.display = 'flex';
        document.getElementById('raceHUD').style.display = 'none';
        document.getElementById('countdownOverlay').style.display = 'none';
        document.getElementById('raceCompleteOverlay').style.display = 'none';
    }

    // ===== ANIMATION LOOPS =====
    function animate() {
        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.05);

        if (gameState === 'racing') {
            raceTime += dt;
            updatePhysics(dt);
            updateLapDetection();
            updateCamera();
            updateHUD();
        } else if (gameState === 'countdown') {
            updateCamera();
        } else if (gameState === 'finished') {
            // Slow orbit camera around car
            if (playerCar) {
                const orbitAngle = Date.now() * 0.0005;
                const orbitDist = 8;
                camera.position.set(
                    carPosition.x + Math.cos(orbitAngle) * orbitDist,
                    carPosition.y + 4,
                    carPosition.z + Math.sin(orbitAngle) * orbitDist
                );
                camera.lookAt(carPosition.x, carPosition.y + 1, carPosition.z);
            }
        }

        renderer.render(scene, camera);
    }

    function animatePreview() {
        requestAnimationFrame(animatePreview);

        if (previewCarModel && gameState === 'menu') {
            previewAngle += 0.008;
            previewCarModel.rotation.y = previewAngle;
        }

        if (previewRenderer && previewScene && previewCamera) {
            previewRenderer.render(previewScene, previewCamera);
        }
    }

    // ===== UI EVENT HANDLERS =====
    function setupUI() {
        document.getElementById('prevCarBtn').addEventListener('click', () => {
            selectedCarIndex = (selectedCarIndex - 1 + CAR_DATA.length) % CAR_DATA.length;
            updatePreviewCar();
        });

        document.getElementById('nextCarBtn').addEventListener('click', () => {
            selectedCarIndex = (selectedCarIndex + 1) % CAR_DATA.length;
            updatePreviewCar();
        });

        document.getElementById('startRaceBtn').addEventListener('click', () => {
            startCountdown();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            document.getElementById('raceCompleteOverlay').style.display = 'none';
            startCountdown();
        });

        document.getElementById('changeCarBtn').addEventListener('click', () => {
            resetToMenu();
        });

        // Keyboard navigation in menu
        window.addEventListener('keydown', e => {
            if (gameState === 'menu') {
                if (e.code === 'ArrowLeft') {
                    selectedCarIndex = (selectedCarIndex - 1 + CAR_DATA.length) % CAR_DATA.length;
                    updatePreviewCar();
                    e.preventDefault();
                } else if (e.code === 'ArrowRight') {
                    selectedCarIndex = (selectedCarIndex + 1) % CAR_DATA.length;
                    updatePreviewCar();
                    e.preventDefault();
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    startCountdown();
                    e.preventDefault();
                }
            }
        });
    }

    // ===== INITIALIZATION =====
    function init() {
        initScene();
        initPreviewScene();
        setupInput();
        setupUI();

        animate();
        animatePreview();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
