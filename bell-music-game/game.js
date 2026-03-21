// Bell Music Game - Toddler-friendly musical bell ordering game
// Bells reorder in-place by dragging within the same container.
(function () {
    'use strict';

    // ── Audio Context (lazy init on first interaction) ──
    let audioCtx = null;

    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // ── Bell definitions ──
    const BELLS = [
        { note: 'C',  freq: 261.63, color: '#ef4444', darkColor: '#b91c1c', label: 'Do'  },
        { note: 'D',  freq: 293.66, color: '#f97316', darkColor: '#c2410c', label: 'Re'  },
        { note: 'E',  freq: 329.63, color: '#eab308', darkColor: '#a16207', label: 'Mi'  },
        { note: 'F',  freq: 349.23, color: '#22c55e', darkColor: '#15803d', label: 'Fa'  },
        { note: 'G',  freq: 392.00, color: '#06b6d4', darkColor: '#0e7490', label: 'Sol' },
        { note: 'A',  freq: 440.00, color: '#3b82f6', darkColor: '#1d4ed8', label: 'La'  },
        { note: 'B',  freq: 493.88, color: '#8b5cf6', darkColor: '#6d28d9', label: 'Ti'  },
        { note: 'C5', freq: 523.25, color: '#ec4899', darkColor: '#be185d', label: 'Do!' },
    ];

    const NOTE_SYMBOLS = ['🎵', '🎶', '♪', '♫', '✨'];
    const DRAG_THRESHOLD = 8; // px movement before we consider it a drag

    // ── State ──
    let bellElements = []; // DOM elements in current visual order
    let gameWon = false;
    let dragInfo = null;

    // ── DOM refs ──
    const playground = document.getElementById('bell-playground');
    const statusBar = document.getElementById('status-bar');
    const celebration = document.getElementById('celebration');

    // ── Synthesize a bell-like tone ──
    function playBellTone(freq, duration) {
        duration = duration || 1.2;
        ensureAudio();
        const now = audioCtx.currentTime;

        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = freq;

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2.76;

        const osc3 = audioCtx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = freq * 5.4;

        const gain1 = audioCtx.createGain();
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

        const gain2 = audioCtx.createGain();
        gain2.gain.setValueAtTime(0.12, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

        const gain3 = audioCtx.createGain();
        gain3.gain.setValueAtTime(0.05, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);

        const master = audioCtx.createGain();
        master.gain.value = 0.6;

        osc1.connect(gain1).connect(master);
        osc2.connect(gain2).connect(master);
        osc3.connect(gain3).connect(master);
        master.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);
    }

    // ── Spawn floating note particle ──
    function spawnNoteParticle(bellEl) {
        const rect = bellEl.getBoundingClientRect();
        const particle = document.createElement('div');
        particle.className = 'note-particle';
        particle.textContent = NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)];
        particle.style.left = (rect.left + rect.width / 2 - 14 + (Math.random() - 0.5) * 40) + 'px';
        particle.style.top = (rect.top + 10) + 'px';
        document.body.appendChild(particle);
        setTimeout(function () { particle.remove(); }, 1300);
    }

    function ringBell(el, bellIdx) {
        playBellTone(BELLS[bellIdx].freq, 0.8);
        el.classList.remove('ringing');
        void el.offsetWidth;
        el.classList.add('ringing');
        spawnNoteParticle(el);
    }

    // ── Play the full scale using current DOM order ──
    function playScaleInOrder(callback) {
        // Always play in correct order (0-7)
        BELLS.forEach(function (bell, i) {
            setTimeout(function () {
                playBellTone(bell.freq, 0.8);
                // Find the element for this bell index
                var el = playground.querySelector('.bell[data-bell-idx="' + i + '"]');
                if (el) {
                    el.classList.remove('ringing');
                    void el.offsetWidth;
                    el.classList.add('ringing');
                    spawnNoteParticle(el);
                }
                if (i === BELLS.length - 1 && callback) {
                    setTimeout(callback, 600);
                }
            }, i * 350);
        });
    }

    // ── Confetti ──
    function launchConfetti() {
        var colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
        for (var i = 0; i < 80; i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (2 + Math.random() * 3) + 's';
            piece.style.animationDelay = (Math.random() * 1.5) + 's';
            piece.style.width = (8 + Math.random() * 10) + 'px';
            piece.style.height = (8 + Math.random() * 10) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
            document.body.appendChild(piece);
            (function (p) { setTimeout(function () { p.remove(); }, 6000); })(piece);
        }
    }

    // ── Create a bell DOM element ──
    function createBellElement(bellIdx) {
        var bell = BELLS[bellIdx];
        var el = document.createElement('div');
        el.className = 'bell';
        el.dataset.bellIdx = bellIdx;

        el.innerHTML =
            '<div class="bell-handle" style="border-color: ' + bell.darkColor + '"></div>' +
            '<div class="bell-body" style="background: linear-gradient(135deg, ' + bell.color + ', ' + bell.darkColor + ')">' +
                '<span class="bell-note">' + bell.label + '</span>' +
                '<div class="bell-clapper"></div>' +
            '</div>';

        // Pointer events for drag + click
        el.addEventListener('mousedown', function (e) { onPointerDown(e, bellIdx, el); });
        el.addEventListener('touchstart', function (e) { onPointerDown(e, bellIdx, el); }, { passive: false });

        return el;
    }

    // ── Pointer handling: distinguish click vs drag ──
    function onPointerDown(e, bellIdx, el) {
        if (gameWon) return;
        e.preventDefault();
        ensureAudio();

        var touch = e.touches ? e.touches[0] : e;
        var startX = touch.clientX;
        var startY = touch.clientY;
        var rect = el.getBoundingClientRect();
        var offsetX = touch.clientX - rect.left;
        var offsetY = touch.clientY - rect.top;
        var isDragging = false;
        var clone = null;

        dragInfo = { bellIdx: bellIdx, el: el };

        function onMove(ev) {
            ev.preventDefault();
            var t = ev.touches ? ev.touches[0] : ev;
            var dx = t.clientX - startX;
            var dy = t.clientY - startY;

            if (!isDragging) {
                if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
                // Start dragging
                isDragging = true;
                ringBell(el, bellIdx);
                clone = el.cloneNode(true);
                clone.classList.add('dragging');
                clone.style.position = 'fixed';
                clone.style.pointerEvents = 'none';
                clone.style.width = el.offsetWidth + 'px';
                clone.style.transition = 'none';
                clone.style.zIndex = '9000';
                document.body.appendChild(clone);
                el.classList.add('drag-placeholder');
            }

            clone.style.left = (t.clientX - offsetX) + 'px';
            clone.style.top = (t.clientY - offsetY) + 'px';

            // Determine drop position among siblings
            updateDropPosition(t.clientX, t.clientY, el);
        }

        function onUp(ev) {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);

            if (clone) clone.remove();
            el.classList.remove('drag-placeholder');
            clearDropIndicators();

            if (!isDragging) {
                // It was a click/tap — just play the sound
                ringBell(el, bellIdx);
            } else {
                // Finalize drop
                var t = ev.changedTouches ? ev.changedTouches[0] : ev;
                finalizeReorder(t.clientX, t.clientY, el);
                updateCorrectHighlights();
                updateStatus();
                checkWin();
            }

            dragInfo = null;
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    }

    // ── Determine where to insert the dragged bell ──
    function updateDropPosition(cx, cy, draggedEl) {
        clearDropIndicators();
        var children = Array.prototype.slice.call(playground.children);
        var inserted = false;

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child === draggedEl) continue;
            if (child.classList.contains('drop-indicator')) continue;
            var r = child.getBoundingClientRect();
            var midX = r.left + r.width / 2;
            if (cx < midX) {
                child.classList.add('insert-before');
                inserted = true;
                break;
            }
        }
        // If not inserted before any, it goes at end — mark last non-dragged
        if (!inserted) {
            var lastChild = null;
            for (var j = children.length - 1; j >= 0; j--) {
                if (children[j] !== draggedEl) { lastChild = children[j]; break; }
            }
            if (lastChild) lastChild.classList.add('insert-after');
        }
    }

    function clearDropIndicators() {
        var all = playground.querySelectorAll('.insert-before, .insert-after');
        for (var i = 0; i < all.length; i++) {
            all[i].classList.remove('insert-before', 'insert-after');
        }
    }

    function finalizeReorder(cx, cy, draggedEl) {
        var children = Array.prototype.slice.call(playground.children);
        var targetBefore = null;

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child === draggedEl) continue;
            var r = child.getBoundingClientRect();
            var midX = r.left + r.width / 2;
            if (cx < midX) {
                targetBefore = child;
                break;
            }
        }

        // Move the element
        if (targetBefore) {
            playground.insertBefore(draggedEl, targetBefore);
        } else {
            playground.appendChild(draggedEl);
        }
    }

    // ── Check correct positions & highlight ──
    function updateCorrectHighlights() {
        var children = playground.querySelectorAll('.bell');
        for (var i = 0; i < children.length; i++) {
            var idx = parseInt(children[i].dataset.bellIdx);
            if (idx === i) {
                children[i].classList.add('correct-pos');
            } else {
                children[i].classList.remove('correct-pos');
            }
        }
    }

    // ── Get current order ──
    function getCurrentOrder() {
        var children = playground.querySelectorAll('.bell');
        var order = [];
        for (var i = 0; i < children.length; i++) {
            order.push(parseInt(children[i].dataset.bellIdx));
        }
        return order;
    }

    // ── Status updates ──
    function updateStatus() {
        var order = getCurrentOrder();
        var correct = 0;
        for (var i = 0; i < order.length; i++) {
            if (order[i] === i) correct++;
        }
        if (correct === BELLS.length) {
            statusBar.textContent = '🎉 Perfect! You put all the bells in order! 🎉';
        } else if (correct === 0) {
            statusBar.textContent = '🔔 Tap a bell to hear it! Drag to reorder — low to high!';
        } else {
            statusBar.textContent = '🎶 ' + correct + ' of ' + BELLS.length + ' bells in the right spot! Keep going!';
        }
    }

    // ── Check win ──
    function checkWin() {
        if (gameWon) return;
        var order = getCurrentOrder();
        for (var i = 0; i < BELLS.length; i++) {
            if (order[i] !== i) return;
        }
        gameWon = true;
        statusBar.textContent = '🎉 Perfect! You played the whole scale! 🎉';

        setTimeout(function () {
            playScaleInOrder(function () {
                celebration.classList.add('active');
                launchConfetti();
            });
        }, 400);
    }

    // ── Fisher-Yates shuffle ──
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    // ── Initialize game ──
    function initGame() {
        gameWon = false;
        bellElements = [];
        playground.innerHTML = '';
        celebration.classList.remove('active');

        // Create bells in shuffled order
        var indices = [];
        for (var i = 0; i < BELLS.length; i++) indices.push(i);
        shuffle(indices);

        for (var j = 0; j < indices.length; j++) {
            var bellEl = createBellElement(indices[j]);
            playground.appendChild(bellEl);
            bellElements.push(bellEl);
        }

        updateCorrectHighlights();
        updateStatus();
    }

    // ── Button: Listen to the Scale ──
    document.getElementById('btn-listen').addEventListener('click', function () {
        ensureAudio();
        playScaleInOrder();
    });

    // ── Celebration buttons ──
    document.getElementById('btn-play-again').addEventListener('click', function () {
        initGame();
    });

    document.getElementById('btn-play-scale').addEventListener('click', function () {
        playScaleInOrder();
    });

    // ── Start ──
    initGame();
})();
