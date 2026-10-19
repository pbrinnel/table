// The little guys. The first runs around grabbing things and hauling them back
// to where they started, fast. On foot he steers around whatever's in his way
// and goes easy on it when he has to squeeze past; once he has hold of
// something, what he hauls shoves aside whatever's in its way. His grip is a
// capped spring like the player's, so heavy things still drag on him. Anything
// that hits him hard enough knocks him flat for a while. With nothing to do, a
// guy wanders, spreading out from the other idle guys. Every time an object
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

// Wandering: with no job, a guy ambles to a spot picked to be far from the other
// idle guys, and eases off any who come close, so they spread out evenly.
const GUY_WANDER_PACE = 0.5;     // fraction of GUY_WALK_SPEED; an amble, not a run
const GUY_ROAM_TIME = 6;         // seconds on one wander spot before he picks another
const GUY_SPREAD_MM = 300;       // idle guys closer than this push each other apart
const GUY_SPREAD = 0.25;         // m/s of push at touching, fading to nothing at GUY_SPREAD_MM
const GUY_ROAM_PICKS = 6;        // random spots he weighs when choosing the next
// Steering: on foot, not hauling, he looks ahead and bends his path around
// whatever is there, rather than shoving it.
const GUY_STEER_DIRS = 16;       // directions he considers
const GUY_LOOK_MM = 150;         // how far ahead he looks
// Rays cast side by side per direction, across his body plus GUY_CLEAR_MM each
// side. Close enough together that a knife can't slip between two.
const GUY_STEER_RAYS = 5;
const GUY_CLEAR_MM = 10;         // elbow room beside his body that must be clear too
const GUY_STEER_STICK = 0.15;    // how much he favors keeping last step's heading, so he doesn't dither
const GUY_SQUEEZE_PACE = 0.25;   // his pace while brushing past something, and the slowest he steers, as a fraction of the pace he wanted
// Touching something that isn't his job, his push drops to this: less than the
// force a dinner plate needs to slide (about 2 N), so squeezing past can't shove it.
const GUY_SQUEEZE_FORCE = 1;     // newtons

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
    slick: true,
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
        roam: null,       // where he's wandering to, in meters, while idle
        roamT: 0,         // seconds spent on that spot
        steerDir: null,   // the direction he chose last step, so he doesn't dither
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
// free, he wanders.
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

// Walking on foot, not hauling: the same, bent around whatever is in the way.
function walkAround(g, at, to, top) {
    return steer(g, walkTo(at, to, top), Vec2.distance(at, to));
}

// Ray casts for steer(), kept here so the inner loop allocates nothing.
const steerFrom = planck.Vec2(0, 0), steerTo = planck.Vec2(0, 0);
let steerSelf = null, steerJob = null, steerHit = 1;
const steerDirX = [], steerDirY = [];
for (let i = 0; i < GUY_STEER_DIRS; i++) {
    steerDirX.push(Math.cos(i / GUY_STEER_DIRS * Math.PI * 2));
    steerDirY.push(Math.sin(i / GUY_STEER_DIRS * Math.PI * 2));
}

// Is the point inside anything he'd steer around? A ray that starts inside a
// shape never reports hitting it, so a ray from a shoulder already against the
// tray's rim would see a clear run along it.
let steerInside = false;
function steerTouches(fixture) {
    const b = fixture.getBody();
    if (b === steerSelf || b === steerJob || !fixture.testPoint(steerFrom)) return true;
    steerInside = true;
    return false;
}

// Planck's rayCast callback: -1 skips a fixture, the fraction clips the ray to it.
function steerSees(fixture, point, normal, fraction) {
    const b = fixture.getBody();
    if (b === steerSelf || b === steerJob) return -1;
    if (fraction < steerHit) steerHit = fraction;
    return fraction;
}

// How far, in meters (at most GUY_LOOK_MM), he can walk from `at` along the unit
// direction (dx, dy) before reaching something or the table's edge. Parallel
// rays side by side, from past one shoulder to past the other.
function freeAlong(at, dx, dy) {
    const r = GUY_R_MM / 1000, look = GUY_LOOK_MM / 1000, len = look + r;
    const side = r + GUY_CLEAR_MM / 1000;
    let hit = 1;
    const half = (GUY_STEER_RAYS - 1) / 2;
    for (let k = -half; k <= half; k++) {
        const across = side * k / half;
        steerFrom.x = at.x - dy * across;
        steerFrom.y = at.y + dx * across;
        steerTo.x = steerFrom.x + dx * len;
        steerTo.y = steerFrom.y + dy * len;
        steerInside = false;
        world.queryAABB(planck.AABB(steerFrom, steerFrom), steerTouches);
        if (steerInside) return 0;
        steerHit = 1;
        world.rayCast(steerFrom, steerTo, steerSees);
        if (steerHit < hit) hit = steerHit;
    }
    const free = Math.min(look, Math.max(0, hit * len - r));
    // the table's edge is a wall: how far is he still inside where he can stand?
    const hw = TABLE_W_MM / 2000 - r, hh = TABLE_H_MM / 2000 - r;
    const tx = dx > 1e-6 ? (hw - at.x) / dx : dx < -1e-6 ? (-hw - at.x) / dx : Infinity;
    const ty = dy > 1e-6 ? (hh - at.y) / dy : dy < -1e-6 ? (-hh - at.y) / dy : Infinity;
    return Math.min(free, Math.max(0, Math.min(tx, ty)));
}

// Close range, where the rays can miss a corner between them: is anything within
// GUY_CLEAR_MM of his body, here or a little way along (dx, dy)? Points round a
// ring, tested against whatever overlaps them.
const NEAR_POINTS = 12;
function crowded(at, dx, dy) {
    const ring = (GUY_R_MM + GUY_CLEAR_MM) / 1000;
    for (const ahead of [0, GUY_CLEAR_MM, GUY_CLEAR_MM * 2]) {
        for (let i = 0; i < NEAR_POINTS; i++) {
            const a = i / NEAR_POINTS * Math.PI * 2;
            steerFrom.x = at.x + dx * ahead / 1000 + Math.cos(a) * ring;
            steerFrom.y = at.y + dy * ahead / 1000 + Math.sin(a) * ring;
            steerInside = false;
            world.queryAABB(planck.AABB(steerFrom, steerFrom), steerTouches);
            if (steerInside) return true;
        }
    }
    return false;
}

// Context steering. `want` is the velocity he'd like (m/s) and toGo how far he
// is from where it leads; this returns the velocity to use instead. Of the
// directions around him, he takes the one that best matches where he wants to
// go while being clear ahead, and slows as it closes in.
function steer(g, want, toGo) {
    const speed = want.length();
    if (speed < 1e-4) return want;
    const look = GUY_LOOK_MM / 1000;
    const wx = want.x / speed, wy = want.y / speed;
    steerSelf = g.thing.body;
    steerJob = g.job ? g.job.body : null;
    const at = steerSelf.getPosition();

    // nothing in the way before the target: just go, unless something is close
    // enough to brush
    const ahead = freeAlong(at, wx, wy);
    if (ahead >= look || ahead > toGo) {
        g.steerDir = Vec2(wx, wy);
        return crowded(at, wx, wy) ? Vec2.mul(want, GUY_SQUEEZE_PACE) : want;
    }

    const sd = g.steerDir;
    let best = 0, bestI = -1, bestFree = 0;
    for (let i = 0; i < GUY_STEER_DIRS; i++) {
        const dx = steerDirX[i], dy = steerDirY[i];
        let interest = Math.max(0, dx * wx + dy * wy);
        if (sd) interest += GUY_STEER_STICK * Math.max(0, dx * sd.x + dy * sd.y);
        if (interest <= 0) continue;
        const free = freeAlong(at, dx, dy) / look;
        const score = interest * free;     // interest * (1 - danger)
        if (score > best) { best = score; bestI = i; bestFree = free; }
    }
    if (bestI < 0) {
        g.steerDir = null;
        return Vec2.mul(want, GUY_SQUEEZE_PACE);    // boxed in: creep
    }
    g.steerDir = Vec2(steerDirX[bestI], steerDirY[bestI]);
    const pace = crowded(at, g.steerDir.x, g.steerDir.y) ? GUY_SQUEEZE_PACE : Math.max(GUY_SQUEEZE_PACE, bestFree);
    return Vec2.mul(g.steerDir, speed * pace);
}

// Standing, not knocked down, and nothing to do.
function isIdle(g) {
    return !g.job && g.down <= 0 && !g.leaving && onTable(g.thing);
}

// Is there an object (not a guy) where he'd stand at p? Tested at a grid of
// points across his body, since the broad phase only narrows it down.
function spotTaken(p) {
    const r = GUY_R_MM / 1000;
    let taken = false;
    world.queryAABB(planck.AABB(Vec2(p.x - r, p.y - r), Vec2(p.x + r, p.y + r)), fixture => {
        if (guys.some(o => o.thing.body === fixture.getBody())) return true;
        for (let i = -2; i <= 2 && !taken; i++) {
            for (let j = -2; j <= 2 && !taken; j++) {
                taken = fixture.testPoint(Vec2(p.x + i * r / 2, p.y + j * r / 2));
            }
        }
        return !taken;
    });
    return taken;
}

// The next wander spot: of a few random ones, the one furthest from every other
// idle guy (where he is, or where he's headed), which is what spreads them out.
function pickRoam(g) {
    const hw = TABLE_W_MM / 2000 - GUY_R_MM * 3 / 1000, hh = TABLE_H_MM / 2000 - GUY_R_MM * 3 / 1000;
    let pick = null, far = -1;
    for (let i = 0; i < GUY_ROAM_PICKS; i++) {
        const p = Vec2((Math.random() * 2 - 1) * hw, (Math.random() * 2 - 1) * hh);
        let near = Infinity;
        if (spotTaken(p)) near = -1;     // never a spot under something: he'd just lean on it
        for (const o of guys) {
            if (near < 0) break;
            if (o === g || !isIdle(o)) continue;
            near = Math.min(near, Vec2.distance(p, o.thing.body.getPosition()));
            if (o.roam) near = Math.min(near, Vec2.distance(p, o.roam));
        }
        if (pick === null || near > far) { far = near; pick = p; }
    }
    g.roam = pick;
    g.roamT = 0;
}

// Idle: amble toward the wander spot, easing away from idle guys who come close.
function wander(g, at, h) {
    if (!g.roam || (g.roamT += h) > GUY_ROAM_TIME || Vec2.distance(at, g.roam) < 0.03) pickRoam(g);
    const top = GUY_WALK_SPEED * GUY_WANDER_PACE;
    const want = walkTo(at, g.roam, top);
    const range = GUY_SPREAD_MM / 1000;
    for (const o of guys) {
        if (o === g || !isIdle(o)) continue;
        const away = Vec2.sub(at, o.thing.body.getPosition()), d = away.length();
        if (d >= range) continue;
        const push = GUY_SPREAD * (1 - d / range);
        if (d > 1e-6) want.addMul(push / d, away);
        else want.x += push;
    }
    const sp = want.length();
    if (sp > top) want.mul(top / sp);
    return steer(g, want, Vec2.distance(at, g.roam));
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
    if (g.leaving) {
        g.steerDir = null;
        return leaving(g, at, h);
    }

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
    if (!g.job) return wander(g, at, h);
    g.roam = null;      // a fresh spot is picked the next time he's idle

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
            return walkAround(g, at, standable(Vec2.add(p, Vec2.mul(side, touching))), GUY_WALK_SPEED);
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
    g.steerDir = null;
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
// off the table does.
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

// Touching anything but his job, he slides along it rather than leaning into it:
// takes out of `want` any part that points into what he's touching, and says
// whether he's touching anything at all. Even a light push held for a while
// creeps a knife along the cloth, so the only safe push is none.
function sidestep(b, job, want) {
    let touching = false;
    for (let e = b.getContactList(); e; e = e.next) {
        const c = e.contact;
        if (!c.isTouching() || (job && e.other === job.body)) continue;
        touching = true;
        const n = c.getWorldManifold(null).normal;
        // the normal points from fixture A to fixture B; turn it to point away from him
        const s = c.getFixtureA().getBody() === b ? 1 : -1;
        const into = (want.x * n.x + want.y * n.y) * s;
        if (into > 0) { want.x -= n.x * s * into; want.y -= n.y * s * into; }
    }
    return touching;
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
    // squeezing past something that isn't his job, he can't shove it; hauling is different
    const squeezing = !g.grip && sidestep(b, g.job, want);
    if (squeezing) want.mul(GUY_SQUEEZE_PACE);
    const f = Vec2.mul(Vec2.sub(want, v), m / h);
    const fl = f.length();
    const cap = squeezing ? GUY_SQUEEZE_FORCE : GUY_FORCE;
    if (fl > cap) f.mul(cap / fl);
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
