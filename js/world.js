// The physics: a Planck world seen from above, with the cloth under it.
// Nothing falls down, only off: there's no rim, and a thing whose center
// crosses the table's edge tips off it. Each object is held back by a friction joint to the cloth,
// which stops it dead the way real sliding friction does, rather than easing
// it out forever the way damping would.

const G = 9.81;                  // m/s², for friction with the cloth
const CLOTH_FRICTION = 0.35;     // sliding friction against the cloth
const CLOTH_SPIN_FRICTION = 1;   // scales how quickly spinning things stop
const OBJECT_FRICTION = 0.2;     // object against object
const OBJECT_BOUNCE = 0.2;
const TIP_TIME = 0.35;           // seconds to tip from flat to TIP_MAX, going over
// degrees: how far it tips before it's clear of the edge and drops. Short of
// upright, so it's never seen edge-on, and never past it, which would fold it
// back across the edge onto the table.
const TIP_MAX = 70;
const FALL_TIME = 0.8;           // seconds from going over to out of sight; longer than TIP_TIME
// m/s: the fastest a thing drifts once it's gone over. Higher, and a hard
// flick carries it out of the frame's margin before it can be seen tipping.
const FALL_DRIFT = 0.3;
// m/s: the least a thing slides outward going over, so even a nudge carries it
// clear of the edge as it tips, rather than tipping on the spot.
const FALL_SLIDE = 0.25;
const MAX_SPEED = 5;             // m/s, so a hard flick can't tunnel or blur
// Levels: the table is 0, the cloth 1, things on the cloth 2, a thing resting
// on another thing 3 (DESIGN.md, "levels"). Things only collide on their own
// level.
const LEVEL_ON_CLOTH = 2;
const LEVEL_ON_TOP = 3;
const RIDE_FRICTION = 0.3;       // a thing resting on another, sliding against it
// Tipping down a level, off whatever it was resting on: it tilts over that
// thing's rim and back flat as it lands just clear of it.
const DROP_TIME = 0.3;           // seconds from leaving its support to landing
const DROP_TILT = 50;            // degrees, the most it tilts on the way down
const DROP_GAP_MM = 4;           // how far clear of its support it lands
const STEP_HZ = 60;
const MAX_STEPS_PER_FRAME = 4;   // after a stall, catch up this far and drop the rest

const Vec2 = planck.Vec2;

// Planck 1.5.0's friction joint keeps its last impulse by reference
// (`oldImpulse = this.m_linearImpulse`, then adds to it), so the linear impulse
// it works out each step always comes to nothing, and only the warm start from
// the step before ever pushes back. A sliding thing then never quite stops: it
// settles into a creep of a centimeter or two a second, forever, and walks off
// the table on its own. This is the same solve as Box2D's, with the old
// impulse copied. The library file stays as released; this replaces the one
// method on its prototype.
planck.FrictionJoint.prototype.solveVelocityConstraints = function (step) {
    const vA = this.m_bodyA.c_velocity.v, vB = this.m_bodyB.c_velocity.v;
    let wA = this.m_bodyA.c_velocity.w, wB = this.m_bodyB.c_velocity.w;
    const mA = this.m_invMassA, mB = this.m_invMassB, iA = this.m_invIA, iB = this.m_invIB;
    const h = step.dt, rA = this.m_rA, rB = this.m_rB;

    // turning
    const oldAngular = this.m_angularImpulse, maxTurn = h * this.m_maxTorque;
    this.m_angularImpulse = Math.max(-maxTurn, Math.min(maxTurn, oldAngular - this.m_angularMass * (wB - wA)));
    const turn = this.m_angularImpulse - oldAngular;
    wA -= iA * turn;
    wB += iB * turn;

    // sliding
    const cx = vB.x - wB * rB.y - vA.x + wA * rA.y;
    const cy = vB.y + wB * rB.x - vA.y - wA * rA.x;
    const K = this.m_linearMass, li = this.m_linearImpulse;
    const oldX = li.x, oldY = li.y;
    li.x -= K.ex.x * cx + K.ey.x * cy;
    li.y -= K.ex.y * cx + K.ey.y * cy;
    const maxSlide = h * this.m_maxForce, len = Math.hypot(li.x, li.y);
    if (len > maxSlide) { li.x *= maxSlide / len; li.y *= maxSlide / len; }
    const px = li.x - oldX, py = li.y - oldY;
    vA.x -= mA * px; vA.y -= mA * py;
    wA -= iA * (rA.x * py - rA.y * px);
    vB.x += mB * px; vB.y += mB * py;
    wB += iB * (rB.x * py - rB.y * px);

    this.m_bodyA.c_velocity.w = wA;
    this.m_bodyB.c_velocity.w = wB;
};

let world = null;
let cloth = null;     // the static body every friction and drag joint holds on to
// Every object: { kind, body, friction, home, level, on, homeOn, fall, fallAt,
// fallV, edgeAt, edgeOut, drop, dropFrom, dropTo, dropRim, dropOut }.
// home is where it started, in meters. level is its level; on is the thing it
// rests on at level 3 (null on the cloth), and homeOn the thing it started on.
// fall is seconds since it went over the table's edge, undefined while it's on
// the table; its body is switched off then, fallAt and fallV carry it on its
// way down, and it tips about the table's edge, the line through edgeAt facing
// out along edgeOut. drop is seconds since it slid off what it rested on,
// undefined otherwise; its body is off then too, and it moves from dropFrom to
// dropTo tilting over its support's rim, the line through dropRim facing dropOut.
// Draw and pick things in byLevel() order, lowest level first.
let things = [];
let stepLeft = 0;

function buildWorld() {
    world = planck.World({ gravity: Vec2(0, 0) });
    cloth = world.createBody();
    things = [];
    stepLeft = 0;
}

// kind is a name in KINDS, or a kind itself (the little guy brings his own).
function addThing(kind, xMm, yMm, angle) {
    if (typeof kind === 'string') kind = KINDS[kind];
    const body = world.createBody({
        type: 'dynamic',
        position: Vec2(xMm / 1000, yMm / 1000),
        angle: angle || 0,
        bullet: !!kind.bullet,
        fixedRotation: !!kind.fixedRotation,
    });
    for (const p of kind.pieces) {
        const at = Vec2((p.x || 0) / 1000, (p.y || 0) / 1000);
        const shape = p.circle
            ? planck.Circle(at, p.circle / 1000)
            : planck.Box(p.box[0] / 2000, p.box[1] / 2000, at, p.angle || 0);
        body.createFixture(shape, { density: 1 });
    }
    // Scale the density so the body weighs what the real object does,
    // however its pieces overlap.
    const k = kind.mass / 1000 / body.getMass();
    for (let f = body.getFixtureList(); f; f = f.getNext()) f.setDensity(k);
    body.resetMassData();

    const friction = world.createJoint(planck.FrictionJoint({}, cloth, body, body.getWorldCenter()));
    const thing = { kind, body, friction, home: Vec2(xMm / 1000, yMm / 1000), level: LEVEL_ON_CLOTH, on: null, homeOn: null };
    things.push(thing);
    setLevel(thing, LEVEL_ON_CLOTH);
    applyFeelTo(thing);
    return thing;
}

// Puts t on a level: from then on it collides only with things on the same one.
function setLevel(t, level) {
    t.level = level;
    for (let f = t.body.getFixtureList(); f; f = f.getNext()) {
        f.setFilterData({ groupIndex: 0, categoryBits: 1 << level, maskBits: 1 << level });
    }
}

// Rests rider on support, centered on it: a level up, held to it by its own
// friction, so it rides along until it's jerked off.
function placeOn(rider, support) {
    world.destroyJoint(rider.friction);
    const p = support.body.getPosition();
    rider.body.setTransform(p, rider.body.getAngle());
    rider.body.setLinearVelocity(support.body.getLinearVelocity());
    rider.body.setAngularVelocity(0);
    rider.friction = world.createJoint(planck.FrictionJoint({}, support.body, rider.body, p));
    rider.on = support;
    setLevel(rider, LEVEL_ON_TOP);
    applyFeelTo(rider);
}

// Puts t back on the cloth, a level down, held by the cloth's friction.
function putOnCloth(t) {
    world.destroyJoint(t.friction);
    t.friction = world.createJoint(planck.FrictionJoint({}, cloth, t.body, t.body.getWorldCenter()));
    t.on = null;
    setLevel(t, LEVEL_ON_CLOTH);
    applyFeelTo(t);
}

// How far a resting thing's center may stray from its support's before it
// slides off: the support's own radius, from its biggest circle piece.
function rimOf(t) {
    let r = 0;
    for (const p of t.kind.pieces) if (p.circle) r = Math.max(r, p.circle - Math.hypot(p.x || 0, p.y || 0));
    return r / 1000;
}

// The widest a thing reaches from its center, in meters.
function reachOf(t) {
    let r = 0;
    for (const p of t.kind.pieces) {
        r = Math.max(r, Math.hypot(p.x || 0, p.y || 0) + (p.circle || Math.hypot(p.box[0], p.box[1]) / 2));
    }
    return r / 1000;
}

// Lowest level first, the order things are drawn in and picked in reverse.
function byLevel() {
    return things.map((t, i) => [t, i]).sort((a, b) => a[0].level - b[0].level || a[1] - b[1]).map(e => e[0]);
}

// Over the table's edge: the body is switched off, and it's drawn tipping off
// the edge nearest it, then falling away.
function startFall(t) {
    const p = t.body.getPosition();
    const hw = TABLE_W_MM / 2000, hh = TABLE_H_MM / 2000;
    const sideways = Math.abs(p.x) - hw > Math.abs(p.y) - hh;
    t.edgeOut = sideways ? Vec2(Math.sign(p.x) || 1, 0) : Vec2(0, Math.sign(p.y) || 1);
    t.edgeAt = sideways ? Vec2(t.edgeOut.x * hw, p.y) : Vec2(p.x, t.edgeOut.y * hh);
    t.fall = 0;
    t.fallAt = Vec2.clone(p);
    t.fallV = Vec2.clone(t.body.getLinearVelocity());
    const drift = t.fallV.length();
    if (drift > FALL_DRIFT) t.fallV.mul(FALL_DRIFT / drift);
    const out = Vec2.dot(t.fallV, t.edgeOut);
    if (out < FALL_SLIDE) t.fallV = Vec2.add(t.fallV, Vec2.mul(t.edgeOut, FALL_SLIDE - out));
    t.drop = undefined;
    t.body.setActive(false);
}

// Slid off what it rested on: it tips over the support's rim and lands on the
// cloth just clear of it.
function startDrop(t) {
    const s = t.on, sp = s.body.getPosition(), p = t.body.getPosition();
    let out = Vec2.sub(p, sp);
    if (out.length() < 1e-6) out = Vec2(1, 0);
    out.normalize();
    t.dropOut = out;
    t.dropRim = Vec2.add(sp, Vec2.mul(out, rimOf(s)));
    t.dropFrom = Vec2.clone(p);
    t.dropTo = Vec2.add(sp, Vec2.mul(out, reachOf(s) + reachOf(t) + DROP_GAP_MM / 1000));
    t.drop = 0;
    world.destroyJoint(t.friction);
    t.friction = null;
    t.on = null;
    t.body.setActive(false);
}

// A drop is over: it's on the cloth, a level down.
function land(t) {
    t.body.setTransform(t.dropTo, t.body.getAngle());
    t.body.setLinearVelocity(Vec2(0, 0));
    t.body.setActive(true);
    t.friction = world.createJoint(planck.FrictionJoint({}, cloth, t.body, t.body.getWorldCenter()));
    t.on = null;
    setLevel(t, LEVEL_ON_CLOTH);
    applyFeelTo(t);
    t.drop = undefined;
}

// Puts the feel constants onto everything already in the world, so a slider
// page can change them live.
function applyFeel() {
    for (const t of things) applyFeelTo(t);
}

function applyFeelTo(t) {
    const m = t.body.getMass();
    // spin friction acts at about the radius of gyration
    const gyration = Math.sqrt(t.body.getInertia() / m);
    if (t.friction) {
        const mu = t.on ? RIDE_FRICTION : CLOTH_FRICTION;
        t.friction.setMaxForce(mu * m * G);
        t.friction.setMaxTorque(mu * CLOTH_SPIN_FRICTION * m * G * gyration);
    }
    for (let f = t.body.getFixtureList(); f; f = f.getNext()) {
        // a slick kind (the little guys) brushes past things without dragging them along
        f.setFriction(t.kind.slick ? 0 : OBJECT_FRICTION);
        f.setRestitution(OBJECT_BOUNCE);
    }
}

// Runs the physics at a fixed rate whatever the screen's refresh rate.
// eachStep(seconds) runs before every step, for anything that steers itself.
function stepWorld(dt, eachStep) {
    stepLeft = Math.min(stepLeft + dt, MAX_STEPS_PER_FRAME / STEP_HZ);
    while (stepLeft >= 1 / STEP_HZ) {
        eachStep(1 / STEP_HZ);
        world.step(1 / STEP_HZ);
        stepLeft -= 1 / STEP_HZ;
        for (const t of things) {
            if (t.fall !== undefined) {
                t.fall += 1 / STEP_HZ;
                t.fallAt = Vec2.add(t.fallAt, Vec2.mul(t.fallV, 1 / STEP_HZ));
                continue;
            }
            if (t.drop !== undefined) {
                t.drop += 1 / STEP_HZ;
                if (t.drop >= DROP_TIME) land(t);
                continue;
            }
            if (t.lifted) continue;     // a guy has it in his hands (js/guy.js)
            const p = t.body.getPosition();
            if (Math.abs(p.x) > TABLE_W_MM / 2000 || Math.abs(p.y) > TABLE_H_MM / 2000
                || (t.on && t.on.fall !== undefined)) {
                startFall(t);
                continue;
            }
            if (t.on && Vec2.distance(p, t.on.body.getPosition()) > rimOf(t.on)) {
                startDrop(t);
                continue;
            }
            const v = t.body.getLinearVelocity();
            const speed = v.length();
            if (speed > MAX_SPEED) t.body.setLinearVelocity(Vec2.mul(v, MAX_SPEED / speed));
        }
    }
}

function onTable(t) {
    return t.fall === undefined;
}

// The topmost object under a point in mm, or null: the highest level first,
// then the last drawn.
function thingAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000);
    const order = byLevel();
    for (let i = order.length - 1; i >= 0; i--) {
        const t = order[i];
        if (t.fall !== undefined || t.drop !== undefined) continue;
        for (let f = t.body.getFixtureList(); f; f = f.getNext()) {
            if (f.testPoint(p)) return t;
        }
    }
    return null;
}
