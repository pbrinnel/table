// Where it begins. Loaded last, so everything before it is ready.

function setTable(layout) {
    letGoOfEverything();
    buildWorld();
    resetGuys();
    const placed = {};
    for (const o of layout) {
        const t = addThing(o.kind, o.x, o.y, o.angle);
        if (o.on) {
            placeOn(t, placed[o.on]);
            t.homeOn = placed[o.on];
        }
        placed[o.kind] = t;
    }
    addGuy(GUY_START.x, GUY_START.y);
    startTalk();
}

// Tipping over a line, seen from above, is squashing toward it by cos(tilt):
// the line through `at` (meters) facing out along unit n.
function squashToward(c, at, n, tilt) {
    const k = Math.cos(tilt) - 1;
    const e = mmToFrame(at.x * 1000, at.y * 1000);
    c.translate(e.x, e.y);
    c.transform(1 + k * n.x * n.x, k * n.x * n.y, k * n.x * n.y, 1 + k * n.y * n.y, 0, 0);
    c.translate(-e.x, -e.y);
}

// Tipping or leaning, a tall thing's top swings out over the cloth, where the
// physics, which only knows footprints, can't see it. So before one is drawn
// tipped, it's checked height by height against its tall neighbors (where
// they're leaning too), and tips only as far as it can before touching one,
// coming to rest leaning against it; that neighbor takes a share of the push
// as a lean of its own, away from the touch (Paul). Flat things sit below a
// glass's rim, so it can lean out over a plate.
const TILT_GAP_MM = 2;          // how near a tipping top comes before it stops
const TILT_PASS = 0.5;          // share of the stopped tilt a neighbor takes as a lean
const TILT_PASS_MAX = 0.35;     // radians: the most lean a neighbor is given
const TILT_SAMPLES = 8;         // heights checked up a tall thing
const TILT_SEARCH = 10;         // halvings when finding how far it can tip

// A tall kind's radius at height z (mm), 0 above its top.
function radiusAt(kind, z) {
    for (const [z0, r0, z1, r1] of kind.tall.parts) {
        if (z >= z0 && z <= z1) return r0 + (r1 - r0) * (z1 > z0 ? (z - z0) / (z1 - z0) : 0);
    }
    return 0;
}

function heightOf(kind) {
    const p = kind.tall.parts;
    return p[p.length - 1][2];
}

// Where whatever of t is at height z (mm) is drawn, in meters: its center,
// moved out by how it was last drawn tipped.
function drawnAt(t, z) {
    const p = t.body.getPosition(), d = t.drawnTilt;
    return d ? Vec2.add(p, Vec2.mul(d.n, z / 1000 * Math.sin(d.tilt))) : p;
}

// The tall neighbors t, tipped `tilt` toward n, would pass into; [] if none.
function tiltHits(t, tilt, n, near) {
    const p = t.body.getPosition(), H = heightOf(t.kind), hits = [];
    for (let i = 0; i <= TILT_SAMPLES; i++) {
        const z = H * i / TILT_SAMPLES, r = radiusAt(t.kind, z);
        const at = Vec2.add(p, Vec2.mul(n, z / 1000 * Math.sin(tilt)));
        for (const o of near) {
            const ro = radiusAt(o.kind, z);
            if (ro > 0 && !hits.includes(o) && Vec2.distance(at, drawnAt(o, z)) < (r + ro + TILT_GAP_MM) / 1000) hits.push(o);
        }
    }
    return hits;
}

// How far t can tip toward n without passing into a tall neighbor, up to tilt;
// the neighbors that stop it are nudged into a lean.
function clampTilt(t, tilt, n) {
    if (tilt <= 1e-3) return tilt;
    const p = t.body.getPosition(), reach = heightOf(t.kind) / 1000 + reachOf(t);
    const near = things.filter(o => o !== t && o.kind.tall && onTable(o) && o.drop === undefined
        && o.level === t.level && Vec2.distance(p, o.body.getPosition()) < reach + reachOf(o));
    if (!near.length || !tiltHits(t, tilt, n, near).length) return tilt;
    // already touching upright (a neighbor leaning on it): leave it be
    if (tiltHits(t, 0, n, near).length) return tilt;
    let lo = 0, hi = tilt;
    for (let i = 0; i < TILT_SEARCH; i++) {
        const mid = (lo + hi) / 2;
        if (tiltHits(t, mid, n, near).length) hi = mid; else lo = mid;
    }
    const pass = Math.min(TILT_PASS_MAX, (tilt - lo) * TILT_PASS);
    for (const o of tiltHits(t, hi, n, near)) {
        const push = Vec2.mul(n, pass);
        if (!o.leanPush || o.leanPush.length() < pass) o.leanPush = push;
    }
    return lo;
}

// The lean a tall thing has this frame, as a vector in radians toward where
// it's leaning, eased toward what its speed asks for (DRAG_LEAN). Whatever is
// moving it (a hand, a guy hauling it, the saucer it rides on, a flick), so a
// cup or a glass never slides along bolt upright like a flat disc.
function leanOf(t, dt) {
    let want = Vec2(0, 0);
    if (t.body.isActive()) {
        const v = t.body.getLinearVelocity(), speed = v.length();
        if (speed > 1e-3) want = Vec2.mul(v, Math.min(DRAG_LEAN_MAX, speed * DRAG_LEAN) / speed);
    }
    // leaned on by a neighbor this frame
    if (t.leanPush) { want = Vec2.add(want, t.leanPush); t.leanPush = null; }
    const lean = t.lean || Vec2(0, 0);
    t.lean = Vec2.add(lean, Vec2.mul(Vec2.sub(want, lean), Math.min(1, dt * DRAG_LEAN_EASE)));
    return t.lean;
}

// Drawing order goes by height, not by object: seen from above, what's higher
// covers what's lower. Each level is a step up, a tall thing's parts each sit
// at their own height (a tipped part lower, by cos of its tilt), and a guy is
// about as tall as a cup, so a glass tipping over its neighbor passes over its
// foot and under its rim (Paul).
const LEVEL_RISE_MM = 15;       // how much higher each level up sits
const FLAT_Z_MM = 2;            // a plate's or a fork's height, near enough
const GUY_Z_MM = 60;            // a guy's
const LIFT_Z_MM = 30;           // how much higher something being lifted rides

// Below the cloth (a guy crawling out from under something) is under
// everything on it, whatever its own height.
const UNDER_Z_MM = -1000;

function baseHeight(t) {
    if (t.level < LEVEL_ON_CLOTH) return UNDER_Z_MM;
    return (t.level - LEVEL_ON_CLOTH) * LEVEL_RISE_MM + (t.lifted ? LIFT_Z_MM : 0);
}

function drawThings(c, dt) {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    inkFrame = c.getTransform();
    // what to draw, each { z, draw(c) }, gathered then drawn lowest first
    const pieces = [];
    for (const t of byLevel()) {
        const falling = t.fall !== undefined, dropping = t.drop !== undefined;
        if (falling && t.fall >= FALL_TIME) continue;
        let pos = falling ? t.fallAt : t.body.getPosition();
        c.save();
        let shrink = t.drawScale || 1;
        let tilt = 0, tiltOut = null;
        if (falling) {
            // tipping over the table's edge, gravity speeding the tilt up
            tilt = Math.min(1, (t.fall / TIP_TIME) ** 2) * TIP_MAX * Math.PI / 180;
            tiltOut = t.edgeOut;
            squashToward(c, t.edgeAt, t.edgeOut, tilt);
            // then, free of the table, falling away is shrinking
            const u = Math.max(0, (t.fall - TIP_TIME) / (FALL_TIME - TIP_TIME));
            shrink = 1 - u * u;
        } else if (dropping) {
            // tipping down a level: over its support's rim and flat again as
            // it lands, sliding clear of it on the way
            const u = Math.min(1, t.drop / DROP_TIME);
            pos = Vec2.add(t.dropFrom, Vec2.mul(Vec2.sub(t.dropTo, t.dropFrom), u * u * (3 - 2 * u)));
            tilt = Math.sin(Math.PI * u) * DROP_TILT * Math.PI / 180;
            tiltOut = t.dropOut;
            if (t.kind.tall) tilt = clampTilt(t, tilt, tiltOut);
            squashToward(c, t.dropRim, t.dropOut, tilt);
        } else if (t.enterTilt) {
            // a guy lifting its near rim to come out from under it: tipping
            // about the far rim
            tiltOut = t.enterTilt.n;
            tilt = t.kind.tall ? clampTilt(t, t.enterTilt.tilt, tiltOut) : t.enterTilt.tilt;
            squashToward(c, t.enterTilt.at, tiltOut, tilt);
        }
        if (!falling && !dropping && t.kind.tall && !tiltOut) {
            const lean = leanOf(t, dt), amount = lean.length();
            if (amount > 1e-3) {
                tiltOut = Vec2.mul(lean, 1 / amount);
                tilt = clampTilt(t, amount, tiltOut);
                // about its foot's middle, the way a glass rocks on its base
                squashToward(c, pos, tiltOut, tilt);
            }
        }
        // how it's drawn tipped this frame, for its neighbors to check against
        if (t.kind.tall) t.drawnTilt = tilt > 1e-3 && tiltOut ? { tilt, n: tiltOut } : null;
        const at = mmToFrame(pos.x * 1000, pos.y * 1000);
        c.translate(at.x, at.y);
        c.rotate(t.body.getAngle());
        c.scale(shrink / MM_PER_UNIT, shrink / MM_PER_UNIT);
        const base = baseHeight(t);
        if (t.kind.tall) {
            for (const p of tallPieces(c, t.kind, t, tilt, tiltOut || Vec2(1, 0), shrink / MM_PER_UNIT)) {
                pieces.push({ z: base + p.z, draw: p.draw });
            }
        } else {
            const m = c.getTransform();
            pieces.push({ z: base + (isGuy(t) ? GUY_Z_MM : FLAT_Z_MM), draw: c => { c.setTransform(m); t.kind.draw(c, t); } });
        }
        c.restore();
    }
    // stable, so things at the same height keep their level-then-list order
    pieces.map((p, i) => [p, i]).sort((a, b) => a[0].z - b[0].z || a[1] - b[1]).forEach(([p]) => {
        c.save();
        p.draw(c);
        c.restore();
    });
}

let lastTime = null;

function loop(time) {
    // a hidden tab stops the clock; don't replay the gap
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.25);
    lastTime = time;
    if (!debugPaused) stepWorld(dt, stepGuys);
    dropFallen();

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, LW, LH);
    drawTable(ctx);
    drawThings(ctx, dt);
    drawDebug(ctx);
    drawScreams(ctx, dt);
    drawTalk(ctx, dt);
    requestAnimationFrame(loop);
}

setTable(TEST_LAYOUT);
listenForDrags();
listenForTalk();
listenForDebug();
requestAnimationFrame(loop);
