function clampCount(input) {
    let val = parseInt(input.value);
    if (isNaN(val) || val < 2) val = 2;
    if (val > 30) val = 30;
    input.value = val;
}

function adjustCount(delta) {
    const input = document.getElementById('count');
    const val = parseInt(input.value) + delta;
    input.value = val;
    clampCount(input);
}

// Round-robin scheduling algorithm
// For n participants (padded to even), each round pairs:
//   participant[0] with participant[n-1], [1] with [n-2], etc.
// Then rotate all except the first position.
function buildSchedule(n) {
    const isOdd = n % 2 !== 0;
    const total = isOdd ? n + 1 : n;
    const participants = [];
    for (let i = 1; i <= total; i++) {
        participants.push(i);
    }

    const rounds = [];
    const numRounds = total - 1;

    const fixed = participants[0];
    const rotating = participants.slice(1);

    // Track how many times each person has been in a triple (for even distribution)
    const tripleCount = {};
    for (let i = 1; i <= n; i++) tripleCount[i] = 0;

    for (let r = 0; r < numRounds; r++) {
        const current = [fixed, ...rotating];
        const groups = []; // each group is [a, b] or [a, b, c]
        let lonePlayer = null;

        for (let i = 0; i < total / 2; i++) {
            const a = current[i];
            const b = current[total - 1 - i];
            if (isOdd && (a === total || b === total)) {
                // The real player paired with the phantom is the "lone" one
                lonePlayer = a === total ? b : a;
                continue;
            }
            groups.push([a, b]);
        }

        // If odd: attach the lone player to the pair where they'd least increase imbalance
        if (isOdd && lonePlayer !== null) {
            let bestIdx = 0;
            let bestScore = Infinity;
            for (let i = 0; i < groups.length; i++) {
                const [a, b] = groups[i];
                const score = tripleCount[a] + tripleCount[b] + tripleCount[lonePlayer];
                if (score < bestScore) {
                    bestScore = score;
                    bestIdx = i;
                }
            }
            const [a, b] = groups[bestIdx];
            tripleCount[a]++;
            tripleCount[b]++;
            tripleCount[lonePlayer]++;
            groups[bestIdx] = [a, b, lonePlayer];
        }

        rounds.push(groups);
        rotating.unshift(rotating.pop());
    }

    return rounds;
}

let currentRound = 0;
let totalRounds = 0;

function slideRound(delta) {
    const next = currentRound + delta;
    if (next < 0 || next >= totalRounds) return;
    currentRound = next;
    updateSlider();
}

function goToRound(idx) {
    currentRound = idx;
    updateSlider();
}

function updateSlider() {
    const slides = document.getElementById('rounds');
    slides.style.transform = `translateX(-${currentRound * 100}%)`;

    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentRound);
    });
}

function initSwipe() {
    const track = document.getElementById('slider-track');
    let startX = 0;
    let startY = 0;
    let dragging = false;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = true;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        if (!dragging) return;
        dragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            slideRound(dx < 0 ? 1 : -1);
        }
    }, { passive: true });
}

function generate() {
    const n = parseInt(document.getElementById('count').value);
    if (n < 2 || n > 30) return;

    // Show ticket range
    document.getElementById('ticket-range').textContent = `1 — ${n}`;

    // Build and show schedule
    const rounds = buildSchedule(n);
    const roundsContainer = document.getElementById('rounds');
    roundsContainer.innerHTML = '';

    rounds.forEach((pairs, idx) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';

        const header = document.createElement('div');
        header.className = 'round-header';
        header.textContent = `Раунд ${idx + 1}`;
        roundDiv.appendChild(header);

        const pairsDiv = document.createElement('div');
        pairsDiv.className = 'pairs';

        pairs.forEach((group) => {
            const groupEl = document.createElement('div');
            groupEl.className = group.length === 3 ? 'pair triple' : 'pair';
            const nums = group.map(p => `<span class="pair-num">${p}</span>`);
            groupEl.innerHTML = nums.join('<span class="pair-separator">&harr;</span>');
            pairsDiv.appendChild(groupEl);
        });

        roundDiv.appendChild(pairsDiv);
        roundsContainer.appendChild(roundDiv);
    });

    // Dots
    const dotsContainer = document.getElementById('slider-dots');
    dotsContainer.innerHTML = '';
    rounds.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
        dot.onclick = () => goToRound(idx);
        dotsContainer.appendChild(dot);
    });

    // Init slider
    currentRound = 0;
    totalRounds = rounds.length;
    updateSlider();
    initSwipe();

    // Show sections
    document.getElementById('tickets').classList.remove('hidden');
    document.getElementById('schedule').classList.remove('hidden');
    document.getElementById('actions').classList.remove('hidden');

    // Scroll to tickets
    document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
}

function reset() {
    document.getElementById('tickets').classList.add('hidden');
    document.getElementById('schedule').classList.add('hidden');
    document.getElementById('actions').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
