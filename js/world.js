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
const STEP_HZ = 60;
const MAX_STEPS_PER_FRAME = 4;   // after a stall, catch up this far and drop the rest

const Vec2 = planck.Vec2;

let world = null;
let cloth = null;     // the static body every friction and drag joint holds on to
// Every object, in drawing order: { kind, body, friction, home, fall, fallAt,
// fallV, edgeAt, edgeOut }. home is where it started, in meters. fall is
// seconds since it went over the edge, undefined while it's on the table; its
// body is switched off then, fallAt and fallV carry it on its way down, and it
// tips about the table's edge, the line through edgeAt facing out along edgeOut.
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
    const thing = { kind, body, friction, home: Vec2(xMm / 1000, yMm / 1000) };
    things.push(thing);
    applyFeelTo(thing);
    return thing;
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
    t.friction.setMaxForce(CLOTH_FRICTION * m * G);
    t.friction.setMaxTorque(CLOTH_FRICTION * CLOTH_SPIN_FRICTION * m * G * gyration);
    for (let f = t.body.getFixtureList(); f; f = f.getNext()) {
        f.setFriction(OBJECT_FRICTION);
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
            const p = t.body.getPosition();
            if (Math.abs(p.x) > TABLE_W_MM / 2000 || Math.abs(p.y) > TABLE_H_MM / 2000) {
                const hw = TABLE_W_MM / 2000, hh = TABLE_H_MM / 2000;
                const sideways = Math.abs(p.x) - hw > Math.abs(p.y) - hh;
                t.edgeOut = sideways ? Vec2(Math.sign(p.x), 0) : Vec2(0, Math.sign(p.y));
                t.edgeAt = sideways ? Vec2(Math.sign(p.x) * hw, p.y) : Vec2(p.x, Math.sign(p.y) * hh);
                t.fall = 0;
                t.fallAt = Vec2.clone(p);
                t.fallV = Vec2.clone(t.body.getLinearVelocity());
                const drift = t.fallV.length();
                if (drift > FALL_DRIFT) t.fallV.mul(FALL_DRIFT / drift);
                const out = Vec2.dot(t.fallV, t.edgeOut);
                if (out < FALL_SLIDE) t.fallV = Vec2.add(t.fallV, Vec2.mul(t.edgeOut, FALL_SLIDE - out));
                t.body.setActive(false);
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

// The topmost object under a point in mm, or null.
function thingAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000);
    for (let i = things.length - 1; i >= 0; i--) {
        if (things[i].fall !== undefined) continue;
        for (let f = things[i].body.getFixtureList(); f; f = f.getNext()) {
            if (f.testPoint(p)) return things[i];
        }
    }
    return null;
}
