// Where it begins. Loaded last, so everything before it is ready.

// A placeholder until there's a game: one line that proves the live URL serves
// the real page, frame and scripts. Delete it, and STROKES, when gameplay lands.
const PLACEHOLDER = 'UNDER CONSTRUCTION';
const PLACEHOLDER_UNIT = 5;        // one grid step of a letter, in frame units
const PLACEHOLDER_INK = '#8a8a80';

// Letters as polylines on a 4 x 6 grid. Drawn by hand rather than with
// fillText, because every font has to ship with the page and this line isn't
// worth a font file.
const STROKES = {
    U: [[[0, 0], [0, 6], [4, 6], [4, 0]]],
    N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
    D: [[[0, 0], [0, 6], [2, 6], [4, 4], [4, 2], [2, 0], [0, 0]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    R: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]], [[2, 3], [4, 6]]],
    C: [[[4, 0], [0, 0], [0, 6], [4, 6]]],
    O: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]]],
    S: [[[4, 0], [0, 0], [0, 3], [4, 3], [4, 6], [0, 6]]],
    T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
};

function drawPlaceholder() {
    const u = PLACEHOLDER_UNIT;
    const advance = 6 * u;            // a 4-wide letter plus 2 of space
    const width = PLACEHOLDER.length * advance - 2 * u;
    const x0 = (LW - width) / 2, y0 = (LH - 6 * u) / 2;

    ctx.strokeStyle = PLACEHOLDER_INK;
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    [...PLACEHOLDER].forEach((ch, i) => {
        for (const line of STROKES[ch] || []) {
            line.forEach(([gx, gy], j) => {
                const x = x0 + i * advance + gx * u, y = y0 + gy * u;
                if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
        }
    });
    ctx.stroke();
}

function loop() {
    ctx.fillStyle = '#090908';
    ctx.fillRect(0, 0, LW, LH);
    drawPlaceholder();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
