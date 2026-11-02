(function () {
  'use strict';

  // ===================== CONSTANTS =====================
  const GRID = 6;
  const EXIT_ROW = 2;
  const PLAYER_COLOR = '#22c55e';
  const CAR_COLORS = [
    '#ef4444', '#3b82f6', '#f97316', '#a855f7', '#ec4899',
    '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#0891b2'
  ];

  // ===================== LEVELS =====================
  const LEVELS = [
    {
      name: "Let's Go!",
      hint: 'Drag the green car to the EXIT! →',
      cars: [{ r: 2, c: 2, len: 2, dir: 'h' }]
    },
    {
      name: 'Move the Red Car',
      hint: 'Slide the red car UP, then drive out!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 3, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Big Truck!',
      hint: 'Move the big truck DOWN!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 4, len: 3, dir: 'v' }
      ]
    },
    {
      name: 'Two Blockers',
      hint: 'Move both cars out of the way!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 2, len: 2, dir: 'v' },
        { r: 1, c: 4, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Which One?',
      hint: 'Only one car is blocking — find it!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 2, c: 3, len: 2, dir: 'v' },
        { r: 4, c: 0, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Chain Reaction',
      hint: 'Move one car to free another!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 3, len: 2, dir: 'v' },
        { r: 0, c: 2, len: 2, dir: 'h' },
        { r: 3, c: 3, len: 2, dir: 'h' }
      ]
    },
    {
      name: 'Three Blockers',
      hint: 'Clear the path through three cars!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 2, len: 2, dir: 'v' },
        { r: 2, c: 4, len: 2, dir: 'v' },
        { r: 1, c: 5, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Unblock!',
      hint: 'The car in the middle is stuck!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 2, c: 2, len: 2, dir: 'v' },
        { r: 0, c: 1, len: 2, dir: 'h' },
        { r: 4, c: 1, len: 2, dir: 'h' }
      ]
    },
    {
      name: 'Puzzle Time',
      hint: 'Think about which car to move first!',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 3, len: 2, dir: 'v' },
        { r: 0, c: 2, len: 2, dir: 'h' },
        { r: 3, c: 2, len: 2, dir: 'h' },
        { r: 1, c: 5, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Traffic Jam',
      hint: 'So many cars! Take your time.',
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 1, c: 2, len: 2, dir: 'v' },
        { r: 0, c: 1, len: 2, dir: 'h' },
        { r: 3, c: 1, len: 2, dir: 'h' },
        { r: 2, c: 4, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Almost There!',
      hint: "You're getting so good at this!",
      cars: [
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 2, c: 2, len: 2, dir: 'v' },
        { r: 0, c: 1, len: 2, dir: 'h' },
        { r: 4, c: 1, len: 2, dir: 'h' },
        { r: 1, c: 4, len: 2, dir: 'v' },
        { r: 3, c: 4, len: 2, dir: 'v' }
      ]
    },
    {
      name: 'Parking Pro!',
      hint: 'The ultimate challenge! You can do it!',
      cars: [
        { r: 2, c: 1, len: 2, dir: 'h' },
        { r: 1, c: 3, len: 2, dir: 'v' },
        { r: 0, c: 2, len: 2, dir: 'h' },
        { r: 3, c: 2, len: 2, dir: 'h' },
        { r: 1, c: 5, len: 2, dir: 'v' },
        { r: 0, c: 4, len: 2, dir: 'h' },
        { r: 3, c: 4, len: 2, dir: 'v' }
      ]
    }
  ];

  // ===================== STATE =====================
  var currentLevel = 0;
  var cars = [];
  var moves = 0;
  var maxUnlocked = 0;
  var dragging = null;
  var animating = false;
  var confetti = [];
  var gameActive = false;

  // ===================== DOM =====================
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var menuScreen = document.getElementById('menuScreen');
  var gameScreen = document.getElementById('gameScreen');
  var winOverlay = document.getElementById('winOverlay');
  var levelGrid = document.getElementById('levelGrid');
  var levelLabel = document.getElementById('levelLabel');
  var moveLabel = document.getElementById('moveLabel');
  var hintBar = document.getElementById('hintBar');

  // ===================== SIZING =====================
  var cellSize = 0, boardX = 0, boardY = 0, boardSize = 0;

  function resize() {
    var wrap = canvas.parentElement;
    var maxW = Math.min(wrap.clientWidth - 8, 480);
    cellSize = Math.floor(maxW / (GRID + 1.2));
    boardSize = cellSize * GRID;
    canvas.width = boardSize + Math.floor(cellSize * 1.4);
    canvas.height = boardSize + 10;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    boardX = 4;
    boardY = 4;
  }

  // ===================== HELPERS =====================
  function lighten(hex, pct) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, (n >> 16) + Math.floor(255 * pct / 100));
    var g = Math.min(255, ((n >> 8) & 0xff) + Math.floor(255 * pct / 100));
    var b = Math.min(255, (n & 0xff) + Math.floor(255 * pct / 100));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function darken(hex, pct) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, (n >> 16) - Math.floor(255 * pct / 100));
    var g = Math.max(0, ((n >> 8) & 0xff) - Math.floor(255 * pct / 100));
    var b = Math.max(0, (n & 0xff) - Math.floor(255 * pct / 100));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function rrPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function rrFill(x, y, w, h, r) { rrPath(x, y, w, h, r); ctx.fill(); }
  function rrStroke(x, y, w, h, r) { rrPath(x, y, w, h, r); ctx.stroke(); }

  function getColor(idx) {
    return idx === 0 ? PLAYER_COLOR : CAR_COLORS[(idx - 1) % CAR_COLORS.length];
  }

  // ===================== RENDER =====================
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawExitArea();

    // Draw non-dragged cars, then dragged on top
    for (var i = 0; i < cars.length; i++) {
      if (dragging && dragging.idx === i) continue;
      drawCar(i, false);
    }
    if (dragging) drawCar(dragging.idx, true);

    if (confetti.length) drawConfetti();
  }

  // ---- Board ----
  function drawBoard() {
    // Outer border
    ctx.fillStyle = '#374151';
    rrFill(boardX - 3, boardY - 3, boardSize + 6, boardSize + 6, 10);

    // Asphalt
    ctx.fillStyle = '#52606e';
    rrFill(boardX, boardY, boardSize, boardSize, 8);

    // Subtle texture
    ctx.fillStyle = '#586878';
    for (var ty = 0; ty < GRID; ty++) {
      for (var tx = 0; tx < GRID; tx++) {
        if ((tx + ty) % 2 === 0) {
          ctx.fillRect(boardX + tx * cellSize + 1, boardY + ty * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    ctx.fillStyle = '#52606e';
    rrFill(boardX + 1, boardY + 1, boardSize - 2, boardSize - 2, 7);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (var i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(boardX + i * cellSize, boardY + 2);
      ctx.lineTo(boardX + i * cellSize, boardY + boardSize - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(boardX + 2, boardY + i * cellSize);
      ctx.lineTo(boardX + boardSize - 2, boardY + i * cellSize);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Walls
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    // Top
    ctx.beginPath(); ctx.moveTo(boardX, boardY); ctx.lineTo(boardX + boardSize, boardY); ctx.stroke();
    // Bottom
    ctx.beginPath(); ctx.moveTo(boardX, boardY + boardSize); ctx.lineTo(boardX + boardSize, boardY + boardSize); ctx.stroke();
    // Left
    ctx.beginPath(); ctx.moveTo(boardX, boardY); ctx.lineTo(boardX, boardY + boardSize); ctx.stroke();
    // Right with exit gap
    ctx.beginPath(); ctx.moveTo(boardX + boardSize, boardY); ctx.lineTo(boardX + boardSize, boardY + EXIT_ROW * cellSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(boardX + boardSize, boardY + (EXIT_ROW + 1) * cellSize); ctx.lineTo(boardX + boardSize, boardY + boardSize); ctx.stroke();

    // Exit-row highlight
    ctx.fillStyle = 'rgba(34,197,94,0.07)';
    ctx.fillRect(boardX + 1, boardY + EXIT_ROW * cellSize + 1, boardSize - 2, cellSize - 2);
  }

  // ---- Exit area ----
  function drawExitArea() {
    var ex = boardX + boardSize + 2;
    var ey = boardY + EXIT_ROW * cellSize;
    var ew = cellSize * 1.1;

    // Road stripe
    ctx.fillStyle = 'rgba(34,197,94,0.10)';
    rrFill(ex, ey + 2, ew, cellSize - 4, 6);

    // Bouncing arrow
    var bounce = Math.sin(Date.now() / 400) * 4;
    var ax = ex + ew * 0.35 + bounce;
    var ay = ey + cellSize * 0.5;
    var as = cellSize * 0.22;

    ctx.fillStyle = '#22c55e';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(ax, ay - as);
    ctx.lineTo(ax + as * 1.3, ay);
    ctx.lineTo(ax, ay + as);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // EXIT text
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold ' + Math.floor(cellSize * 0.19) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('EXIT', ex + ew * 0.45, ey + cellSize * 0.78);
  }

  // ---- Car Drawing ----
  function drawCar(idx, selected) {
    var car = cars[idx];
    var color = getColor(idx);
    var isPlayer = idx === 0;
    var pad = cellSize * 0.055;
    var cx, cy, cw, ch;

    if (car.dir === 'h') {
      cx = boardX + car.c * cellSize + (car.dd || 0) + (car.ed || 0);
      cy = boardY + car.r * cellSize;
      cw = car.len * cellSize;
      ch = cellSize;
    } else {
      cx = boardX + car.c * cellSize;
      cy = boardY + car.r * cellSize + (car.dd || 0);
      cw = cellSize;
      ch = car.len * cellSize;
    }

    ctx.save();
    if (selected) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
    }

    if (car.dir === 'h') {
      drawCarBody(cx + pad, cy + pad, cw - pad * 2, ch - pad * 2, color, isPlayer, car.len >= 3, false);
    } else {
      // Use canvas transform: rotate horizontal drawing to vertical
      ctx.translate(cx + cw - pad, cy + pad);
      ctx.rotate(Math.PI / 2);
      drawCarBody(0, 0, ch - pad * 2, cw - pad * 2, color, isPlayer, car.len >= 3, true);
    }

    ctx.restore();
  }

  function drawCarBody(x, y, w, h, color, isPlayer, isTruck, isRotated) {
    var r = h * 0.22;
    var s = Math.min(w, h); // reference size

    // --- Shadow ---
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rrFill(x + 2, y + 2, w, h, r);

    // --- Wheels ---
    var ww = w * 0.12, wh = h * 0.2, wo = h * 0.07;
    var winset = w * 0.1;
    ctx.fillStyle = '#1a1a2e';
    // Rear wheels
    rrFill(x + winset, y - wo, ww, wh, 2);
    rrFill(x + winset, y + h - wh + wo, ww, wh, 2);
    // Front wheels
    rrFill(x + w - winset - ww, y - wo, ww, wh, 2);
    rrFill(x + w - winset - ww, y + h - wh + wo, ww, wh, 2);
    // Wheel rims
    ctx.fillStyle = 'rgba(180,180,180,0.45)';
    var rimR = Math.max(1.5, ww * 0.3);
    ctx.beginPath(); ctx.arc(x + winset + ww / 2, y - wo + wh / 2, rimR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + winset + ww / 2, y + h - wh + wo + wh / 2, rimR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - winset - ww / 2, y - wo + wh / 2, rimR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - winset - ww / 2, y + h - wh + wo + wh / 2, rimR, 0, Math.PI * 2); ctx.fill();

    // --- Body ---
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, lighten(color, 22));
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, darken(color, 12));
    ctx.fillStyle = grad;
    rrFill(x, y, w, h, r);

    // Body outline
    ctx.strokeStyle = darken(color, 22);
    ctx.lineWidth = 1;
    rrStroke(x, y, w, h, r);

    // --- Shine highlight ---
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.18, w * 0.35, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isTruck) {
      drawTruckDetails(x, y, w, h, color, isPlayer);
    } else {
      drawCarDetails(x, y, w, h, color, isPlayer);
    }

    // Player arrow indicator
    if (isPlayer && !isRotated) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      var ax = x + w * 0.84, ay = h * 0.5 + y;
      ctx.beginPath();
      ctx.moveTo(ax, ay - h * 0.09);
      ctx.lineTo(ax + w * 0.05, ay);
      ctx.lineTo(ax, ay + h * 0.09);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCarDetails(x, y, w, h, color, isPlayer) {
    // Windshield (front - right side)
    var wsX = x + w * 0.57, wsW = w * 0.14, wsM = h * 0.17;
    ctx.fillStyle = 'rgba(120,195,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(wsX, y + wsM);
    ctx.lineTo(wsX + wsW, y + wsM * 0.6);
    ctx.lineTo(wsX + wsW, y + h - wsM * 0.6);
    ctx.lineTo(wsX, y + h - wsM);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Rear window
    var rwX = x + w * 0.2, rwW = w * 0.1, rwM = h * 0.22;
    ctx.fillStyle = 'rgba(120,195,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(rwX + rwW, y + rwM);
    ctx.lineTo(rwX, y + rwM * 1.15);
    ctx.lineTo(rwX, y + h - rwM * 1.15);
    ctx.lineTo(rwX + rwW, y + h - rwM);
    ctx.closePath();
    ctx.fill();

    // Side windows
    var sw1 = rwX + rwW + w * 0.02, sw2 = wsX - w * 0.02, swH = h * 0.09;
    ctx.fillStyle = 'rgba(120,195,255,0.32)';
    ctx.fillRect(sw1, y + h * 0.1, sw2 - sw1, swH);
    ctx.fillRect(sw1, y + h * 0.82, sw2 - sw1, swH);

    // Roof outline
    ctx.strokeStyle = darken(color, 10);
    ctx.lineWidth = 0.5;
    rrStroke(x + w * 0.22, y + h * 0.2, w * 0.46, h * 0.6, h * 0.08);

    // Door line
    ctx.strokeStyle = darken(color, 14);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.42, y + h * 0.14);
    ctx.lineTo(x + w * 0.42, y + h * 0.86);
    ctx.stroke();

    // Door handles
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + w * 0.44, y + h * 0.42, w * 0.025, h * 0.06);
    ctx.fillRect(x + w * 0.44, y + h * 0.52, w * 0.025, h * 0.06);

    // Hood line
    ctx.strokeStyle = darken(color, 8);
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.73, y + h * 0.16); ctx.lineTo(x + w * 0.73, y + h * 0.84); ctx.stroke();

    // Headlights
    var hlR = Math.max(2, h * 0.065);
    ctx.fillStyle = 'rgba(255,250,210,0.92)';
    ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.24, hlR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.76, hlR, 0, Math.PI * 2); ctx.fill();

    // Headlight glow for player
    if (isPlayer) {
      ctx.fillStyle = 'rgba(255,250,180,0.22)';
      ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.24, hlR * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.76, hlR * 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Taillights
    var tlR = Math.max(1.5, hlR * 0.7);
    ctx.fillStyle = 'rgba(255,50,50,0.85)';
    ctx.beginPath(); ctx.arc(x + h * 0.14, y + h * 0.24, tlR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + h * 0.14, y + h * 0.76, tlR, 0, Math.PI * 2); ctx.fill();

    // Bumpers
    ctx.fillStyle = darken(color, 22);
    rrFill(x + w - 2.5, y + h * 0.12, 2.5, h * 0.76, 1);
    rrFill(x, y + h * 0.12, 2.5, h * 0.76, 1);

    // Player racing stripes
    if (isPlayer) {
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.06);
      ctx.fillRect(x + w * 0.15, y + h * 0.59, w * 0.7, h * 0.06);
    }

    // Side mirrors
    ctx.fillStyle = darken(color, 15);
    var mx = x + w * 0.38;
    rrFill(mx, y - h * 0.05, w * 0.04, h * 0.07, 1);
    rrFill(mx, y + h * 0.98, w * 0.04, h * 0.07, 1);
  }

  function drawTruckDetails(x, y, w, h, color, isPlayer) {
    // Cab section (front 38%)
    var cabX = x + w * 0.62;
    var cabW = w * 0.36;

    // Cab divider line
    ctx.strokeStyle = darken(color, 18);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + h * 0.08);
    ctx.lineTo(x + w * 0.62, y + h * 0.92);
    ctx.stroke();

    // Cargo panels
    ctx.strokeStyle = darken(color, 10);
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + h * 0.12); ctx.lineTo(x + w * 0.2, y + h * 0.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * 0.4, y + h * 0.12); ctx.lineTo(x + w * 0.4, y + h * 0.88); ctx.stroke();

    // Cargo darker shade
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    rrFill(x + 3, y + h * 0.08, w * 0.58, h * 0.84, h * 0.05);

    // Cab windshield
    var wsM = h * 0.17;
    ctx.fillStyle = 'rgba(120,195,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(cabX + cabW * 0.25, y + wsM);
    ctx.lineTo(cabX + cabW * 0.75, y + wsM * 0.65);
    ctx.lineTo(cabX + cabW * 0.75, y + h - wsM * 0.65);
    ctx.lineTo(cabX + cabW * 0.25, y + h - wsM);
    ctx.closePath();
    ctx.fill();

    // Cab side windows
    ctx.fillStyle = 'rgba(120,195,255,0.3)';
    ctx.fillRect(cabX + cabW * 0.1, y + h * 0.08, cabW * 0.5, h * 0.1);
    ctx.fillRect(cabX + cabW * 0.1, y + h * 0.82, cabW * 0.5, h * 0.1);

    // Headlights
    var hlR = Math.max(2, h * 0.07);
    ctx.fillStyle = 'rgba(255,250,210,0.9)';
    ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.24, hlR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - h * 0.14, y + h * 0.76, hlR, 0, Math.PI * 2); ctx.fill();

    // Taillights
    ctx.fillStyle = 'rgba(255,50,50,0.85)';
    ctx.beginPath(); ctx.arc(x + h * 0.14, y + h * 0.24, hlR * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + h * 0.14, y + h * 0.76, hlR * 0.7, 0, Math.PI * 2); ctx.fill();

    // Bumpers
    ctx.fillStyle = darken(color, 22);
    rrFill(x + w - 2.5, y + h * 0.12, 2.5, h * 0.76, 1);
    rrFill(x, y + h * 0.12, 2.5, h * 0.76, 1);

    // Side mirrors on cab
    ctx.fillStyle = darken(color, 15);
    rrFill(cabX + cabW * 0.15, y - h * 0.05, w * 0.03, h * 0.08, 1);
    rrFill(cabX + cabW * 0.15, y + h * 0.97, w * 0.03, h * 0.08, 1);
  }

  // ---- Confetti ----
  function drawConfetti() {
    for (var i = 0; i < confetti.length; i++) {
      var p = confetti[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
  }

  // ===================== OCCUPANCY =====================
  function buildOcc(exclude) {
    var occ = [];
    for (var r = 0; r < GRID; r++) {
      occ[r] = [];
      for (var c = 0; c < GRID; c++) occ[r][c] = false;
    }
    for (var i = 0; i < cars.length; i++) {
      if (i === exclude) continue;
      var car = cars[i];
      for (var d = 0; d < car.len; d++) {
        if (car.dir === 'h') occ[car.r][car.c + d] = true;
        else occ[car.r + d][car.c] = true;
      }
    }
    return occ;
  }

  function getMoveBounds(idx) {
    var car = cars[idx];
    var occ = buildOcc(idx);

    if (car.dir === 'h') {
      var minC = 0;
      for (var c = car.c - 1; c >= 0; c--) {
        if (occ[car.r][c]) { minC = c + 1; break; }
        if (c === 0) minC = 0;
      }
      var maxC = GRID - car.len;
      for (var c2 = car.c + car.len; c2 < GRID; c2++) {
        if (occ[car.r][c2]) { maxC = c2 - car.len; break; }
      }
      return { min: minC, max: maxC };
    } else {
      var minR = 0;
      for (var r = car.r - 1; r >= 0; r--) {
        if (occ[r][car.c]) { minR = r + 1; break; }
        if (r === 0) minR = 0;
      }
      var maxR = GRID - car.len;
      for (var r2 = car.r + car.len; r2 < GRID; r2++) {
        if (occ[r2][car.c]) { maxR = r2 - car.len; break; }
      }
      return { min: minR, max: maxR };
    }
  }

  // ===================== INPUT =====================
  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function findCarAt(px, py) {
    for (var i = cars.length - 1; i >= 0; i--) {
      var car = cars[i];
      var cx = boardX + car.c * cellSize;
      var cy = boardY + car.r * cellSize;
      var cw = car.dir === 'h' ? car.len * cellSize : cellSize;
      var ch = car.dir === 'v' ? car.len * cellSize : cellSize;
      if (px >= cx && px <= cx + cw && py >= cy && py <= cy + ch) return i;
    }
    return -1;
  }

  function onPointerDown(e) {
    if (animating) return;
    e.preventDefault();
    var pos = getCanvasPos(e);
    var idx = findCarAt(pos.x, pos.y);
    if (idx < 0) return;

    var car = cars[idx];
    var bounds = getMoveBounds(idx);
    dragging = {
      idx: idx,
      startPos: car.dir === 'h' ? car.c : car.r,
      startPx: car.dir === 'h' ? pos.x : pos.y,
      bounds: bounds
    };
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging || animating) return;
    e.preventDefault();
    var pos = getCanvasPos(e);
    var car = cars[dragging.idx];
    var px = car.dir === 'h' ? pos.x : pos.y;
    var delta = px - dragging.startPx;

    var minD = (dragging.bounds.min - dragging.startPos) * cellSize;
    var maxD = (dragging.bounds.max - dragging.startPos) * cellSize;
    car.dd = Math.max(minD, Math.min(maxD, delta));
  }

  function onPointerUp(e) {
    if (!dragging || animating) return;
    e.preventDefault();
    var car = cars[dragging.idx];
    var delta = car.dd || 0;
    var posDelta = Math.round(delta / cellSize);
    var newPos = Math.max(dragging.bounds.min, Math.min(dragging.bounds.max, dragging.startPos + posDelta));

    var moved = false;
    if (car.dir === 'h') {
      if (car.c !== newPos) { car.c = newPos; moved = true; }
    } else {
      if (car.r !== newPos) { car.r = newPos; moved = true; }
    }
    car.dd = 0;

    if (moved) {
      moves++;
      moveLabel.textContent = 'Moves: ' + moves;
    }

    dragging = null;

    // Check auto-exit
    setTimeout(function () { checkAutoExit(); }, 50);
  }

  // ===================== WIN LOGIC =====================
  function checkAutoExit() {
    if (animating) return;
    var player = cars[0];
    if (player.dir !== 'h') return;

    var occ = buildOcc(0);
    for (var c = player.c + player.len; c < GRID; c++) {
      if (occ[player.r][c]) return; // still blocked
    }

    // Path clear — animate exit!
    animating = true;
    var totalDist = (GRID - player.c) * cellSize + cellSize * 2;
    var start = Date.now();
    var dur = 500 + totalDist * 0.4;

    function anim() {
      var t = Math.min(1, (Date.now() - start) / dur);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      player.ed = totalDist * ease;
      render();
      if (t < 1) {
        requestAnimationFrame(anim);
      } else {
        animating = false;
        onWin();
      }
    }
    requestAnimationFrame(anim);
  }

  function onWin() {
    // Update progress
    if (currentLevel >= maxUnlocked) {
      maxUnlocked = Math.min(currentLevel + 1, LEVELS.length - 1);
      saveProgress();
    }

    // Start confetti
    startConfetti();

    // Show overlay
    document.getElementById('winMoves').textContent = moves === 1 ? '1 move!' : moves + ' moves!';
    var nextBtn = document.getElementById('nextLevelBtn');
    if (currentLevel >= LEVELS.length - 1) {
      nextBtn.textContent = '🏆 All Done!';
    } else {
      nextBtn.textContent = 'Next Level ➡️';
    }
    winOverlay.classList.add('active');
  }

  function startConfetti() {
    confetti = [];
    var colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#a855f7', '#f97316'];
    for (var i = 0; i < 55; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * 250 - 20,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3.5 + 1.5,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12
      });
    }
    animConfetti();
  }

  function animConfetti() {
    for (var i = 0; i < confetti.length; i++) {
      var p = confetti[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.vr;
    }
    confetti = confetti.filter(function (p) { return p.y < canvas.height + 60; });
    render();
    if (confetti.length > 0) requestAnimationFrame(animConfetti);
  }

  // ===================== LEVEL MANAGEMENT =====================
  function loadLevel(n) {
    currentLevel = n;
    var lvl = LEVELS[n];
    cars = lvl.cars.map(function (c) {
      return { r: c.r, c: c.c, len: c.len, dir: c.dir, dd: 0, ed: 0 };
    });
    moves = 0;
    dragging = null;
    animating = false;
    confetti = [];

    levelLabel.textContent = 'Level ' + (n + 1);
    moveLabel.textContent = 'Moves: 0';
    hintBar.textContent = lvl.hint;
    hintBar.classList.remove('show');
    winOverlay.classList.remove('active');
  }

  function resetLevel() {
    loadLevel(currentLevel);
  }

  function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
      showGame(currentLevel + 1);
    } else {
      showMenu();
    }
  }

  // ===================== SCREENS =====================
  function showMenu() {
    gameActive = false;
    menuScreen.classList.add('active');
    gameScreen.classList.remove('active');
    winOverlay.classList.remove('active');
    buildMenuGrid();
  }

  function showGame(n) {
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    winOverlay.classList.remove('active');
    loadLevel(n);
    resize();
    gameActive = true;
    requestAnimationFrame(gameLoop);
  }

  function buildMenuGrid() {
    levelGrid.innerHTML = '';
    for (var i = 0; i < LEVELS.length; i++) {
      (function (idx) {
        var btn = document.createElement('button');
        var unlocked = idx <= maxUnlocked;
        btn.className = 'level-btn' + (!unlocked ? ' locked' : '') + (idx < maxUnlocked ? ' completed' : '');

        if (unlocked) {
          var check = idx < maxUnlocked ? ' ✅' : '';
          btn.innerHTML = '<span class="level-num">' + (idx + 1) + check + '</span><span class="level-name">' + LEVELS[idx].name + '</span>';
          btn.addEventListener('click', function () { showGame(idx); });
        } else {
          btn.innerHTML = '<span class="level-num">🔒</span><span class="level-name">Locked</span>';
        }
        levelGrid.appendChild(btn);
      })(i);
    }
  }

  // ===================== GAME LOOP =====================
  function gameLoop() {
    if (!gameActive) return;
    render();
    requestAnimationFrame(gameLoop);
  }

  // ===================== PERSISTENCE =====================
  function saveProgress() {
    try { localStorage.setItem('parkingPuzzleMax', maxUnlocked.toString()); } catch (e) { }
  }
  function loadProgress() {
    try { var v = localStorage.getItem('parkingPuzzleMax'); if (v) maxUnlocked = parseInt(v) || 0; } catch (e) { }
  }

  // ===================== INIT =====================
  function init() {
    loadProgress();
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    document.getElementById('backBtn').addEventListener('click', showMenu);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('hintBtn').addEventListener('click', function () {
      hintBar.classList.toggle('show');
    });
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('menuBtn').addEventListener('click', showMenu);

    window.addEventListener('resize', function () {
      if (gameActive) resize();
    });

    showMenu();
  }

  init();
})();
