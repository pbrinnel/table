// The physics: a Planck world seen from above, with the cloth and the rim.
// Nothing falls. Each object is held back by a friction joint to the cloth,
// which stops it dead the way real sliding friction does, rather than easing
// it out forever the way damping would.

const G = 9.81;                  // m/s², for friction with the cloth
const CLOTH_FRICTION = 0.35;     // sliding friction against the cloth
const CLOTH_SPIN_FRICTION = 1;   // scales how quickly spinning things stop
const OBJECT_FRICTION = 0.2;     // object against object, and against the rim
const OBJECT_BOUNCE = 0.2;
// Planck takes the larger of two touching things' bounce, so the rim can be
// bouncier than the objects but never deader.
const RIM_BOUNCE = 0.3;
const MAX_SPEED = 5;             // m/s, so a hard flick can't tunnel or blur
const STEP_HZ = 60;
const MAX_STEPS_PER_FRAME = 4;   // after a stall, catch up this far and drop the rest

const Vec2 = planck.Vec2;

let world = null;
let cloth = null;     // the static body every friction and drag joint holds on to
let rimFixture = null;
// Every object on the table, in drawing order: { kind, body, friction }
let things = [];
let stepLeft = 0;

function buildWorld() {
    world = planck.World({ gravity: Vec2(0, 0) });
    cloth = world.createBody();
    things = [];
    stepLeft = 0;

    const hw = TABLE_W_MM / 2000, hh = TABLE_H_MM / 2000;
    const rim = world.createBody();
    rimFixture = rim.createFixture(
        planck.Chain([Vec2(-hw, -hh), Vec2(hw, -hh), Vec2(hw, hh), Vec2(-hw, hh)], true), {});
    applyFeel();
}

function addThing(kindName, xMm, yMm, angle) {
    const kind = KINDS[kindName];
    const body = world.createBody({
        type: 'dynamic',
        position: Vec2(xMm / 1000, yMm / 1000),
        angle: angle || 0,
        bullet: !!kind.bullet,
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
    const thing = { kind, body, friction };
    things.push(thing);
    applyFeelTo(thing);
    return thing;
}

// Puts the feel constants onto everything already in the world, so a slider
// page can change them live.
function applyFeel() {
    rimFixture.setFriction(OBJECT_FRICTION);
    rimFixture.setRestitution(RIM_BOUNCE);
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
function stepWorld(dt) {
    stepLeft = Math.min(stepLeft + dt, MAX_STEPS_PER_FRAME / STEP_HZ);
    while (stepLeft >= 1 / STEP_HZ) {
        world.step(1 / STEP_HZ);
        stepLeft -= 1 / STEP_HZ;
        for (const t of things) {
            const v = t.body.getLinearVelocity();
            const speed = v.length();
            if (speed > MAX_SPEED) t.body.setLinearVelocity(Vec2.mul(v, MAX_SPEED / speed));
        }
    }
}

// The topmost object under a point in mm, or null.
function thingAt(xMm, yMm) {
    const p = Vec2(xMm / 1000, yMm / 1000);
    for (let i = things.length - 1; i >= 0; i--) {
        for (let f = things[i].body.getFixtureList(); f; f = f.getNext()) {
            if (f.testPoint(p)) return things[i];
        }
    }
    return null;
}
