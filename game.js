const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
});

// Starfield
const stars = [];

for (let i = 0; i < 200; i++) {
    stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 1.5 + 0.5
    });
}

// Player
const player = {
    x: W / 2,
    y: H - 60,
    w: 36,
    h: 24,
    speed: 320,
    cooldown: 0.15
};

const bullets = [];
const enemies = [];
const enemyBullets = [];

// Input
const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Mobile touch control
let touchX = null;

canvas.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', e => {
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchend', () => {
    touchX = null;
});

// Audio
let audioCtx = null;

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function beep(freq = 440, dur = 0.06) {
    ensureAudio();

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.03;

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    o.stop(audioCtx.currentTime + dur);
}

// Game state
let running = false;
let score = 0;
let lives = 5;
let level = 1;

const scoreHud = document.getElementById('scoreHud');
const livesHud = document.getElementById('livesHud');
const loginOverlay = document.getElementById('loginOverlay');

// Utils
function rand(a, b) {
    return a + Math.random() * (b - a);
}

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

function rectsCollide(a, b) {
    return !(
        a.x - a.w / 2 > b.x + b.w / 2 ||
        a.x + a.w / 2 < b.x - b.w / 2 ||
        a.y - a.h / 2 > b.y + b.h / 2 ||
        a.y + a.h / 2 < b.y - b.h / 2
    );
}

function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Spawn enemies continuously
function spawnWave(lvl) {
    const count = Math.min(6 + lvl * 2, 26);

    for (let i = 0; i < count; i++) {
        const ex = rand(60, W - 60);
        const ey = rand(-220, -40) - i * 30;

        enemies.push({
            x: ex,
            y: ey,
            w: 30,
            h: 22,
            spd: rand(30, 60) + lvl * 6,
            health: 1 + Math.floor(lvl / 3),
            t: Math.random() * 100
        });
    }
}

function resetGame() {
    score = 0;
    lives = 5;
    level = 1;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;

    spawnWave(level);
}

// Starfield
function updateStars(dt) {
    for (const s of stars) {
        s.y += 50 * dt * s.z;
        if (s.y > H) s.y = 0;
    }
}

function renderStars() {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
        ctx.globalAlpha = 0.9 * s.z;
        ctx.fillStyle = '#aef';
        ctx.fillRect(
            s.x,
            s.y,
            Math.max(1, s.z * 1.5),
            Math.max(1, s.z * 1.5)
        );
    }

    ctx.globalAlpha = 1;
}

// Enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        e.t += dt;
        e.y += e.spd * dt;
        e.x += Math.sin(e.t * 2 + i) * 12 * dt * 60;

        if (Math.random() < 0.006 + level * 0.001) {
            enemyBullets.push({
                x: e.x,
                y: e.y + e.h / 2,
                spd: 160 + level * 10
            });
        }

        if (e.y > H + 60) {
            enemies.splice(i, 1);
        }
    }

    if (enemies.length < Math.min(6 + level * 2, 26)) {
        spawnWave(level);
    }
}

// Game loop
let last = performance.now();

function gameLoop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    updateStars(dt);

    if (running) {
        // Auto shooting
        player.cooldown -= dt;

        if (player.cooldown <= 0) {
            bullets.push({
                x: player.x,
                y: player.y - 12,
                spd: 520,
                w: 6,
                h: 12
            });

            player.cooldown = 0.15;
            beep(900, 0.02);
        }

        // Player movement
        if (keys['arrowleft'] || keys['a']) {
            player.x -= player.speed * dt;
        }

        if (keys['arrowright'] || keys['d']) {
            player.x += player.speed * dt;
        }

        if (touchX !== null) {
            player.x += (touchX - player.x) * 0.2;
        }

        player.x = clamp(player.x, 24, W - 24);

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.y -= b.spd * dt;
            if (b.y < -20) bullets.splice(i, 1);
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.y += b.spd * dt;
            if (b.y > H + 20) enemyBullets.splice(i, 1);
        }

        updateEnemies(dt);

        // Collisions
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            for (let j = bullets.length - 1; j >= 0; j--) {
                const b = bullets[j];

                if (
                    rectsCollide(
                        { x: e.x, y: e.y, w: e.w, h: e.h },
                        { x: b.x, y: b.y, w: b.w, h: b.h }
                    )
                ) {
                    bullets.splice(j, 1);
                    e.health--;
                    score += 10;
                    beep(1200, 0.02);

                    if (e.health <= 0) {
                        enemies.splice(i, 1);
                        score += 20;
                        beep(500, 0.05);
                    }
                    break;
                }
            }
        }

        // === Level-up check based on score (added) ===
        // Increase level when player crosses score thresholds and spawn a new wave
        {
            const computedLevel = Math.floor(score / 400) + 1;
            if (computedLevel > level) {
                level = computedLevel;
                spawnWave(level);
            }
        }
        // === end of added level-up logic ===

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];

            if (
                rectsCollide(
                    { x: player.x, y: player.y, w: player.w, h: player.h },
                    { x: b.x, y: b.y, w: 8, h: 12 }
                )
            ) {
                enemyBullets.splice(i, 1);
                lives--;
                beep(120, 0.08);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            if (
                rectsCollide(
                    { x: player.x, y: player.y, w: player.w, h: player.h },
                    { x: e.x, y: e.y, w: e.w, h: e.h }
                )
            ) {
                enemies.splice(i, 1);
                lives--;
                beep(200, 0.09);
            }
        }

        if (lives <= 0) {
            running = false;
            showGameOver();
        }
    }

    scoreHud.textContent = 'Score: ' + Math.floor(score);
    livesHud.textContent = '❤️'.repeat(lives);

    render();
    requestAnimationFrame(gameLoop);
}

// Render everything
function render() {
    renderStars();

    // Enemies
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        ctx.fillStyle = '#f44';
        roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 6);
        ctx.fill();

        ctx.fillStyle = '#220';
        ctx.fillRect(-e.w / 4, -4, 6, 4);
        ctx.fillRect(e.w / 8, -4, 6, 4);

        ctx.restore();
    }

    // Enemy bullets
    for (const b of enemyBullets) {
        ctx.fillStyle = '#f66';
        roundRect(ctx, b.x - 4, b.y - 6, 8, 12, 3);
        ctx.fill();
    }

    // Player
    drawPlayer(player);

    // Player bullets
    for (const b of bullets) {
        ctx.fillStyle = '#9ff';
        roundRect(ctx, b.x - 3, b.y - 10, 6, 12, 3);
        ctx.fill();
    }
}

// Draw player ship
function drawPlayer(p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.beginPath();
    ctx.moveTo(0, -p.h / 2);
    ctx.lineTo(-p.w / 2, p.h / 2);
    ctx.lineTo(p.w / 2, p.h / 2);
    ctx.closePath();

    ctx.fillStyle = '#7ff';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#114';
    ctx.fill();

    ctx.restore();
}

// Start game
function startGame() {
    loginOverlay.style.display = 'none';
    scoreHud.style.display = 'block';
    livesHud.style.display = 'block';

    resetGame();

    player.x = W / 2;
    player.y = H - 60;

    running = true;
    last = performance.now();

    requestAnimationFrame(gameLoop);
}

// Game over
function showGameOver() {
    loginOverlay.style.display = 'flex';
    loginOverlay.innerHTML = `
        <div class="loginBox">
            <h2>Game Over</h2>
            <p>Score: ${Math.floor(score)}</p>
            <button onclick="location.reload()">Restart</button>
        </div>
    `;
}

// Start button and Enter key
document.getElementById('startBtn').addEventListener('click', startGame);

document.getElementById('playerName').addEventListener('keypress', e => {
    if (e.key === 'Enter') startGame();
});

// Always render stars in background
function startStarfield() {
    last = performance.now();
    requestAnimationFrame(gameLoop);
}

startStarfield();