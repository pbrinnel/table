// The little guys. The first runs around grabbing things and hauling them back
// to where they started, fast, with no care for what's in the way. His grip is a
// capped spring like the player's, so heavy things still drag on him. Anything
// that hits him hard enough knocks him flat for a while. Every time an object
// goes over the edge (and something is still left), he calls for backup and one
// more guy climbs up where it fell, for the rest of the run. They share the
// work: each takes a different job. When the last thing goes over the edge,
// every one of them follows it, slowly: there's nothing left for them. The
// table stays empty after that.
//
// A guy has no friction joint pulling on him while he's on his feet: his own
// walking force is his grip on the cloth. Knocked down or held, he slides like
// any other object.

const GUY_MASS = 150;            // grams
const GUY_WALK_SPEED = 1.2;      // m/s, running to the next job
const GUY_CARRY_SPEED = 0.8;     // m/s, hauling something home
const GUY_FORCE = 6;             // newtons, the most his legs can push or brake with
const GUY_GRIP_FORCE = 8;        // newtons, the most his hands can pull a thing with
const GUY_GRIP_HZ = 6;           // how stiff his grip is
// A jolt to his speed bigger than this, beyond what his own legs did, knocks
// him down. Measured from speed rather than collision force because he's a
// bullet body, and Planck doesn't report how hard fast collisions were. What
// hauling against something immovable does to him is allowed for on top.
const GUY_KNOCK_SPEED = 0.6;     // m/s
const GUY_STUN_TIME = 2;         // seconds on the floor
const GUY_PATIENCE = 3;          // seconds without progress before he tries another
const GUY_SULK_TIME = 5;         // seconds before he'll go back to one he gave up on
const GUY_TIDY_MM = 20;          // this close to home counts as put back
const GUY_CLIMB_TIME = 3;        // seconds after being knocked off before he's back up
const GUY_BACKUP_DELAY = 1.5;    // seconds from an object going over to the backup climbing up
// The end: frozen, then a slow look at the empty spots, a trudge to the edge,
// a pause there, and one step more.
const GUY_SAD_SPEED = 0.075;     // m/s
const GUY_DESPAIR_TIME = 2;      // seconds frozen, once the last thing has gone
const GUY_LOOK_TIME = 1.3;       // seconds looking at each empty spot
const GUY_BRINK_TIME = 2.8;      // seconds at the edge before he steps off
const GUY_SAD_LOOKS = 3;         // how many empty spots he looks at

const GUY_R_MM = 25;             // his collision circle
const GUY_REACH_MM = 12;         // how far past touching he can still get his hands on it
const GUY_STRIDE_MM = 22;        // how far one step of his feet carries him

// Every guy, the first and each backup. Each has his own body and his own grip.
let guys = [];
// Backups on their way: { at: guyClock time they arrive, pos: where, in meters }
let backups = [];
// Objects already counted as dropped, so each one calls for backup once
let countedDrops = new Set();
let guyClock = 0;

// Objects and guys share the world's list of things; this tells them apart.
function isGuy(t) {
    return t.kind === GUY_KIND;
}

const GUY_KIND = {
    get mass() { return GUY_MASS; },
    bullet: true,
    fixedRotation: true,
    pieces: [{ circle: GUY_R_MM }],
    // t.guy is the guy this thing is, so each is drawn in his own pose
    draw(c, t) {
        if (t.guy.down > 0) drawGuyFlat(c, t.guy);
        else drawGuyStanding(c, t.guy);
    },
};

// A new table starts with no guys and no backups on the way.
function resetGuys() {
    guys = [];
    backups = [];
    countedDrops = new Set();
    guyClock = 0;
}

function addGuy(xMm, yMm) {
    const thing = addThing(GUY_KIND, xMm, yMm, 0);
    const g = {
        thing,
        rest: Vec2(xMm / 1000, yMm / 1000),
        down: 0,          // seconds left on the floor; 0 when he's up
        floored: false,   // just knocked down, still to work out which way he fell
        flatAngle: 0,
        facing: 0,
        stride: 0,
        job: null,
        grip: null,       // the joint his hands pull the job with, once he has it
        hold: null,       // where he keeps himself, relative to the job's center
        carry: null,      // the point he's hauling the job toward this step
        best: Infinity,   // closest he's come to finishing the job, in meters
        stuck: 0,         // seconds since that last improved
        expect: null,     // the velocity his own force should give him next step
        sulks: new Map(), // thing -> clock time he'll try it again
        clock: 0,
        leaving: null,    // once nothing is left: { phase, t, looks, brink, over }
        faceTo: null,     // an angle to face slowly instead of where he's going
    };
    thing.guy = g;
    guys.push(g);
    return g;
}

function letGoOfJob(g) {
    if (g.grip) world.destroyJoint(g.grip);
    g.grip = null;
    g.job = null;
}

function knockDown(g) {
    g.down = GUY_STUN_TIME;
    g.floored = true;
    letGoOfJob(g);
}

// How far an object reaches from its center in direction d (a unit Vec2), from
// its collision pieces.
function reachToward(t, d) {
    const a = t.body.getAngle(), cos = Math.cos(a), sin = Math.sin(a);
    // d in the object's own frame
    const lx = d.x * cos + d.y * sin, ly = -d.x * sin + d.y * cos;
    let reach = 0;
    for (const p of t.kind.pieces) {
        const along = ((p.x || 0) * lx + (p.y || 0) * ly) / 1000;
        if (p.circle) {
            reach = Math.max(reach, along + p.circle / 1000);
        } else {
            const pa = p.angle || 0, pc = Math.cos(pa), ps = Math.sin(pa);
            const ux = lx * pc + ly * ps, uy = -lx * ps + ly * pc;
            reach = Math.max(reach, along + (Math.abs(ux) * p.box[0] + Math.abs(uy) * p.box[1]) / 2000);
        }
    }
    return reach;
}

function isTidy(t, slack) {
    return Vec2.distance(t.body.getPosition(), t.home) < GUY_TIDY_MM * slack / 1000;
}

// Whatever the player has just picked up comes first: every guy goes straight
// for it, and it turns into a tug of war. Otherwise, whatever is furthest from
// home that no other guy is working on, so the work is shared. With nothing
// free, he goes back to his rest spot.
function pickJob(g) {
    for (const t of things) {
        if (!isGuy(t) && t.home && onTable(t) && isHeld(t.body)) return t;
    }
    let pick = null, far = 0;
    for (const t of things) {
        if (!t.home || isGuy(t) || !onTable(t)) continue;
        if ((g.sulks.get(t) || 0) > g.clock || isTidy(t, 1)) continue;
        if (guys.some(o => o !== g && o.job === t)) continue;
        const d = Vec2.distance(t.body.getPosition(), t.home);
        if (d > far) { far = d; pick = t; }
    }
    return pick;
}

// Keeps a point where he can stand: on the table, his whole body inside the edge.
function standable(p) {
    const hw = TABLE_W_MM / 2000 - GUY_R_MM / 1000, hh = TABLE_H_MM / 2000 - GUY_R_MM / 1000;
    return Vec2(Math.max(-hw, Math.min(hw, p.x)), Math.max(-hh, Math.min(hh, p.y)));
}

// A point just past whichever edge of the table is closest.
function overNearestEdge(at) {
    const hw = TABLE_W_MM / 2000, hh = TABLE_H_MM / 2000, out = GUY_R_MM * 3 / 1000;
    const gaps = [hw - at.x, hw + at.x, hh - at.y, hh + at.y];
    const i = gaps.indexOf(Math.min(...gaps));
    return [Vec2(hw + out, at.y), Vec2(-hw - out, at.y), Vec2(at.x, hh + out), Vec2(at.x, -hh - out)][i];
}

// Nothing left on the table, and so nothing left for any of them.
function leaving(g, at, h) {
    const s = g.leaving;
    s.t += h;
    const next = phase => { s.phase = phase; s.t = 0; };
    const toward = p => Math.atan2(p.y - at.y, p.x - at.x);

    if (s.phase === 'frozen') {
        if (s.t > GUY_DESPAIR_TIME) next('looking');
        return Vec2(0, 0);
    }
    if (s.phase === 'looking') {
        const i = Math.floor(s.t / GUY_LOOK_TIME);
        if (i < s.looks.length) {
            g.faceTo = toward(s.looks[i]);
            return Vec2(0, 0);
        }
        s.over = overNearestEdge(at);
        s.brink = standable(s.over);
        next('trudging');
    }
    if (s.phase === 'trudging') {
        if (Vec2.distance(at, s.brink) < 0.005) next('brink');
        else return walkTo(at, s.brink, GUY_SAD_SPEED);
    }
    if (s.phase === 'brink') {
        // out over the edge, one look back at the table, then out again
        const out = toward(s.over);
        const u = s.t / GUY_BRINK_TIME;
        g.faceTo = u > 0.45 && u < 0.7 ? out + Math.PI * 0.8 : out;
        if (s.t > GUY_BRINK_TIME) next('stepping');
        return Vec2(0, 0);
    }
    return walkTo(at, s.over, GUY_SAD_SPEED);
}

function walkTo(at, to, top) {
    const d = Vec2.sub(to, at), len = d.length();
    if (len < 1e-4) return Vec2(0, 0);
    return Vec2.mul(d, Math.min(top, len * 4) / len);
}

// The velocity he wants this step.
function guyWants(g, h) {
    const at = g.thing.body.getPosition();

    g.faceTo = null;
    if (!g.leaving && !things.some(t => !isGuy(t) && onTable(t))) {
        letGoOfJob(g);
        // the nearest of the spots things used to be
        const homes = things.filter(t => t.home && !isGuy(t)).map(t => t.home)
            .sort((a, b) => Vec2.distance(a, at) - Vec2.distance(b, at));
        // the first of them to notice says it, once for all
        if (!guys.some(o => o.leaving)) allIsLost();
        g.leaving = { phase: 'frozen', t: 0, looks: homes.slice(0, GUY_SAD_LOOKS) };
    }
    if (g.leaving) return leaving(g, at, h);

    // Half the slack to finish as to start, so he doesn't twitch at the
    // threshold.
    const j = g.job;
    if (j && (!onTable(j) || (isTidy(j, 0.5) && !isHeld(j.body)))) letGoOfJob(g);
    // drop what he's doing for anything the player has just grabbed
    if (g.job && !isHeld(g.job.body) && !g.grip) {
        const grabbed = things.find(t => !isGuy(t) && t.home && onTable(t) && isHeld(t.body));
        if (grabbed) g.job = null;
    }
    if (!g.job) {
        g.job = pickJob(g);
        g.best = Infinity;
        g.stuck = 0;
    }
    if (!g.job) return walkTo(at, g.rest, GUY_WALK_SPEED);

    const t = g.job, p = t.body.getPosition();
    const toGuy = Vec2.sub(at, p);
    const apart = toGuy.length();
    const side = apart > 1e-6 ? Vec2.mul(toGuy, 1 / apart) : Vec2(1, 0);
    const touching = reachToward(t, side) + GUY_R_MM / 1000;
    const dist = Vec2.distance(p, t.home);

    // Running to it counts as progress as much as hauling it does, so he
    // can't stand wedged somewhere forever.
    const left = dist + (g.grip ? 0 : Math.max(0, apart - touching));
    if (left < g.best - 0.005) { g.best = left; g.stuck = 0; }
    else if ((g.stuck += h) > GUY_PATIENCE) {
        g.sulks.set(t, g.clock + GUY_SULK_TIME);
        letGoOfJob(g);
        return Vec2(0, 0);
    }

    if (!g.grip) {
        if (apart > touching + GUY_REACH_MM / 1000) {
            return walkTo(at, standable(Vec2.add(p, Vec2.mul(side, touching))), GUY_WALK_SPEED);
        }
        // Got it: grab the near edge, and keep to the side he grabbed it from.
        const edge = Vec2.add(p, Vec2.mul(side, touching - GUY_R_MM / 1000));
        g.grip = world.createJoint(planck.MouseJoint({
            maxForce: GUY_GRIP_FORCE,
            frequencyHz: GUY_GRIP_HZ,
            dampingRatio: 0.9,
        }, cloth, t.body, edge));
        g.hold = Vec2.mul(side, touching);
        g.carry = Vec2.clone(edge);
    }

    // Haul: the point he pulls toward runs ahead to home at carrying speed,
    // and he runs along beside it.
    const grabbed = g.grip.getAnchorB();
    const goal = Vec2.add(t.home, Vec2.sub(grabbed, p));
    const ahead = Vec2.sub(goal, g.carry), aheadLen = ahead.length();
    const stepLen = Math.min(aheadLen, GUY_CARRY_SPEED * h);
    if (aheadLen > 1e-6) g.carry = Vec2.add(g.carry, Vec2.mul(ahead, stepLen / aheadLen));
    g.grip.setTarget(g.carry);
    // keep pace with it, plus close whatever gap has opened
    return Vec2.add(t.body.getLinearVelocity(), walkTo(at, standable(Vec2.add(p, g.hold)), GUY_WALK_SPEED));
}

// Counts the objects that have gone over the edge since the last step. Each one
// calls for backup, unless it was the last: then there's nobody left to call
// for, and the ending plays instead.
function noticeDrops() {
    for (const t of things) {
        if (isGuy(t) || t.fall === undefined || countedDrops.has(t)) continue;
        countedDrops.add(t);
        if (!things.some(o => !isGuy(o) && onTable(o))) continue;
        callForBackup();
        backups.push({ at: guyClock + GUY_BACKUP_DELAY, pos: standable(t.edgeAt) });
    }
}

// A backup climbs up where the object fell, lying flat the way a guy knocked
// off the table does, and his rest spot is where he arrived.
function arriveBackups() {
    backups = backups.filter(b => {
        if (b.at > guyClock) return true;
        addGuy(b.pos.x * 1000, b.pos.y * 1000).down = GUY_STUN_TIME;
        return false;
    });
}

// Runs once per physics step.
function stepGuys(h) {
    guyClock += h;
    noticeDrops();
    arriveBackups();
    for (const g of guys) stepGuy(g, h);
}

function stepGuy(g, h) {
    const t = g.thing, b = t.body;
    g.clock += h;

    if (!onTable(t)) {
        g.expect = null;
        letGoOfJob(g);
        if (!g.leaving && t.fall > GUY_CLIMB_TIME) {
            // knocked off with work still to do: he climbs back on where he went over
            b.setTransform(standable(t.fallAt), 0);
            b.setLinearVelocity(Vec2(0, 0));
            b.setActive(true);
            t.fall = undefined;
            g.down = GUY_STUN_TIME;
        }
        return;
    }

    const v = b.getLinearVelocity();
    const m = b.getMass();
    if (g.expect && Vec2.distance(v, g.expect) > GUY_KNOCK_SPEED + GUY_FORCE * h / m) knockDown(g);
    g.expect = null;
    if (isHeld(b)) g.down = Math.max(g.down, GUY_STUN_TIME);
    if (g.floored) {
        g.flatAngle = v.length() > 0.05 ? Math.atan2(v.y, v.x) : g.facing;
        g.floored = false;
    }

    if (g.down > 0) {
        letGoOfJob(g);     // nobody keeps hold of anything lying flat, or held up by the scruff
        g.down = Math.max(0, g.down - h);
        g.expect = Vec2.clone(v);
        applyFeelTo(t);   // back on the cloth's friction, like everything else
        return;
    }
    t.friction.setMaxForce(0);
    t.friction.setMaxTorque(0);

    const want = guyWants(g, h);
    const f = Vec2.mul(Vec2.sub(want, v), m / h);
    const fl = f.length();
    if (fl > GUY_FORCE) f.mul(GUY_FORCE / fl);
    b.applyForceToCenter(f, true);
    g.expect = Vec2.add(v, Vec2.mul(f, h / m));

    const speed = v.length();
    g.stride += speed * h * 1000;
    // He faces what he's holding, otherwise where he's going.
    let face = g.facing;
    if (g.faceTo !== null) {
        face = g.faceTo;
    } else if (g.grip) {
        const hands = g.grip.getAnchorB();
        face = Math.atan2(hands.y - b.getPosition().y, hands.x - b.getPosition().x);
    } else if (speed > 0.05) {
        face = Math.atan2(v.y, v.x);
    }
    let turn = face - g.facing;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    // brisk at work; slow once there's nothing left
    g.facing += turn * Math.min(1, h * (g.leaving ? 2.5 : 12));
}

// His look, from Paul's references: gangly and fussy, a big head with ears,
// a small body, stick limbs, and splayed three-digit hands and feet. Seen from
// straight above like everything else, in mm, facing +x.

// Three short digits fanned out from a point, pointing along angle a.
function splay(c, x, y, a, len) {
    for (const k of [-0.6, 0, 0.6]) {
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a + k) * len, y + Math.sin(a + k) * len);
    }
}

// A limb from (x0, y0) to (x1, y1), ending in a splayed hand or foot.
function limb(c, x0, y0, x1, y1, digits) {
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    splay(c, x1, y1, Math.atan2(y1 - y0, x1 - x0), digits);
}

function drawHead(c, x) {
    c.beginPath();
    for (const s of [-1, 1]) c.ellipse(x, s * 13, 4, 6, 0, 0, Math.PI * 2);   // ears
    inkShape(c);
    c.beginPath();
    ring(c, x, 0, 13);
    inkShape(c);
}

// Running, legs and arms swinging opposite each other; reaching out in front
// with both hands while he has hold of something. Once there's nothing left,
// he slumps: short steps, arms hanging, head hung forward.
function drawGuyStanding(c, g) {
    c.rotate(g.facing);
    const swing = Math.sin(g.stride / GUY_STRIDE_MM * Math.PI);
    const sad = !!g.leaving;
    c.beginPath();
    for (const s of [-1, 1]) {
        limb(c, -2, s * 5, swing * s * (sad ? 7 : 16), s * 9, 5);
        if (g.grip) limb(c, 2, s * 11, 24, s * 8, 6);
        else if (sad) limb(c, -1, s * 10, -swing * s * 3 - 2, s * 15, 5);
        else limb(c, 0, s * 11, -swing * s * 13, s * 26, 6);
    }
    inkLine(c);
    c.beginPath();
    c.ellipse(-3, 0, 7, sad ? 10 : 12, 0, 0, Math.PI * 2);
    inkShape(c);
    drawHead(c, sad ? 9 : 3);
}

// Flat on his back, arms and legs flung out, laid the way he was knocked.
function drawGuyFlat(c, g) {
    c.rotate(g.flatAngle);
    c.beginPath();
    for (const s of [-1, 1]) {
        limb(c, -12, s * 5, -40, s * 18, 5);   // legs
        limb(c, 6, s * 10, 18, s * 38, 6);     // arms
    }
    inkLine(c);
    c.beginPath();
    c.ellipse(-4, 0, 12, 9, 0, 0, Math.PI * 2);
    inkShape(c);
    drawHead(c, 20);
}
