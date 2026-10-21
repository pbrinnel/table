// The score (dhfm91). Everything that goes over the edge is worth points: an
// object by its weight, a guy a flat amount the first time he's knocked or
// dragged off (not when he steps off at the end). Kept quietly through the
// game and shown once the table is empty and the last guy has gone over.

const SCORE_PER_GRAM = 1.25;    // an object's points: a dinner plate (600 g) is 750
const SCORE_GUY = 5;            // a backup, or a bubblegum soldier, knocked off
const SCORE_FIRST_GUY = 25;     // the first guy knocked off
const SCORE_FADE_TIME = 1;      // seconds the score takes to fade in
const SCORE_FONT_PX = 96;
// Each score as it comes (dhfm91): "+N" in the top right corner, holding a
// moment, then fading where it is. Several at once stack downward, newest on
// top.
const SCORE_POP_HOLD = 0.35;    // seconds fully shown
const SCORE_POP_FADE = 0.65;    // seconds fading out after that
const SCORE_POP_PX = 34;
const SCORE_POP_GAP = 36;       // between stacked ones
const SCORE_POP_MARGIN = 24;    // from the top and right edges
const SCORE_CREDITS = [
    'Designed by Paul Brinnel',
    'Co-designed by David Feuling',
];
// The credits sit small in a box of their own in the top right corner, under
// the DEBUG button (dhfm91)
const SCORE_CREDIT_PX = 11;
const SCORE_CREDIT_LINE = 14;   // between the credit lines
const SCORE_CREDIT_PAD = 8;     // round them, inside their box
const SCORE_CREDIT_MIN_PX = 9;  // never smaller than this on the screen, in real pixels, so a phone can read them
// A panel behind the final score, and the credits' box, like the dialog box, so
// they read over whatever is left on the table (dhfm91)
const SCORE_PANEL_PAD = 24;     // round the score
const SCORE_PANEL_ALPHA = 0.92; // nearly solid: the table only just shows through

let score = 0;
let scoreShown = null;   // seconds the final score has been showing; null before then
let scorePops = [];      // { n, t }: points and seconds shown, newest first

function resetScore() {
    score = 0;
    scoreShown = null;
    scorePops = [];
}

function addScore(n) {
    score += n;
    scorePops.unshift({ n, t: 0 });
}

// An object has gone over the edge.
function scoreObject(t) {
    addScore(Math.round(t.kind.mass * SCORE_PER_GRAM));
}

// A guy has been knocked or dragged off: he scores the first time only.
function scoreGuy(g) {
    if (g.scored) return;
    g.scored = true;
    addScore(g === guys[0] ? SCORE_FIRST_GUY : SCORE_GUY);
}

// Whether the run is over: nothing left in play (thrown off or gummed down),
// and every guy has gone over and out of sight.
function runOver() {
    return !things.some(inPlay)
        && guys.every(g => !onTable(g.thing) && g.thing.fall >= FALL_TIME);
}

// A box like the dialog box, nearly solid, faded in by `shown`; leaves the ink
// ready for what goes in it.
function scorePanel(c, shown, x, y, w, h) {
    c.globalAlpha = shown * SCORE_PANEL_ALPHA;
    c.fillStyle = DIALOG;
    c.fillRect(x, y, w, h);
    c.globalAlpha = shown;
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.strokeRect(x, y, w, h);
    c.fillStyle = INK;
}

// How far down the upright view the DEBUG button reaches, in view units, so
// nothing in the corner sits under it.
function belowDebug(view) {
    const button = document.getElementById('debug-button');
    if (!button) return 0;
    const r = canvas.getBoundingClientRect();
    return Math.max(0, (button.getBoundingClientRect().bottom - r.top) * view.w / r.width);
}

// The points as they come, and once the run is over the final score with the
// credits, fading in over the middle. All upright on the screen, like the
// dialog box, even when the table is turned on a phone.
function drawScore(c, dt) {
    c.save();
    const view = uprightView(c);
    c.fillStyle = INK;
    c.textBaseline = 'top';
    c.textAlign = 'right';
    c.font = SCORE_POP_PX + 'px "Patrick Hand"';
    for (const pop of scorePops) pop.t += dt;
    scorePops = scorePops.filter(pop => pop.t < SCORE_POP_HOLD + SCORE_POP_FADE);
    scorePops.forEach((pop, i) => {
        const u = Math.max(0, pop.t - SCORE_POP_HOLD) / SCORE_POP_FADE;
        c.globalAlpha = 1 - u;
        c.fillText('+' + pop.n.toLocaleString('en-US'), view.w - SCORE_POP_MARGIN,
            SCORE_POP_MARGIN + i * SCORE_POP_GAP);
    });

    if (runOver()) {
        // the first guy has his last word as the score comes up
        if (scoreShown === null) {
            scoreShown = 0;
            say(TALK_DAMAGE, 'sad', null);
        }
        scoreShown += dt;
        const shown = Math.min(1, scoreShown / SCORE_FADE_TIME);
        const text = 'Score: ' + score.toLocaleString('en-US');
        c.font = SCORE_FONT_PX + 'px "Patrick Hand"';
        const w = c.measureText(text).width;
        scorePanel(c, shown, view.w / 2 - w / 2 - SCORE_PANEL_PAD, view.h / 2 - SCORE_FONT_PX * 0.55 - SCORE_PANEL_PAD,
            w + SCORE_PANEL_PAD * 2, SCORE_FONT_PX * 1.1 + SCORE_PANEL_PAD * 2);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, view.w / 2, view.h / 2);

        // the credits: right-aligned box in the corner, below the DEBUG button
        // the whole box scaled up together on a small screen
        const perPx = view.w / canvas.getBoundingClientRect().width;
        const k = Math.max(1, SCORE_CREDIT_MIN_PX * perPx / SCORE_CREDIT_PX);
        const pad = SCORE_CREDIT_PAD * k, line = SCORE_CREDIT_LINE * k;
        c.font = SCORE_CREDIT_PX * k + 'px "Patrick Hand"';
        let cw = 0;
        for (const l of SCORE_CREDITS) cw = Math.max(cw, c.measureText(l).width);
        const bw = cw + pad * 2, bh = SCORE_CREDITS.length * line + pad * 2;
        const bx = view.w - SCORE_POP_MARGIN - bw, by = belowDebug(view) + SCORE_POP_MARGIN;
        scorePanel(c, shown, bx, by, bw, bh);
        c.textAlign = 'left';
        c.textBaseline = 'top';
        SCORE_CREDITS.forEach((l, i) => c.fillText(l, bx + pad, by + pad + i * line + k));
    }
    c.restore();
}
