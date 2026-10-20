// The glue soldier (dhfm91). Each time another of GLUE_MARKS of the table's
// total weight has gone over the edge, the box says "Calling GLUE SOLDIER!"
// and a special guy comes out from under something, the way a backup does but
// far quicker. He works like any other guy, but wherever he is, a grey circle
// surrounds him, and inside it nothing but him can be grabbed. So he isn't too
// strong, a press anywhere in his circle grabs him, and he's quick to throw
// off. Once he's off the table his circle is gone for good: he climbs back on
// as a plain backup.

const GLUE_MARKS = [0.25, 0.5, 0.75];  // shares of the table's weight gone over the edge
const GLUE_R_MM = 140;                 // the circle's radius: about a dinner plate across
const GLUE_ALPHA = 0.15;               // how much the circle greys what's under it
const GLUE_TALK_TIME = 2;              // seconds the line stays once fully typed
const GLUE_DELAY = 0.25;               // seconds from the call to his coming out, and between tries for cover
const GLUE_ENTER_PACE = 5;             // how many times faster than a backup he comes out
const GLUE_LINE = 'Calling GLUE SOLDIER!';

let glueWeight = 0;   // the table's total weight in grams, as it was laid
let glueNext = 0;     // index into GLUE_MARKS of the next mark to pass

// A new table: weighs what's on it, and no marks are passed yet.
function resetGlue() {
    glueNext = 0;
    glueWeight = things.reduce((sum, t) => sum + (isGuy(t) ? 0 : t.kind.mass), 0);
}

// An object has just gone over at `edge` (meters), with something still left.
// For each mark that takes the table past, he calls and a glue soldier is on
// his way, arriving the way backups do (arriveBackups in js/guy.js), but
// sooner.
function noticeGlue(edge) {
    const gone = things.reduce((sum, t) => sum + (!isGuy(t) && !onTable(t) ? t.kind.mass : 0), 0);
    let passed = 0;
    while (glueNext < GLUE_MARKS.length && gone >= GLUE_MARKS[glueNext] * glueWeight) {
        glueNext++;
        passed++;
    }
    if (!passed) return;
    say(GLUE_LINE, 'mad', GLUE_TALK_TIME);
    for (let i = 0; i < passed; i++) {
        backups.push({ at: guyClock + GLUE_DELAY, edge: Vec2.clone(edge), glue: true });
    }
}

// The glue soldiers out on the table, each with his circle: not while he's
// still coming out from under something, nor once he's gone over.
function glueSoldiers() {
    return guys.filter(g => g.glue && onTable(g.thing) && !g.entrance);
}

// The glue soldier whose circle a press at (xMm, yMm) is in, the nearest if
// several, or null. Such a press grabs him, wherever in the circle it lands.
function glueAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000);
    let best = null, bestD = GLUE_R_MM / 1000;
    for (const g of glueSoldiers()) {
        const d = Vec2.distance(g.thing.body.getPosition(), p);
        if (d < bestD) { best = g.thing; bestD = d; }
    }
    return best;
}

// Whether the player can't grab t: its center is inside a glue soldier's
// circle, and it isn't that soldier.
function glued(t) {
    const p = t.body.getPosition();
    return glueSoldiers().some(g => g.thing !== t
        && Vec2.distance(g.thing.body.getPosition(), p) < GLUE_R_MM / 1000);
}

// The circles, as pieces for drawThings (js/start.js) to sort in just under
// the guys: over the objects, so what's glued shows grey, and under every
// guy, so he stays clear.
function gluePieces() {
    return glueSoldiers().map(g => ({
        z: GUY_Z_MM - 1,
        draw(c) {
            const p = g.thing.body.getPosition();
            const at = mmToFrame(p.x * 1000, p.y * 1000);
            c.setTransform(inkFrame);
            c.beginPath();
            c.arc(at.x, at.y, GLUE_R_MM / MM_PER_UNIT, 0, Math.PI * 2);
            c.globalAlpha = GLUE_ALPHA;
            c.fillStyle = INK;
            c.fill();
        },
    }));
}
