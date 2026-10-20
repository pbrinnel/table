// The glue soldier (dhfm91). Each time another of GLUE_MARKS of the table's
// total weight has gone over the edge, the box says "Calling GLUE SOLDIER!"
// and a big, square guy comes out from under something, quicker than a
// backup. He carries GLUE_DOSES of glue: he runs to the nearest thing that's
// back in its home spot and glues it there for good. A glued thing can't be
// grabbed or moved, even by a knock, and it no longer counts as left on the
// table, so the ending can come with it still in place. Out of glue he works
// like any guy. His whole body can be grabbed, so he's easy to pick off, and
// knocked off he climbs back on as a plain backup.

const GLUE_MARKS = [0.25, 0.5, 0.75];  // shares of the table's weight gone over the edge
const GLUE_DOSES = 4;                  // things he can glue before he runs out
const GLUE_TIME = 0.8;                 // seconds he spends gluing a thing, standing beside it
const GLUE_PATIENCE = 6;               // seconds he'll try to reach a thing before trying another
const GLUE_SCALE = 1.6;                // how much bigger than a guy he's drawn, and grabbed
const GLUE_PACE = 0.5;                 // his speed on foot, as a share of a guy's
const GLUE_BODY_MM = 34;               // half the side of the square that grabs him (at GLUE_SCALE)
const GLUE_TALK_TIME = 2;              // seconds the line stays once fully typed
const GLUE_DELAY = 0.25;               // seconds from the call to his coming out, and between tries for cover
const GLUE_ENTER_PACE = 5;             // how many times faster than a backup's his way out is
const GLUE_LINE = 'Calling GLUE SOLDIER!';
// the puddle a glued thing sits in
const GLUE_SPILL_MM = 7;               // how far it spreads past the thing's outline
const GLUE_WOBBLE_MM = 2.5;            // how uneven its edge is
const GLUE_STEPS = 48;                 // points round its edge
const GLUE_COLOR = '#f6e7a8';          // pale amber

let glueWeight = 0;   // the table's total weight in grams, as it was laid
let glueNext = 0;     // index into GLUE_MARKS of the next mark to pass

// A new table: weighs what's on it, and no marks are passed yet.
function resetGlue() {
    glueNext = 0;
    glueWeight = things.reduce((sum, t) => sum + (isGuy(t) ? 0 : t.kind.mass), 0);
}

// Whether t is an object still in play: on the table and not glued. When none
// are left, the ending comes.
function inPlay(t) {
    return !isGuy(t) && onTable(t) && !t.glued;
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

// A new glue soldier, just come out: his glue is full.
function makeGlueSoldier(g) {
    g.glue = true;
    g.glueLeft = GLUE_DOSES;
    g.glueJob = null;
}

// The glue soldier a press at (xMm, yMm) lands on, anywhere on his big square
// body, or null. Out from under cover and on the table only.
function glueAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000), half = GLUE_BODY_MM / 1000;
    for (const g of guys) {
        if (!g.glue || g.entrance || !onTable(g.thing)) continue;
        const d = Vec2.sub(p, g.thing.body.getPosition());
        // his square turns with him (only standing; near enough lying down)
        const a = -g.facing, c = Math.cos(a), s = Math.sin(a);
        if (Math.abs(d.x * c - d.y * s) < half && Math.abs(d.x * s + d.y * c) < half) return g.thing;
    }
    return null;
}

// What a glue soldier can glue: something in its home spot, on the table and
// still, that nobody has hold of and no other glue soldier is after.
function gluable(g, t) {
    return inPlay(t) && t.home && !busy(t) && !isHeld(t.body) && isTidy(t, 1)
        && (g.sulks.get(t) || 0) <= g.clock
        && !guys.some(o => o !== g && (o.glueJob === t || o.job === t));
}

// The velocity a glue soldier with glue left wants this step, or null when
// there's nothing for him to glue and he works like any guy. Called from
// guyWants in js/guy.js.
function glueWants(g, at, h) {
    if (!g.glue || g.glueLeft <= 0 || g.grip) return null;
    let t = g.glueJob;
    if (t && !gluable(g, t) && !(g.gluing > 0 && inPlay(t))) t = null;
    if (!t) {
        let best = Infinity;
        for (const o of things) {
            if (!gluable(g, o)) continue;
            const d = Vec2.distance(o.body.getPosition(), at);
            if (d < best) { best = d; t = o; }
        }
        g.glueJob = t;
        g.glueSince = g.clock;
        g.gluing = 0;
    }
    if (!t) return null;
    if (g.job) letGoOfJob(g);
    g.roam = null;

    const p = t.body.getPosition();
    const side = roomySide(g, t, unitFrom(p, at));
    const touching = reachToward(t, side) + GUY_R_MM / 1000;
    if (Vec2.distance(at, p) > touching + GUY_REACH_MM / 1000) {
        g.gluing = 0;
        if (g.clock - g.glueSince > GLUE_PATIENCE) {
            g.sulks.set(t, g.clock + GUY_SULK_TIME);
            g.glueJob = null;
            return Vec2(0, 0);
        }
        return walkAround(g, at, standable(Vec2.add(p, Vec2.mul(side, touching))), GUY_WALK_SPEED);
    }
    // beside it: he faces it and spreads the glue
    g.faceTo = Math.atan2(p.y - at.y, p.x - at.x);
    g.gluing += h;
    if (g.gluing >= GLUE_TIME) {
        glueThing(t);
        g.glueLeft--;
        g.glueJob = null;
    }
    return Vec2(0, 0);
}

// Fixes t where it is for good: no hand can hold it and nothing can move it.
function glueThing(t) {
    t.glued = true;
    letGoOfThing(t);
    for (const o of guys) if (o.job === t) letGoOfJob(o);
    t.body.setLinearVelocity(Vec2(0, 0));
    t.body.setAngularVelocity(0);
    t.body.setStatic();
}

// The puddle each glued thing sits in, as pieces for drawThings (js/start.js)
// to sort in just under the thing itself: pale amber, its edge wobbling round
// the thing's outline, so anything glued reads as stuck down whatever its
// shape.
function gluePieces() {
    const pieces = [];
    for (const t of things) {
        if (!t.glued || !onTable(t)) continue;
        pieces.push({
            z: baseHeight(t) + FLAT_Z_MM - 1,
            draw(c) {
                const p = t.body.getPosition();
                c.setTransform(inkFrame);
                c.beginPath();
                for (let i = 0; i < GLUE_STEPS; i++) {
                    const a = i / GLUE_STEPS * Math.PI * 2, d = Vec2(Math.cos(a), Math.sin(a));
                    // fixed per thing, so the puddle never crawls
                    const wobble = Math.sin(a * 5 + t.home.x * 97) * GLUE_WOBBLE_MM;
                    const r = reachToward(t, d) * 1000 + GLUE_SPILL_MM + wobble;
                    const q = mmToFrame(p.x * 1000 + d.x * r, p.y * 1000 + d.y * r);
                    if (i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y);
                }
                c.closePath();
                c.fillStyle = GLUE_COLOR;
                c.fill();
                inkLine(c);
            },
        });
    }
    return pieces;
}
