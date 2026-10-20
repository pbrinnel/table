// Grabbing and dragging. Each pointer (the mouse, or each finger) pulls the
// object it grabbed toward itself on a spring. The spring's pull has a
// ceiling, the same for every object, and that ceiling is what makes heavy
// things lag behind and light things keep up.

const DRAG_MAX_FORCE = 15;  // newtons
const DRAG_HZ = 5;          // how stiff the spring is
const DRAG_DAMPING = 0.7;   // 1 settles without overshooting; lower wobbles
// A finger is wide and a knife is thin, so a press this close to an outline
// still grabs it. Frame units.
const GRAB_SLOP = 12;

const GRAB_REACH = 8;       // directions to look in, within GRAB_SLOP

// pointerId -> the mouse joint it's pulling with
const holds = new Map();

function grabAt(xMm, yMm) {
    const hit = thingAt(xMm, yMm);
    if (hit) return hit;
    const r = GRAB_SLOP * MM_PER_UNIT;
    for (let i = 0; i < GRAB_REACH; i++) {
        const a = i / GRAB_REACH * Math.PI * 2;
        const near = thingAt(xMm + Math.cos(a) * r, yMm + Math.sin(a) * r);
        if (near) return near;
    }
    return null;
}

function pointerMm(e) {
    return frameToMm(screenToFrame(e.clientX, e.clientY));
}

function grab(e) {
    // a press on the guy's message dismisses it instead of grabbing what's under it
    if (talkBoxHit(e.clientX, e.clientY)) {
        e.preventDefault();
        hush();
        return;
    }
    const p = pointerMm(e);
    const t = grabAt(p.x, p.y);
    if (!t) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    // the held thing draws on top of the rest
    things.splice(things.indexOf(t), 1);
    things.push(t);

    t.body.setAwake(true);
    const joint = world.createJoint(planck.MouseJoint({
        maxForce: DRAG_MAX_FORCE,
        frequencyHz: DRAG_HZ,
        dampingRatio: DRAG_DAMPING,
    }, cloth, t.body, Vec2(p.x / 1000, p.y / 1000)));
    holds.set(e.pointerId, joint);
    // detail: the thing grabbed, for whoever wants to react to what it was
    dispatchEvent(new CustomEvent('grabbed', { detail: t }));
}

function pull(e) {
    const joint = holds.get(e.pointerId);
    if (!joint) return;
    const p = pointerMm(e);
    joint.setTarget(Vec2(p.x / 1000, p.y / 1000));
}

function letGo(e) {
    const joint = holds.get(e.pointerId);
    if (!joint) return;
    world.destroyJoint(joint);
    holds.delete(e.pointerId);
}

function isHeld(body) {
    for (const joint of holds.values()) if (joint.getBodyB() === body) return true;
    return false;
}

// Something held that went over the edge drops out of the hand. One tipping
// down a level, or in a guy's hands, stays held: its body is only off for a
// moment.
function dropFallen() {
    for (const [id, joint] of holds) {
        const t = things.find(t => t.body === joint.getBodyB());
        if (!t || t.fall !== undefined) {
            world.destroyJoint(joint);
            holds.delete(id);
        }
    }
}

function letGoOfEverything() {
    for (const joint of holds.values()) world.destroyJoint(joint);
    holds.clear();
}

function listenForDrags() {
    canvas.addEventListener('pointerdown', grab);
    canvas.addEventListener('pointermove', pull);
    // Every way a pointer can stop counts as letting go, so nothing stays
    // held after a finger slides off the screen or a call interrupts.
    canvas.addEventListener('pointerup', letGo);
    canvas.addEventListener('pointercancel', letGo);
    canvas.addEventListener('lostpointercapture', letGo);
    addEventListener('frameturn', letGoOfEverything);
}
