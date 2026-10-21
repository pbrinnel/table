// The bubblegum soldier (dhfm91). Each time another of GUM_MARKS of the
// table's total weight has gone over the edge, the box says "Calling
// BUBBLEGUM SOLDIER!" and a big, square, pink guy comes out from under
// something, quicker than a backup. He carries GUM_DOSES of bubblegum: he runs
// to the nearest thing that's back in its home spot and gums it there for
// good. A gummed thing sits in a pink puddle, pinned by wads of gum over its
// edge. Nothing knocks it loose; the player can grab it, but it moves only
// GUM_LEASH_MM, sliding off its puddle's middle, and snaps back when let go.
// It no longer counts as left on the table, so the ending can come with it
// still in place. Out of gum he works like any guy. His whole body can be
// grabbed, so he's easy to pick off, and knocked off he climbs back on as a
// plain backup.

const GUM_MARKS = [0.25, 0.5, 0.75];  // shares of the table's weight gone over the edge
const GUM_DOSES = 4;                  // things he can gum before he runs out
const GUM_TIME = 0.8;                 // seconds he spends gumming a thing, standing beside it
const GUM_PATIENCE = 6;               // seconds he'll try to reach a thing before trying another
const GUM_SCALE = 1.6;                // how much bigger than a guy he's drawn, and grabbed
const GUM_PACE = 0.5;                 // his speed on foot, as a share of a guy's
const GUM_BODY_MM = 34;               // half the side of the square that grabs him (at GUM_SCALE)
const GUM_TALK_TIME = 2;              // seconds the line stays once fully typed
const GUM_DELAY = 0.25;               // seconds from the call to his coming out, and between tries for cover
const GUM_ENTER_PACE = 5;             // how many times faster than a backup's his way out is
const GUM_LINE = 'Calling BUBBLEGUM SOLDIER!';
const GUM_LEASH_MM = 9;               // how far a gummed thing can be pulled: about 5 px on a laptop
// how a gummed thing looks: a puddle under it, wads stuck over its edge
const GUM_SPILL_MM = 7;               // how far the puddle spreads past the thing's outline
const GUM_WOBBLE_MM = 1.5;            // how uneven its edge is
const GUM_STEPS = 48;                 // points round an edge
const GUM_WADS = 3;                   // wads round its edge, pinning it down
const GUM_WAD_MM = 11;                // a wad's radius

let gumWeight = 0;   // the table's total weight in grams, as it was laid
let gumNext = 0;     // index into GUM_MARKS of the next mark to pass

// A new table: weighs what's on it, and no marks are passed yet.
function resetGum() {
    gumNext = 0;
    gumWeight = things.reduce((sum, t) => sum + (isGuy(t) ? 0 : t.kind.mass), 0);
}

// Whether t is an object still in play: on the table and not gummed. When none
// are left, the ending comes.
function inPlay(t) {
    return !isGuy(t) && onTable(t) && !t.gummed;
}

// An object has just gone over at `edge` (meters), with something still left.
// For each mark that takes the table past, he calls and a bubblegum soldier is on
// his way, arriving the way backups do (arriveBackups in js/guy.js), but
// sooner.
function noticeGum(edge) {
    const gone = things.reduce((sum, t) => sum + (!isGuy(t) && !onTable(t) ? t.kind.mass : 0), 0);
    let passed = 0;
    while (gumNext < GUM_MARKS.length && gone >= GUM_MARKS[gumNext] * gumWeight) {
        gumNext++;
        passed++;
    }
    if (!passed) return;
    say(GUM_LINE, 'mad', GUM_TALK_TIME);
    for (let i = 0; i < passed; i++) {
        backups.push({ at: guyClock + GUM_DELAY, edge: Vec2.clone(edge), gum: true });
    }
}

// A new bubblegum soldier, just come out: his gum is full.
function makeGumSoldier(g) {
    g.gum = true;
    g.gumLeft = GUM_DOSES;
    g.gumJob = null;
}

// The bubblegum soldier a press at (xMm, yMm) lands on, anywhere on his big square
// body, or null. Out from under cover and on the table only.
function gumAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000), half = GUM_BODY_MM / 1000;
    for (const g of guys) {
        if (!g.gum || g.entrance || !onTable(g.thing)) continue;
        const d = Vec2.sub(p, g.thing.body.getPosition());
        // his square turns with him (only standing; near enough lying down)
        const a = -g.facing, c = Math.cos(a), s = Math.sin(a);
        if (Math.abs(d.x * c - d.y * s) < half && Math.abs(d.x * s + d.y * c) < half) return g.thing;
    }
    return null;
}

// What a bubblegum soldier can gum: something in its home spot, on the table and
// still, that nobody has hold of and no other bubblegum soldier is after.
function gummable(g, t) {
    return inPlay(t) && t.home && !busy(t) && !isHeld(t.body) && isTidy(t, 1)
        && (g.sulks.get(t) || 0) <= g.clock
        && !guys.some(o => o !== g && (o.gumJob === t || o.job === t));
}

// The velocity a bubblegum soldier with gum left wants this step, or null when
// there's nothing for him to gum and he works like any guy. Called from
// guyWants in js/guy.js.
function gumWants(g, at, h) {
    if (!g.gum || g.gumLeft <= 0 || g.grip) return null;
    let t = g.gumJob;
    if (t && !gummable(g, t) && !(g.gumming > 0 && inPlay(t))) t = null;
    if (!t) {
        let best = Infinity;
        for (const o of things) {
            if (!gummable(g, o)) continue;
            const d = Vec2.distance(o.body.getPosition(), at);
            if (d < best) { best = d; t = o; }
        }
        g.gumJob = t;
        g.gumSince = g.clock;
        g.gumming = 0;
    }
    if (!t) return null;
    if (g.job) letGoOfJob(g);
    g.roam = null;

    const p = t.body.getPosition();
    const side = roomySide(g, t, unitFrom(p, at));
    const touching = reachToward(t, side) + GUY_R_MM / 1000;
    if (Vec2.distance(at, p) > touching + GUY_REACH_MM / 1000) {
        g.gumming = 0;
        if (g.clock - g.gumSince > GUM_PATIENCE) {
            g.sulks.set(t, g.clock + GUY_SULK_TIME);
            g.gumJob = null;
            return Vec2(0, 0);
        }
        return walkAround(g, at, standable(Vec2.add(p, Vec2.mul(side, touching))), GUY_WALK_SPEED);
    }
    // beside it: he faces it and spreads the gum
    g.faceTo = Math.atan2(p.y - at.y, p.x - at.x);
    g.gumming += h;
    if (g.gumming >= GUM_TIME) {
        gumThing(t);
        g.gumLeft--;
        g.gumJob = null;
    }
    return Vec2(0, 0);
}

// Fixes t where it is for good: nothing can knock it loose, and a hand can
// only tug it (holdGum).
function gumThing(t) {
    t.gummed = true;
    t.gumAt = Vec2.clone(t.body.getPosition());
    t.gumAngle = t.body.getAngle();
    letGoOfThing(t);
    for (const o of guys) if (o.job === t) letGoOfJob(o);
    t.body.setLinearVelocity(Vec2(0, 0));
    t.body.setAngularVelocity(0);
    t.body.setStatic();
}

// A gummed thing, after each physics step (stepWorld in js/world.js). Held, it
// goes no further than GUM_LEASH_MM from where it was gummed and never turns
// (drag.js lets it move by making it dynamic when grabbed); let go, it snaps
// back and is static again.
function holdGum(t) {
    const b = t.body;
    if (!isHeld(b)) {
        if (!b.isStatic()) {
            b.setTransform(t.gumAt, t.gumAngle);
            b.setStatic();
        }
        return;
    }
    const off = Vec2.sub(b.getPosition(), t.gumAt), len = off.length(), most = GUM_LEASH_MM / 1000;
    if (len > most) {
        b.setTransform(Vec2.add(t.gumAt, Vec2.mul(off, most / len)), t.gumAngle);
        b.setLinearVelocity(Vec2(0, 0));
    } else {
        b.setTransform(b.getPosition(), t.gumAngle);
    }
    b.setAngularVelocity(0);
}

// How far t's real outline is from its middle in direction d (a unit Vec2),
// in meters, by a ray from outside it: reachToward's is a box round each
// piece, far too wide for a fork going diagonally.
const gumRayIn = { p1: Vec2(0, 0), p2: Vec2(0, 0), maxFraction: 1 }, gumRayOut = { normal: Vec2(0, 0), fraction: 1 };
function edgeOf(t, d) {
    const p = t.body.getPosition(), far = reachToward(t, d) + 0.01;
    gumRayIn.p1 = Vec2.add(p, Vec2.mul(d, far));
    gumRayIn.p2 = p;
    let hit = 1;
    for (let f = t.body.getFixtureList(); f; f = f.getNext()) {
        if (f.rayCast(gumRayOut, gumRayIn, 0) && gumRayOut.fraction < hit) hit = gumRayOut.fraction;
    }
    return far * (1 - hit);
}

// How each gummed thing is drawn, as pieces for drawThings (js/start.js): a
// pink puddle just under it, where it was gummed, following its outline with
// a wobbling edge; and over it GUM_WADS wads of gum stuck across its edge,
// half on it and half on the puddle. On the edge rather than the middle, so
// they show on anything, a plate with a bowl on it included, and pin down any
// shape. Pulled on its leash, the thing and its wads slide off the puddle.
function gumPieces() {
    const pieces = [];
    for (const t of things) {
        if (!t.gummed || !onTable(t)) continue;
        // fixed per thing, so nothing crawls
        const seed = t.gumAt.x * 97 + t.gumAt.y * 61;
        pieces.push({
            z: baseHeight(t) + FLAT_Z_MM - 1,
            draw(c) {
                // the outline as the thing sits now, moved back to where it was
                // gummed (it only ever slides, never turns)
                c.setTransform(inkFrame);
                c.beginPath();
                for (let i = 0; i < GUM_STEPS; i++) {
                    const a = i / GUM_STEPS * Math.PI * 2, d = Vec2(Math.cos(a), Math.sin(a));
                    const r = edgeOf(t, d) * 1000 + GUM_SPILL_MM + Math.sin(a * 5 + seed) * GUM_WOBBLE_MM;
                    const q = mmToFrame(t.gumAt.x * 1000 + d.x * r, t.gumAt.y * 1000 + d.y * r);
                    if (i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y);
                }
                c.closePath();
                c.fillStyle = GUM_PUDDLE;
                c.fill();
                inkLine(c);
            },
        });
        pieces.push({
            z: baseHeight(t) + (t.kind.tall ? heightOf(t.kind) : FLAT_Z_MM) + 0.5,
            draw(c) {
                const p = t.body.getPosition(), r = GUM_WAD_MM / MM_PER_UNIT;
                // its outline, turning with it so each wad stays on the same
                // spot, and the wads spaced evenly along it, so a fork gets one
                // near each end rather than three round its middle
                const edge = [], run = [0];
                for (let i = 0; i <= GUM_STEPS; i++) {
                    const a = t.body.getAngle() + i / GUM_STEPS * Math.PI * 2, d = Vec2(Math.cos(a), Math.sin(a));
                    edge.push(Vec2.add(p, Vec2.mul(d, edgeOf(t, d))));
                    if (i) run.push(run[i - 1] + Vec2.distance(edge[i], edge[i - 1]));
                }
                const around = run[GUM_STEPS];
                c.setTransform(inkFrame);
                for (let k = 0; k < GUM_WADS; k++) {
                    const want = ((seed / (Math.PI * 2)) % 1 + 1 + k / GUM_WADS) % 1 * around;
                    let i = 1;
                    while (i < GUM_STEPS && run[i] < want) i++;
                    const u = (want - run[i - 1]) / Math.max(1e-9, run[i] - run[i - 1]);
                    const e = Vec2.add(edge[i - 1], Vec2.mul(Vec2.sub(edge[i], edge[i - 1]), u));
                    const at = mmToFrame(e.x * 1000, e.y * 1000);
                    c.beginPath();
                    for (let i = 0; i < GUM_STEPS; i++) {
                        const b = i / GUM_STEPS * Math.PI * 2;
                        const lump = r * (1 + 0.15 * Math.sin(b * 3 + seed + k));
                        const x = at.x + Math.cos(b) * lump, y = at.y + Math.sin(b) * lump;
                        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
                    }
                    c.closePath();
                    c.fillStyle = GUM;
                    c.fill();
                    inkLine(c);
                    // a glint, so it reads as a glossy wad and not a dot
                    c.beginPath();
                    c.arc(at.x, at.y, r * 0.55, Math.PI * 1.1, Math.PI * 1.45);
                    c.lineCap = 'round';
                    c.lineWidth = LINE_WIDTH * 0.75;
                    c.strokeStyle = PAPER;
                    c.stroke();
                }
            },
        });
    }
    return pieces;
}
