// The clock (Paul): CLOCK_SECONDS to clear the table, starting at the
// player's first grab. It stops when the last thing has gone over; at 0 time's
// up: everything let go, the world stands still, nothing more can be grabbed or
// score, and the end screen comes up (js/score.js). Shown as plain seconds in
// the floor's margin above the table's left end, out of the way.

const CLOCK_SECONDS = 60;
const CLOCK_PX = 36;
// The digits grow steadily to CLOCK_GROW times their size over the last
// CLOCK_GROW_SECS: no blinking, for photosensitive players
const CLOCK_GROW = 1.3;
const CLOCK_GROW_SECS = 10;

let clockLeft = CLOCK_SECONDS;  // seconds
let clockStarted = false;
let clockUp = false;            // time's up: start.js stops stepping the world, drag.js grabbing

function resetClock() {
    clockLeft = CLOCK_SECONDS;
    clockStarted = false;
    clockUp = false;
}

// whole seconds left, rounded up, so it reads 0 only once time's up
function clockSeconds() {
    return Math.ceil(clockLeft - 1e-9);
}

function tickClock(dt) {
    if (!clockStarted || clockUp || debugPaused || !things.some(inPlay)) return;
    clockLeft = Math.max(0, clockLeft - dt);
    if (clockLeft > 0) return;
    clockUp = true;
    letGoOfEverything();
}

function drawClock(c) {
    c.save();
    const view = uprightView(c), top = tableTopInView(view);
    const grow = Math.min(1, Math.max(0, (CLOCK_GROW_SECS - clockLeft) / CLOCK_GROW_SECS));
    c.fillStyle = INK;
    c.font = CLOCK_PX * (1 + (CLOCK_GROW - 1) * grow) + 'px "Patrick Hand"';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(String(clockSeconds()), top.left, top.mid);
    c.restore();
}

function listenForClock() {
    addEventListener('grabbed', () => { clockStarted = true; });
}
