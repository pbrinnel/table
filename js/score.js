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
const SCORE_CREDIT_PX = 22;
const SCORE_CREDIT_LINE = 28;   // between the credit lines

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
        c.globalAlpha = Math.min(1, scoreShown / SCORE_FADE_TIME);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = SCORE_FONT_PX + 'px "Patrick Hand"';
        c.fillText('Score: ' + score.toLocaleString('en-US'), view.w / 2, view.h / 2);
        c.font = SCORE_CREDIT_PX + 'px "Patrick Hand"';
        SCORE_CREDITS.forEach((line, i) =>
            c.fillText(line, view.w / 2, view.h / 2 + SCORE_FONT_PX * 0.75 + i * SCORE_CREDIT_LINE));
    }
    c.restore();
}
