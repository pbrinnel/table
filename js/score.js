// The score (dhfm91). Everything that goes over the edge is worth points: an
// object by its weight, a guy a flat amount the first time he's knocked or
// dragged off (not when he steps off at the end). Kept quietly through the
// game and shown once the table is empty and the last guy has gone over.

const SCORE_PER_GRAM = 1.25;    // an object's points: a dinner plate (600 g) is 750
const SCORE_GUY = 5;            // a backup, or a glue soldier, knocked off
const SCORE_FIRST_GUY = 25;     // the first guy knocked off
const SCORE_FADE_TIME = 1;      // seconds the score takes to fade in
const SCORE_FONT_PX = 96;

let score = 0;
let scoreShown = null;   // seconds the final score has been showing; null before then

function resetScore() {
    score = 0;
    scoreShown = null;
}

// An object has gone over the edge.
function scoreObject(t) {
    score += Math.round(t.kind.mass * SCORE_PER_GRAM);
}

// A guy has been knocked or dragged off: he scores the first time only.
function scoreGuy(g) {
    if (g.scored) return;
    g.scored = true;
    score += g === guys[0] ? SCORE_FIRST_GUY : SCORE_GUY;
}

// Whether the run is over: nothing left in play (thrown off or glued down),
// and every guy has gone over and out of sight.
function runOver() {
    return !things.some(inPlay)
        && guys.every(g => !onTable(g.thing) && g.thing.fall >= FALL_TIME);
}

// The final score, fading in over the middle of the empty table, as the first
// guy has his last word.
function drawScore(c, dt) {
    if (!runOver()) return;
    if (scoreShown === null) {
        scoreShown = 0;
        say(TALK_DAMAGE, 'sad', null);
    }
    scoreShown += dt;
    c.save();
    c.globalAlpha = Math.min(1, scoreShown / SCORE_FADE_TIME);
    c.fillStyle = INK;
    c.font = SCORE_FONT_PX + 'px "Patrick Hand"';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Score: ' + score.toLocaleString('en-US'), LW / 2, LH / 2);
    c.restore();
}
