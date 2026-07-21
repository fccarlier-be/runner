const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const unitCountEl = document.getElementById('unitCount');
const gatlingStatusEl = document.getElementById('gatlingStatus');

const width = Math.min(window.innerWidth, 400);
const height = Math.min(window.innerHeight, 700);
canvas.width = width;
canvas.height = height;

// --- 1. CHARGEMENT DE LA SPRITESHEET UNIQUE ---
const spriteSheet = new Image();
spriteSheet.src = 'assets/assets_demo.png'; // Nom du fichier dans ton dossier assets/

// Découpe précise des 4 zones sur ton image (coordonnées normalisées)
// On utilise des pourcentages pour s'adapter parfaitement à la résolution de l'image
let isLoaded = false;
spriteSheet.onload = () => { isLoaded = true; };

function drawSprite(key, dx, dy, dw, dh) {
    if (!isLoaded) return;

    const sw = spriteSheet.naturalWidth;
    const sh = spriteSheet.naturalHeight;

    // Zones estimées selon la disposition de ta planche
    const REGIONS = {
        player:   { x: 0.05, y: 0.05, w: 0.35, h: 0.40 },
        enemy:    { x: 0.40, y: 0.05, w: 0.35, h: 0.40 },
        gatling:  { x: 0.20, y: 0.50, w: 0.30, h: 0.45 },
        obstacle: { x: 0.55, y: 0.50, w: 0.25, h: 0.45 }
    };

    const r = REGIONS[key];
    ctx.drawImage(
        spriteSheet,
        r.x * sw, r.y * sh, r.w * sw, r.h * sh, // Source (découpe sur l'image d'origine)
        dx, dy, dw, dh                          // Destination (affichage sur le canvas)
    );
}

// --- 2. ÉTAT DU JEU ---
let crowdCenter = { x: width / 2, y: height - 120 };
let units = [];
let gameOver = false;
let superBonusTimer = 0;
let lastShoot = 0;
let bullets = [];
let elements = [];

function createUnit(ox = 0, oy = 0) {
    return { x: crowdCenter.x + ox, y: crowdCenter.y + oy, targetOx: ox, targetOy: oy };
}

function rearrangeCrowd() {
    const spacing = 18;
    units.forEach((u, i) => {
        if (i === 0) { u.targetOx = 0; u.targetOy = 0; }
        else {
            const angle = i * 0.8;
            const r = Math.sqrt(i) * spacing;
            u.targetOx = Math.cos(angle) * r;
            u.targetOy = Math.sin(angle) * r;
        }
    });
}

function addUnits(amt) {
    for (let i = 0; i < amt; i++) units.push(createUnit((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20));
    rearrangeCrowd();
}

units.push(createUnit(0, 0));

function spawnWave(y) {
    const laneW = width / 2;
    elements.push({ type: 'bonus', x: laneW / 2, y: y, r: 20 });
    elements.push({ type: 'gate', x: laneW + 10, y: y + 80, w: laneW - 20, h: 45, val: 8 });
    elements.push({ type: 'obstacle', x: laneW + 15, y: y + 200, w: laneW - 30, h: 60, hp: 40 });

    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 4; c++) {
            elements.push({ type: 'enemy', x: laneW + 25 + c * 30, y: y + 320 + r * 30, r: 14 });
        }
    }
}

spawnWave(-100); spawnWave(-700); spawnWave(-1300);

// --- 3. CONTRÔLES ---
let isDown = false, lastX = 0;
const onStart = e => { isDown = true; lastX = e.touches ? e.touches[0].clientX : e.clientX; if (gameOver) resetGame(); };
const onMove = e => {
    if (!isDown || gameOver) return;
    const curX = e.touches ? e.touches[0].clientX : e.clientX;
    crowdCenter.x = Math.max(30, Math.min(width - 30, crowdCenter.x + (curX - lastX)));
    lastX = curX;
};
const onEnd = () => isDown = false;

canvas.addEventListener('mousedown', onStart); canvas.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
canvas.addEventListener('touchstart', onStart); canvas.addEventListener('touchmove', onMove); canvas.addEventListener('touchend', onEnd);

function resetGame() {
    crowdCenter = { x: width / 2, y: height - 120 };
    units = [createUnit(0, 0)]; superBonusTimer = 0; bullets = []; elements = []; gameOver = false;
    spawnWave(-100); spawnWave(-700); spawnWave(-1300);
}

// --- 4. BOUCLE PRINCIPALE ---
function loop(now) {
    if (!gameOver) { update(now); render(); } else renderGameOver();
    requestAnimationFrame(loop);
}

function update(now) {
    if (superBonusTimer > 0) {
        superBonusTimer--;
        gatlingStatusEl.textContent = "ON 🔥"; gatlingStatusEl.style.color = "#FFD700";
    } else {
        gatlingStatusEl.textContent = "OFF"; gatlingStatusEl.style.color = "#FFF";
    }

    units.forEach(u => {
        u.x += (crowdCenter.x + u.targetOx - u.x) * 0.2;
        u.y += (crowdCenter.y + u.targetOy - u.y) * 0.2;
    });

    const fireRate = superBonusTimer > 0 ? 60 : 160;
    if (now - lastShoot > fireRate) {
        units.slice(0, 15).forEach(u => {
            bullets.push({ x: u.x, y: u.y - 15, vy: superBonusTimer > 0 ? -14 : -10, dmg: superBonusTimer > 0 ? 3 : 1 });
        });
        lastShoot = now;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.y += b.vy;
        for (let j = elements.length - 1; j >= 0; j--) {
            let el = elements[j];
            if (el.type === 'obstacle' && b.x > el.x && b.x < el.x + el.w && b.y > el.y && b.y < el.y + el.h) {
                el.hp -= b.dmg; bullets.splice(i, 1);
                if (el.hp <= 0) elements.splice(j, 1);
                break;
            } else if (el.type === 'enemy' && Math.hypot(b.x - el.x, b.y - el.y) < el.r + 6) {
                elements.splice(j, 1); bullets.splice(i, 1); break;
            }
        }
        if (b && b.y < 0) bullets.splice(i, 1);
    }

    for (let i = elements.length - 1; i >= 0; i--) {
        let el = elements[i]; el.y += 2.2;

        if (el.type === 'bonus' && Math.hypot(crowdCenter.x - el.x, crowdCenter.y - el.y) < el.r + 20) {
            superBonusTimer = 400; elements.splice(i, 1); continue;
        }
        if (el.type === 'gate' && crowdCenter.y < el.y + el.h && crowdCenter.y > el.y && Math.abs(crowdCenter.x - (el.x + el.w / 2)) < el.w / 2) {
            addUnits(el.val); elements.splice(i, 1); continue;
        }
        if (el.type === 'obstacle' && crowdCenter.x > el.x - 10 && crowdCenter.x < el.x + el.w + 10 && crowdCenter.y > el.y && crowdCenter.y < el.y + el.h) {
            gameOver = true;
        }
        if (el.type === 'enemy') {
            for (let uIdx = units.length - 1; uIdx >= 0; uIdx--) {
                if (Math.hypot(units[uIdx].x - el.x, units[uIdx].y - el.y) < 16 + el.r) {
                    units.splice(uIdx, 1); elements.splice(i, 1); rearrangeCrowd();
                    if (units.length === 0) gameOver = true;
                    break;
                }
            }
        }
        if (el.y > height + 100) elements.splice(i, 1);
    }
    unitCountEl.textContent = units.length;
}

// --- 5. RENDU GRAPHIQUE ---
function render() {
    ctx.clearRect(0, 0, width, height);

    // Ligne centrale
    ctx.strokeStyle = '#2A2A35'; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); ctx.setLineDash([]);

    // Dessin des éléments
    elements.forEach(el => {
        if (el.type === 'bonus') {
            drawSprite('gatling', el.x - 22, el.y - 22, 44, 44);
        } else if (el.type === 'gate') {
            ctx.fillStyle = 'rgba(0, 230, 118, 0.25)'; ctx.fillRect(el.x, el.y, el.w, el.h);
            ctx.strokeStyle = '#00E676'; ctx.lineWidth = 2; ctx.strokeRect(el.x, el.y, el.w, el.h);
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`+${el.val} Soldats`, el.x + el.w / 2, el.y + 28);
        } else if (el.type === 'obstacle') {
            drawSprite('obstacle', el.x, el.y, el.w, el.h);
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(el.hp, el.x + el.w / 2, el.y + el.h / 2 + 7);
        } else if (el.type === 'enemy') {
            drawSprite('enemy', el.x - 16, el.y - 16, 32, 32);
        }
    });

    // Tirs
    ctx.fillStyle = superBonusTimer > 0 ? '#FFD700' : '#00E5FF';
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); });

    // Joueurs
    units.forEach(u => {
        drawSprite('player', u.x - 16, u.y - 16, 32, 32);
    });
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText("GAME OVER", width / 2, height / 2 - 20);
    ctx.font = '16px sans-serif'; ctx.fillText("Touche pour rejouer", width / 2, height / 2 + 20);
}

requestAnimationFrame(loop);