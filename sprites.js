// sprites.js - Génération dynamique des graphismes du jeu
const Sprites = {};

function createTextureCanvas(w, h, renderFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    renderFn(ctx, w, h);
    const img = new Image();
    img.src = c.toDataURL();
    return img;
}

// 1. Soldat Bleu (Joueur) - Vu du dessus avec casque et arme
Sprites.player = createTextureCanvas(32, 32, (ctx, w, h) => {
    // Épaules / Corps
    ctx.fillStyle = '#0288D1';
    ctx.beginPath();
    ctx.ellipse(16, 18, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bras / Fusil
    ctx.fillStyle = '#37474F';
    ctx.fillRect(20, 4, 4, 16);
    // Casque
    ctx.fillStyle = '#03A9F4';
    ctx.beginPath();
    ctx.arc(16, 16, 7, 0, Math.PI * 2);
    ctx.fill();
    // Visière
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.arc(16, 14, 4, 0, Math.PI, true);
    ctx.fill();
});

// 2. Ennemi Rouge - Vu du dessus
Sprites.enemy = createTextureCanvas(32, 32, (ctx, w, h) => {
    // Épaules
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.ellipse(16, 18, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arme sombre
    ctx.fillStyle = '#212121';
    ctx.fillRect(8, 6, 4, 14);
    // Casque/Tête
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.arc(16, 16, 7, 0, Math.PI * 2);
    ctx.fill();
    // Yeux luminescents
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(13, 12, 2, 2);
    ctx.fillRect(17, 12, 2, 2);
});

// 3. Caisse en Bois (Obstacle)
Sprites.obstacle = createTextureCanvas(120, 60, (ctx, w, h) => {
    // Fond bois
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(0, 0, w, h);
    // Lattes de bois
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    for (let i = 10; i < h; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(w, i);
        ctx.stroke();
    }
    // Renforts métalliques
    ctx.fillStyle = '#424242';
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h - 6, w, 6);
    ctx.fillRect(0, 0, 8, h);
    ctx.fillRect(w - 8, 0, 8, h);
    // Bords / Relief
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);
});

// 4. Super Bonus Gatling
Sprites.gatling = createTextureCanvas(40, 40, (ctx, w, h) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Icône canon
    ctx.fillStyle = '#212121';
    ctx.fillRect(14, 8, 4, 16);
    ctx.fillRect(22, 8, 4, 16);
    ctx.fillRect(18, 6, 4, 18);
});