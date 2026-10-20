// The little guys. The first runs around grabbing things and hauling them back
// to where they started, fast. On foot he steers around whatever's in his way
// and goes easy on it when he has to squeeze past; once he has hold of
// something, what he hauls shoves aside whatever's in its way. His grip is a
// capped spring like the player's, so heavy things still drag on him. Anything
// that hits him hard enough knocks him flat for a while. With nothing to do, a
// guy wanders, spreading out from the other idle guys. Every time an object
// goes over the edge (and something is still left), he calls for backup and one
// more guy comes out from under something on the table, for the rest of the
// run. They share the
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
// His hands pull a thing with at most this share of the player's DRAG_MAX_FORCE.
// In a tug of war guys' pulls add up, so below a half the player beats two of
// them, and above a third three beat the player (Paul). Within that, it's set
// high enough that one guy alone can slide the heaviest piece (the charger
// setting).
const GUY_GRIP_SHARE = 0.45;
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
const GUY_TIDY_ANGLE = 0.08;     // radians: this near its starting angle too, where its angle shows
// Setting down: within GUY_SETDOWN_MM of home he stops hauling, lifts it, turns
// it to its starting angle and sets it exactly in place, over GUY_SETDOWN_TIME,
// so the last few cm are careful rather than a tussle with the spring.
const GUY_SETDOWN_MM = 40;
const GUY_SETDOWN_TIME = 0.45;   // seconds
const GUY_SETDOWN_GAP_MM = 6;    // how far clear of its home he stands to do it
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
// Hauling with care: when what he's dragging is about to bump something, or is
// touching it, he slows to this fraction of GUY_CARRY_SPEED and keeps his pull
// point close behind it, so it nudges what's in the way rather than launching it.
const GUY_HAUL_CARE = 0.2;
const GUY_HAUL_LEAD_MM = 15;     // furthest his pull point runs ahead of his hands while careful

// Putting a fallen piece back on what it rested on (DESIGN.md, "levels"): he
// hauls it beside the stack, climbs up to the level above that support, lifts
// it on, climbs down. Being higher shows as being a little bigger, seen from
// above. The climbs take their time per level climbed.
const GUY_CLIMB_UP_TIME = 0.7;   // seconds per level
const GUY_LIFT_TIME = 0.6;       // seconds
const GUY_CLIMB_DOWN_TIME = 0.5; // seconds per level
const GUY_UP_SCALE = 1.12;       // how much bigger he looks one level up
const GUY_LIFT_BUMP = 0.12;      // how much bigger the cup looks at the top of its lift
const GUY_LIFT_REACH_MM = 30;    // this close to its spot beside the saucer, he starts
const GUY_LIFT_SHIFT_MM = 30;    // the saucer moving this far under him ends it
const GUY_FALLEN_FIRST = 0.5;    // m added to a fallen cup's claim on him, so it comes first
const GUY_PARK_MM = 50;          // steps out from a squatter when looking for somewhere to park it
const GUY_ANGLE_CLAIM = 0.05;    // m of claim on him per radian a thing is turned off its start
const GUY_SIDE_TRIES = 8;        // steps each way round a fallen cup looking for room to grab it
// Stuck on foot, going nowhere for GUY_STALL_TIME, he climbs over what's in his
// way to the first clear spot past it, the way he climbs up onto a stack. With
// nowhere clear to get to, he barges instead, pushing with his full GUY_FORCE.
const GUY_STALL_SPEED = 0.03;    // m/s: slower than this while trying to go somewhere is stuck
const GUY_STALL_TIME = 1;        // seconds
const GUY_CLIMB_OVER_SPEED = 0.25; // m/s across the top
const GUY_OVER_LOOK_MM = 400;    // how far past himself he looks for somewhere to come down
const GUY_BARGE_TIME = 1.5;      // seconds

// How a backup arrives (DESIGN.md, "The little guy"): out from under the napkin
// if it's on the table (GUY_NAP_*), else from under the nearest round thing
// that lies on the cloth (GUY_PEEK_*). Times are seconds, lengths mm, angles
// radians, from the spawn lab's candidates 1c2 and 1a.
const GUY_ENTER_MOVE_MM = 20;    // the thing he's under moving this far ends it
const GUY_ENTER_TURN = 0.3;      // or turning this far
const GUY_ENTER_DIRS = 16;       // directions tried for a clear spot to come out at
// With nothing free to come out from under, a backup waits up to
// GUY_BACKUP_WAIT for something to come free; if nothing does, he doesn't come
// (Paul): a guy only ever arrives from somewhere he could have been hiding.
const GUY_BACKUP_WAIT = 3;       // seconds

// 1a: the thing's rim lifts on the side he comes out on, he peeks and looks both
// ways, wriggles out, stands and shakes himself off.
const GUY_PEEK_SQUASH = 0.8;     // the thing's width at its most lifted, as a fraction (it tips about its far rim)
const GUY_PEEK_HIDE_MM = -7;     // his center, from the thing's center, while hidden
const GUY_PEEK_PEEK_MM = -32;    // from its rim, while he peeks
const GUY_PEEK_OUT_MM = 50;      // from its rim, once he's crawled out
const GUY_PEEK_STEP_MM = 10;     // the step he takes standing up
const GUY_PEEK_LIFT_T0 = 0.4, GUY_PEEK_LIFT_T = 0.5;
const GUY_PEEK_HEAD_T = 0.5;     // his head comes out
const GUY_PEEK_LOOK_T = 2.0, GUY_PEEK_LOOK_SWINGS = 1.5, GUY_PEEK_LOOK_ANGLE = 0.6;   // swings are full cycles over LOOK_T
const GUY_PEEK_OUT_T = 1.6;      // wriggling out
const GUY_PEEK_WRIGGLE_HZ = 2;
const GUY_PEEK_SETTLE_T = 0.4;   // the thing comes back down as he gets out
const GUY_PEEK_RISE_T = 0.7;
const GUY_PEEK_SHAKE_T = 1.5, GUY_PEEK_SHAKE_HZ = 3, GUY_PEEK_SHAKE_ANGLE = 0.55;
const GUY_PEEK_HOLD_T = 0.4;

// 1c2: a corner of the napkin tips up about its fold, passing edge-on and
// showing its plain underside, he crawls out under it, it drops back with a
// bounce, and he rises and brushes himself off.
const GUY_NAP_FOLD_MM = 32;      // the fold lies this far back from the corner, across it
const GUY_NAP_START_MM = -50;    // his center along the corner's diagonal, from the corner, while hidden
const GUY_NAP_OUT_MM = 44;       // once he's crawled out
const GUY_NAP_STAND_MM = 54;     // standing
const GUY_NAP_TWITCH_T0 = 0.3, GUY_NAP_TWITCH_T = 0.6, GUY_NAP_TWITCH_HZ = 2, GUY_NAP_TWITCH = 0.25;   // the corner stirs
const GUY_NAP_LIFT_T0 = 1.0, GUY_NAP_LIFT_T = 0.9;
const GUY_NAP_CRAWL_T = 2.4, GUY_NAP_WRIGGLE_HZ = 2;
const GUY_NAP_RISE_T = 0.9, GUY_NAP_RISE_TILT = 0.95;
const GUY_NAP_DROP_T0 = 0.5, GUY_NAP_DROP_T = 0.5;   // the corner drops, from this long into his rise
const GUY_NAP_BOUNCE = 0.35, GUY_NAP_BOUNCE_DECAY = 5, GUY_NAP_BOUNCE_HZ = 1.2;
const GUY_NAP_BRUSH_T = 1.5, GUY_NAP_BRUSH_HZ = 2.5;
const GUY_NAP_HOLD_T = 0.4;

const GUY_R_MM = 25;             // his collision circle
const GUY_REACH_MM = 12;         // how far past touching he can still get his hands on it
const GUY_STRIDE_MM = 22;        // how far one step of his feet carries him
// Picked up, he flails: arms and legs thrash back and forth this many times a
// second, through GUY_FLAIL_SWING radians either way. Limbs moving, not light
// and dark trading places, so it isn't a flash.
const GUY_FLAIL_HZ = 2.5;
const GUY_FLAIL_SWING = 0.8;

// Every guy, the first and each backup. Each has his own body and his own grip.
let guys = [];
// Backups on their way: { at: guyClock time they're due, edge: where the object
// went over, in meters, waited: whether they've already waited for cover }
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
        if (isHeld(t.body)) drawGuyFlailing(c, t.guy);
        else if (t.guy.entrance) drawGuyEntrance(c, t.guy);
        else if (t.guy.down > 0) drawGuyFlat(c, t.guy);
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
        entrance: null,   // while he comes out from under something: see startEntrance()
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
function reachToward(t, d, angle) {
    const a = angle === undefined ? t.body.getAngle() : angle, cos = Math.cos(a), sin = Math.sin(a);
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

// A piece that started resting on another is put back once it's on it again,
// wherever that one is; the bottom of a stack is put back like anything else.
function isTidy(t, slack) {
    const turned = turnShows(t) && angleOff(t) > GUY_TIDY_ANGLE * slack;
    if (t.homeOn) return t.on === t.homeOn && !turned;
    return !turned && Vec2.distance(t.body.getPosition(), t.home) < GUY_TIDY_MM * slack / 1000;
}

// Whether which way round a thing sits can be seen: not for a plate or a glass,
// a single circle with nothing sticking out.
function turnShows(t) {
    const p = t.kind.pieces;
    return !!t.kind.facing || !(p.length === 1 && p[0].circle && !p[0].x && !p[0].y);
}

// How far it's turned from its starting angle, either way, in radians.
function angleOff(t) {
    const d = t.body.getAngle() - t.homeAngle;
    return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
}

// Whether point p (meters) is within `margin` of t's footprint as it sits at
// home: its pieces placed at its home spot and angle.
function inHomeFootprint(t, p, margin) {
    const c = Math.cos(-t.homeAngle), s = Math.sin(-t.homeAngle);
    const dx = (p.x - t.home.x) * 1000, dy = (p.y - t.home.y) * 1000;
    const lx = dx * c - dy * s, ly = dx * s + dy * c, m = margin * 1000;
    return t.kind.pieces.some(q => {
        const x = lx - (q.x || 0), y = ly - (q.y || 0);
        if (q.circle) return Math.hypot(x, y) < q.circle + m;
        const a = -(q.angle || 0), u = x * Math.cos(a) - y * Math.sin(a), v = x * Math.sin(a) + y * Math.cos(a);
        return Math.abs(u) < q.box[0] / 2 + m && Math.abs(v) < q.box[1] / 2 + m;
    });
}

// Whatever sits on t's home spot on the cloth now, guys included: tested at
// points across its footprint there.
function homeBlockers(t) {
    const c = Math.cos(t.homeAngle), s = Math.sin(t.homeAngle), pts = [];
    for (const q of t.kind.pieces) {
        const r = q.circle ? [[0, 0], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.cos(i * Math.PI / 4) * q.circle * 0.75, Math.sin(i * Math.PI / 4) * q.circle * 0.75])]
            : [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [i * q.box[0] * 0.4, j * q.box[1] * 0.4]);
        for (const [x, y] of r) {
            const lx = x + (q.x || 0), ly = y + (q.y || 0);
            pts.push(Vec2(t.home.x + (lx * c - ly * s) / 1000, t.home.y + (lx * s + ly * c) / 1000));
        }
    }
    return things.filter(o => o !== t && onTable(o) && o.drop === undefined && !o.lifted
        && o.level === LEVEL_ON_CLOTH && pts.some(p => {
            for (let f = o.body.getFixtureList(); f; f = f.getNext()) if (f.testPoint(p)) return true;
            return false;
        }));
}

// Somewhere near t to leave it for now: on the table, clear of what's on the
// cloth, and on nobody's home spot, its own included. Null if nowhere is.
function parkingFor(t) {
    const p = t.body.getPosition(), r = reachOf(t);
    for (let d = GUY_PARK_MM; d <= GUY_PARK_MM * 6; d += GUY_PARK_MM) {
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6, spot = Vec2.add(p, Vec2(Math.cos(a) * d / 1000, Math.sin(a) * d / 1000));
            if (Math.abs(spot.x) > TABLE_W_MM / 2000 - r || Math.abs(spot.y) > TABLE_H_MM / 2000 - r) continue;
            const clear = !things.some(o => o !== t && onTable(o) && o.level === LEVEL_ON_CLOTH
                && (Vec2.distance(spot, o.body.getPosition()) < reachOf(o) + r
                    || (o.home && !isGuy(o) && !o.homeOn && inHomeFootprint(o, spot, r))))
                && !inHomeFootprint(t, spot, r);
            if (clear) return spot;
        }
    }
    return null;
}

// An out-of-place thing squatting on t's home, free to be moved first, if any.
function squatterOn(g, t) {
    if (t.homeOn) return null;
    return homeBlockers(t).find(o => !isGuy(o) && o.home && !isTidy(o, 1) && !busy(o) && !isHeld(o.body)
        && !guys.some(x => x !== g && x.job === o)) || null;
}

// Where he hauls a thing to: home, or for a fallen piece the cloth just beside
// the stack it goes back on, on the side it's on, ready to be lifted up.
function goalOf(t) {
    if (t.parkAt) return t.parkAt;
    if (!t.homeOn || t.on) return t.home;
    const base = baseOf(t.homeOn), bp = base.body.getPosition();
    let side = Vec2.sub(t.body.getPosition(), bp);
    if (side.length() < 1e-6) side = Vec2(1, 0);
    side.normalize();
    return Vec2.add(bp, Vec2.mul(side, reachOf(base) + reachOf(t) + DROP_GAP_MM / 1000));
}

// The side of t to stand on, as near as there's room to the direction he'd
// like: tries `want` first, then turns away from it a step at a time either way.
function roomySide(g, t, want) {
    const p = t.body.getPosition();
    const base = want.length() > 1e-6 ? Math.atan2(want.y, want.x) : 0;
    for (let i = 0; i <= GUY_SIDE_TRIES; i++) {
        for (const sgn of i ? [1, -1] : [1]) {
            const a = base + sgn * i * Math.PI / GUY_SIDE_TRIES;
            const side = Vec2(Math.cos(a), Math.sin(a));
            const spot = Vec2.add(p, Vec2.mul(side, reachToward(t, side) + GUY_R_MM / 1000));
            if (hasRoom(g, spot, t)) return side;
        }
    }
    return Vec2(Math.cos(base), Math.sin(base));
}

// Whether he'd fit standing at spot: on the table, and clear of everything on
// his level but `except`, judged by each thing's widest reach.
function hasRoom(g, spot, except) {
    if (Vec2.distance(spot, standable(spot)) > 1e-4) return false;
    return !things.some(o => o !== except && o !== g.thing && onTable(o) && o.drop === undefined
        && o.level === g.thing.level
        && Vec2.distance(spot, o.body.getPosition()) < reachToward(o, unitFrom(o.body.getPosition(), spot)) + GUY_R_MM / 1000);
}

function unitFrom(a, b) {
    const d = Vec2.sub(b, a), len = d.length();
    return len > 1e-6 ? Vec2.mul(d, 1 / len) : Vec2(1, 0);
}

// A support is ready to have its piece put back on it when it's back in its own
// place: on what it started on, or on the cloth if it started there.
function settled(s) {
    return onTable(s) && s.drop === undefined && !s.lifted && (s.homeOn ? s.on === s.homeOn : !s.on);
}

// Not to be taken on: tipping down a level, or in some guy's hands, or the
// saucer another guy is standing on, or what a backup is coming out from under.
function busy(t) {
    return t.drop !== undefined || t.lifted
        || guys.some(o => (o.lift && o.lift.saucer === t) || (o.entrance && o.entrance.src === t));
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
        if (!t.home || isGuy(t) || !onTable(t) || busy(t)) continue;
        // the stack goes back from the bottom up
        if (t.homeOn && !t.on && !settled(t.homeOn)) continue;
        if ((g.sulks.get(t) || 0) > g.clock || isTidy(t, 1)) continue;
        if (guys.some(o => o !== g && o.job === t)) continue;
        const d = Vec2.distance(t.body.getPosition(), goalOf(t)) + (t.homeOn && !t.on ? GUY_FALLEN_FIRST : 0)
            + angleOff(t) * GUY_ANGLE_CLAIM;
        if (d > far) { far = d; pick = t; }
    }
    // whatever's sitting on its home goes first, or it has nowhere to go
    return (pick && squatterOn(g, pick)) || pick;
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

// Is what he's hauling about to bump into something (not a guy) along its way
// home, or already touching it? Rays from its center and from near either side,
// as far as it reaches plus GUY_LOOK_MM.
let haulSelf = null, haulHit = false;
function haulSees(fixture) {
    const b = fixture.getBody();
    if (b === haulSelf || guys.some(o => o.thing.body === b)) return -1;
    haulHit = true;
    return 0;
}
function haulBlocked(t, dx, dy) {
    const b = t.body;
    for (let e = b.getContactList(); e; e = e.next) {
        if (e.contact.isTouching() && !guys.some(o => o.thing.body === e.other)) return true;
    }
    const p = b.getPosition();
    const len = reachToward(t, Vec2(dx, dy)) + GUY_LOOK_MM / 1000;
    const wide = Math.min(reachToward(t, Vec2(-dy, dx)), reachToward(t, Vec2(dy, -dx))) * 0.9;
    haulSelf = b;
    haulHit = false;
    for (const k of [-1, 0, 1]) {
        steerFrom.x = p.x - dy * wide * k;
        steerFrom.y = p.y + dx * wide * k;
        steerTo.x = steerFrom.x + dx * len;
        steerTo.y = steerFrom.y + dy * len;
        world.rayCast(steerFrom, steerTo, haulSees);
        if (haulHit) return true;
    }
    return false;
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
    return !g.job && g.down <= 0 && !g.leaving && !g.entrance && !g.setDown && !g.lift && onTable(g.thing);
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
        // never a spot under something (he'd just lean on it), or on where
        // something belongs (he'd be in the way of putting it back)
        if (spotTaken(p) || onAHome(p)) near = -1;
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

// Whether a guy standing at p would be on some object's home spot on the cloth.
function onAHome(p) {
    return things.some(t => t.home && !isGuy(t) && !t.homeOn && inHomeFootprint(t, p, GUY_R_MM / 1000));
}

// Idle: amble toward the wander spot, easing away from idle guys who come close.
function wander(g, at, h) {
    if (!g.roam || (g.roamT += h) > GUY_ROAM_TIME || Vec2.distance(at, g.roam) < 0.03) pickRoam(g);
    // standing about on a home spot, he moves off it rather than waiting for his spot to change
    if (onAHome(at) && onAHome(g.roam)) pickRoam(g);
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
    if (j && (!onTable(j) || busy(j) || (isTidy(j, 0.5) && !isHeld(j.body)))) letGoOfJob(g);
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
    let side = apart > 1e-6 ? Vec2.mul(toGuy, 1 / apart) : Vec2(1, 0);
    // He takes it from a side with room for him to stand: the side he's coming
    // from if there's room, or the nearest that has. A fallen cup lies close by
    // its saucer, often closer than he's wide: he takes it from the far side,
    // which is also the side to haul it home from.
    if (!g.grip) {
        const want = t.homeOn && !t.on ? Vec2.sub(p, baseOf(t.homeOn).body.getPosition()) : side;
        side = roomySide(g, t, want);
    }
    const touching = reachToward(t, side) + GUY_R_MM / 1000;
    const dist = Vec2.distance(p, goalOf(t));

    // Running to it counts as progress as much as hauling it does, so he
    // can't stand wedged somewhere forever.
    const left = dist + (g.grip ? 0 : Math.max(0, apart - touching));
    if (left < g.best - 0.005) { g.best = left; g.stuck = 0; }
    else if ((g.stuck += h) > GUY_PATIENCE) {
        g.sulks.set(t, g.clock + GUY_SULK_TIME);
        letGoOfJob(g);
        return Vec2(0, 0);
    }

    // A cup on its own saucer, just turned the wrong way: he climbs up and
    // turns it there, without hauling it off.
    if (t.homeOn && t.on === t.homeOn && !g.grip) {
        const base = baseOf(t.homeOn), bp = base.body.getPosition();
        const beside = standable(Vec2.add(bp, Vec2.mul(unitFrom(bp, at), reachOf(base) + GUY_R_MM / 1000 + GUY_SETDOWN_GAP_MM / 1000)));
        if (Vec2.distance(at, beside) > GUY_REACH_MM / 1000 * 2) return walkAround(g, at, beside, GUY_WALK_SPEED);
        if (settled(t.homeOn) && !busy(t.homeOn) && !isHeld(t.homeOn.body)) startLift(g, t);
        return Vec2(0, 0);
    }

    if (!g.grip) {
        if (apart > touching + GUY_REACH_MM / 1000) {
            return walkAround(g, at, standable(Vec2.add(p, Vec2.mul(side, touching))), GUY_WALK_SPEED);
        }
        // Got it: grab the near edge, and keep to the side he grabbed it from.
        const edge = Vec2.add(p, Vec2.mul(side, touching - GUY_R_MM / 1000));
        g.grip = world.createJoint(planck.MouseJoint({
            maxForce: GUY_GRIP_SHARE * DRAG_MAX_FORCE,
            frequencyHz: GUY_GRIP_HZ,
            dampingRatio: 0.9,
        }, cloth, t.body, edge));
        g.hold = Vec2.mul(side, touching);
        g.carry = Vec2.clone(edge);
    }

    // A fallen cup hauled to its saucer: up he goes.
    const saucer = t.homeOn;
    if (saucer && !t.on && dist < GUY_LIFT_REACH_MM / 1000 && !isHeld(t.body)
        && settled(saucer) && !busy(saucer) && !isHeld(saucer.body)) {
        startLift(g, t);
        return Vec2(0, 0);
    }

    // Nearly home: set it down carefully, once its spot is clear.
    if (!t.homeOn && dist < GUY_SETDOWN_MM / 1000 && !isHeld(t.body)) {
        const sq = t.parkAt ? null : squatterOn(g, t);
        if (sq) {
            // Two things on each other's homes would have him go back and
            // forth for ever: the squatter is parked out of the way instead.
            if (homeBlockers(sq).includes(t)) sq.parkAt = parkingFor(sq);
            letGoOfJob(g); g.job = sq; g.best = Infinity; g.stuck = 0;
            return Vec2(0, 0);
        }
        if (t.parkAt) {
            // parked: he leaves it there, and it goes home once its spot is free
            t.parkAt = null;
            letGoOfJob(g);
            return Vec2(0, 0);
        }
        const inWay = homeBlockers(t).filter(o => isGuy(o) && o !== g.thing);
        if (!inWay.length) { startSetDown(g, t); return Vec2(0, 0); }
        // a guy standing on its spot: idle ones are sent off it, and he waits
        for (const o of inWay) if (isIdle(o.guy)) o.guy.roam = null;
    }

    // Haul: the point he pulls toward runs ahead to home at carrying speed,
    // and he runs along beside it. With something in the way, slowly, and
    // never far ahead of his hands, so the spring can't fling it into things.
    const grabbed = g.grip.getAnchorB();
    const goal = Vec2.add(goalOf(t), Vec2.sub(grabbed, p));
    const ahead = Vec2.sub(goal, g.carry), aheadLen = ahead.length();
    const careful = aheadLen > 1e-6 && haulBlocked(t, ahead.x / aheadLen, ahead.y / aheadLen);
    const stepLen = Math.min(aheadLen, GUY_CARRY_SPEED * (careful ? GUY_HAUL_CARE : 1) * h);
    if (aheadLen > 1e-6) g.carry = Vec2.add(g.carry, Vec2.mul(ahead, stepLen / aheadLen));
    if (careful) {
        const lead = Vec2.sub(g.carry, grabbed), leadLen = lead.length(), most = GUY_HAUL_LEAD_MM / 1000;
        if (leadLen > most) g.carry = Vec2.add(grabbed, Vec2.mul(lead, most / leadLen));
    }
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
        backups.push({ at: guyClock + GUY_BACKUP_DELAY, edge: Vec2.clone(t.edgeAt) });
    }
}

// A backup comes out from under something on the table (see chooseEntrance).
// With nothing to come out from, he waits GUY_BACKUP_WAIT, and failing that
// doesn't come at all.
function arriveBackups() {
    backups = backups.filter(b => {
        if (b.at > guyClock) return true;
        const how = chooseEntrance(b.edge);
        if (how) startEntrance(how);
        else if (!b.waited) {
            // nothing free to come out from under: give something a moment to come free
            b.waited = true;
            b.at = guyClock + GUY_BACKUP_WAIT;
            return true;
        }
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

// Climbing up onto the saucer to put its cup back. His body and the cup's are
// switched off while it happens and moved by hand, a level up, so nothing
// bumps them halfway.
function startLift(g, cup) {
    const saucer = cup.homeOn, sp = saucer.body.getPosition(), b = g.thing.body;
    let toCup = Vec2.sub(cup.body.getPosition(), sp);
    if (toCup.length() < 1e-6) toCup = Vec2(1, 0);
    toCup.normalize();
    letGoOfJob(g);
    g.lift = {
        phase: 'up', t: 0, cup, saucer,
        floor: Vec2.clone(b.getPosition()),
        onto: Vec2.add(sp, Vec2.mul(toCup, rimOf(saucer) * 0.45)),
        cupFrom: Vec2.clone(cup.body.getPosition()),
        cupAngle: cup.body.getAngle(),
        saucerAt: Vec2.clone(sp),
        levels: saucer.level - 1,      // how many levels he climbs
    };
    b.setActive(false);
    g.thing.lifted = true;
    setLevel(g.thing, saucer.level + 1);
}

function easeLift(u) {
    return u * u * (3 - 2 * u);
}

// One step of the climb: up, lift, down. Ends early, cleanly, if the saucer
// is moved, falls or is grabbed out from under him.
function stepLift(g, h) {
    const L = g.lift, b = g.thing.body;
    const s = L.saucer, sp = s.body.getPosition();
    if (!onTable(s) || s.drop !== undefined || isHeld(s.body)
        || Vec2.distance(sp, L.saucerAt) > GUY_LIFT_SHIFT_MM / 1000) {
        endLift(g);
        return;
    }
    L.t += h;
    if (L.phase === 'up') {
        const time = GUY_CLIMB_UP_TIME * L.levels;
        const u = easeLift(Math.min(1, L.t / time));
        b.setTransform(Vec2.add(L.floor, Vec2.mul(Vec2.sub(L.onto, L.floor), u)), 0);
        g.thing.drawScale = 1 + (GUY_UP_SCALE - 1) * L.levels * u;
        if (L.t >= time) {
            L.phase = 'lift'; L.t = 0;
            L.cup.lifted = true;
            L.cup.body.setActive(false);
            setLevel(L.cup, L.saucer.level + 1);
        }
    } else if (L.phase === 'lift') {
        const v = Math.min(1, L.t / GUY_LIFT_TIME);
        const turnBy = Math.atan2(Math.sin(L.cup.homeAngle - L.cupAngle), Math.cos(L.cup.homeAngle - L.cupAngle));
        L.cup.body.setTransform(Vec2.add(L.cupFrom, Vec2.mul(Vec2.sub(sp, L.cupFrom), easeLift(v))), L.cupAngle + turnBy * easeLift(v));
        L.cup.drawScale = 1 + GUY_LIFT_BUMP * Math.sin(Math.PI * v);
        if (L.t >= GUY_LIFT_TIME) {
            setCupDown(L);
            L.phase = 'down'; L.t = 0;
        }
    } else {
        const time = GUY_CLIMB_DOWN_TIME * L.levels;
        const u = easeLift(Math.min(1, L.t / time));
        b.setTransform(Vec2.add(L.onto, Vec2.mul(Vec2.sub(L.floor, L.onto), u)), 0);
        g.thing.drawScale = 1 + (GUY_UP_SCALE - 1) * L.levels * (1 - u);
        if (L.t >= time) endLift(g);
    }
    const look = L.phase === 'down' ? Vec2.sub(L.floor, L.onto) : Vec2.sub(L.cup.body.getPosition(), b.getPosition());
    if (look.length() > 1e-6) g.facing = Math.atan2(look.y, look.x);
}

// The cup is on its saucer, a level up.
function setCupDown(L) {
    L.cup.lifted = false;
    L.cup.drawScale = 1;
    L.cup.body.setTransform(L.cup.body.getPosition(), L.cup.homeAngle);
    L.cup.body.setActive(true);
    placeOn(L.cup, L.saucer);
}

// Setting a thing down exactly at home, turned its starting way. His body and
// its are off while it happens and moved by hand; he steps to just clear of
// its home spot as he does it, so nothing is shoved when they're back on.
function startSetDown(g, t) {
    const b = g.thing.body, at = b.getPosition();
    letGoOfJob(g);
    const side = unitFrom(t.home, at);
    const reach = reachToward(t, side, t.homeAngle) + GUY_R_MM / 1000 + GUY_SETDOWN_GAP_MM / 1000;
    g.setDown = {
        t: 0, obj: t,
        from: Vec2.clone(t.body.getPosition()), fromAngle: t.body.getAngle(),
        guyFrom: Vec2.clone(at), guyTo: standable(Vec2.add(t.home, Vec2.mul(side, reach))),
    };
    for (const body of [b, t.body]) { body.setLinearVelocity(Vec2(0, 0)); body.setAngularVelocity(0); body.setActive(false); }
    g.thing.lifted = true;
    t.lifted = true;
}

function stepSetDown(g, h) {
    const S = g.setDown, t = S.obj;
    S.t += h;
    const u = easeLift(Math.min(1, S.t / GUY_SETDOWN_TIME));
    const turnBy = Math.atan2(Math.sin(t.homeAngle - S.fromAngle), Math.cos(t.homeAngle - S.fromAngle));
    t.body.setTransform(Vec2.add(S.from, Vec2.mul(Vec2.sub(t.home, S.from), u)), S.fromAngle + turnBy * u);
    t.drawScale = 1 + GUY_LIFT_BUMP * Math.sin(Math.PI * u);
    g.thing.body.setTransform(Vec2.add(S.guyFrom, Vec2.mul(Vec2.sub(S.guyTo, S.guyFrom), u)), 0);
    const look = Vec2.sub(t.body.getPosition(), g.thing.body.getPosition());
    if (look.length() > 1e-6) g.facing = Math.atan2(look.y, look.x);
    if (S.t >= GUY_SETDOWN_TIME) endSetDown(g);
}

// It's at home, exactly; or, cut short, it stays where it had got to.
function endSetDown(g) {
    const S = g.setDown, t = S.obj, b = g.thing.body;
    if (S.t >= GUY_SETDOWN_TIME) t.body.setTransform(t.home, t.homeAngle);
    t.drawScale = 1;
    t.lifted = false;
    t.body.setActive(true);
    b.setActive(true);
    g.thing.lifted = false;
    g.expect = null;
    g.setDown = null;
}

// Back on the cloth where he climbed up, whatever stage it reached. A cup in
// mid-lift is set on the saucer at once rather than dropped back onto it.
function endLift(g) {
    const L = g.lift, b = g.thing.body;
    if (L.phase === 'lift') setCupDown(L);
    b.setTransform(L.floor, 0);
    b.setLinearVelocity(Vec2(0, 0));
    b.setActive(true);
    g.thing.lifted = false;
    g.thing.drawScale = 1;
    setLevel(g.thing, LEVEL_ON_CLOTH);
    g.expect = null;
    g.lift = null;
}

// Over the top of whatever has him boxed in, toward where he wants to go: to
// the first spot past it with room for him. False if there's nowhere.
function startClimbOver(g, want) {
    const b = g.thing.body, at = b.getPosition();
    // asking for barely any speed, his way is toward his job
    const dir = want.length() > GUY_STALL_SPEED / 4 ? Vec2.mul(want, 1 / want.length())
        : g.job ? unitFrom(at, g.job.body.getPosition()) : Vec2(1, 0);
    for (let d = GUY_R_MM * 2; d <= GUY_OVER_LOOK_MM; d += 10) {
        const spot = Vec2.add(at, Vec2.mul(dir, d / 1000));
        if (!hasRoom(g, spot, null)) continue;
        g.over = { from: Vec2.clone(at), to: spot, t: 0, time: d / 1000 / GUY_CLIMB_OVER_SPEED };
        b.setActive(false);
        g.thing.lifted = true;
        letGoOfJob(g);
        g.facing = Math.atan2(dir.y, dir.x);
        // drawn over what he climbs, whatever level it's at
        setLevel(g.thing, Math.max(...things.filter(o => o !== g.thing).map(o => o.level)) + 1);
        return true;
    }
    return false;
}

function stepClimbOver(g, h) {
    const O = g.over, b = g.thing.body;
    O.t += h;
    const u = Math.min(1, O.t / O.time);
    b.setTransform(Vec2.add(O.from, Vec2.mul(Vec2.sub(O.to, O.from), u)), 0);
    // up and over: biggest at the top of the climb
    g.thing.drawScale = 1 + (GUY_UP_SCALE - 1) * Math.sin(Math.PI * u);
    g.stride += GUY_CLIMB_OVER_SPEED * h * 1000;
    if (u >= 1) endClimbOver(g);
}

function endClimbOver(g) {
    const b = g.thing.body;
    b.setTransform(g.over.to, 0);
    b.setLinearVelocity(Vec2(0, 0));
    b.setActive(true);
    g.thing.lifted = false;
    g.thing.drawScale = 1;
    setLevel(g.thing, LEVEL_ON_CLOTH);
    g.expect = null;
    g.over = null;
}

// ---- Arriving ----
// A backup doesn't climb up lying flat: he comes out from under something that
// lies on the cloth (DESIGN.md, "The little guy"). His body is switched off and
// moved by hand for the whole entrance, drawn a level below the cloth's things
// so he's under whatever hides him, and switched on standing at a clear spot
// when it's over. It ends at once, with him out at that spot, if he's grabbed,
// or what he's under is grabbed, moves, or starts to fall.

// The corner of a napkin at `at` turned by `angle` (local signs sx, sy), and the
// unit vector along its diagonal, out of the corner.
function napkinCorner(kind, at, angle, sx, sy) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const [bw, bh] = kind.pieces[0].box;
    const lx = sx * bw / 2000, ly = sy * bh / 2000;
    return {
        corner: Vec2(at.x + lx * cos - ly * sin, at.y + lx * sin + ly * cos),
        dir: Vec2((sx * cos - sy * sin) / Math.SQRT2, (sx * sin + sy * cos) / Math.SQRT2),
    };
}

// How a backup comes in, or null if nothing will do. The napkin if it's free to
// come out from under; otherwise whatever round thing on the cloth is nearest
// where the object fell (edge, in meters). Each must have a clear spot to come
// out at.
function chooseEntrance(edge) {
    const free = things.filter(t => !isGuy(t) && onTable(t) && t.level === LEVEL_ON_CLOTH
        && !isHeld(t.body) && !busy(t) && !things.some(o => o.on === t) && !guys.some(o => o.job === t));
    const probe = { thing: { level: LEVEL_ON_CLOTH } };    // stands in for him, who doesn't exist yet
    const napkin = free.find(t => t.kind === KINDS.napkin);
    const round = free.filter(t => t.kind.pieces.length === 1 && t.kind.pieces[0].circle)
        .sort((a, b) => Vec2.distance(a.body.getPosition(), edge) - Vec2.distance(b.body.getPosition(), edge));

    for (const src of napkin ? [napkin, ...round] : round) {
        const at = src.body.getPosition(), toward = unitFrom(at, edge);
        if (src === napkin) {
            // the corner nearest the way to the object that fell, with room past it
            const corners = [];
            for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
                const k = napkinCorner(src.kind, at, src.body.getAngle(), sx, sy);
                corners.push({ sx, sy, dir: k.dir, exit: Vec2.add(k.corner, Vec2.mul(k.dir, GUY_NAP_STAND_MM / 1000)) });
            }
            corners.sort((a, b) => Vec2.dot(b.dir, toward) - Vec2.dot(a.dir, toward));
            const c = corners.find(o => hasRoom(probe, o.exit, null));
            if (c) return { kind: '1c2', src, sx: c.sx, sy: c.sy, dir: c.dir, exit: c.exit };
        } else {
            // the direction nearest that way with room past the rim
            const a0 = Math.atan2(toward.y, toward.x), far = reachOf(src) + (GUY_PEEK_OUT_MM + GUY_PEEK_STEP_MM) / 1000;
            for (let i = 0; i <= GUY_ENTER_DIRS / 2; i++) {
                for (const sgn of i ? [1, -1] : [1]) {
                    const a = a0 + sgn * i * Math.PI * 2 / GUY_ENTER_DIRS;
                    const dir = Vec2(Math.cos(a), Math.sin(a)), exit = Vec2.add(at, Vec2.mul(dir, far));
                    if (hasRoom(probe, exit, null)) return { kind: '1a', src, dir, exit };
                }
            }
        }
    }
    return null;
}

function startEntrance(how) {
    const src = how.src, at = src.body.getPosition();
    const g = addGuy(at.x * 1000, at.y * 1000);
    g.thing.body.setActive(false);
    g.thing.lifted = true;
    setLevel(g.thing, LEVEL_ON_CLOTH - 1);
    g.facing = Math.atan2(how.dir.y, how.dir.x);
    g.entrance = {
        kind: how.kind, src, t: 0, dir: how.dir, exit: how.exit,
        sx: how.sx, sy: how.sy,
        from: Vec2.clone(at), angle: src.body.getAngle(),     // where the thing was when he started
        pose: ENTER_TUCK, sw: 0, head: 0, shake: 0, rise: 0,  // how he's drawn this step
    };
}

const enterSeg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const enterLerp = (a, b, u) => a + (b - a) * u;
const enterMix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
// a bounce that dies away, s seconds in
const enterSettle = (s, amp, decay, hz) => amp * Math.exp(-decay * s) * Math.abs(Math.sin(s * hz * Math.PI * 2));

// When each stage of 1a ends, in seconds.
function peekEnds() {
    const liftEnd = GUY_PEEK_LIFT_T0 + GUY_PEEK_LIFT_T, headEnd = liftEnd + GUY_PEEK_HEAD_T;
    const lookEnd = headEnd + GUY_PEEK_LOOK_T, outEnd = lookEnd + GUY_PEEK_OUT_T, riseEnd = outEnd + GUY_PEEK_RISE_T;
    return { liftEnd, headEnd, lookEnd, outEnd, riseEnd, end: riseEnd + GUY_PEEK_SHAKE_T + GUY_PEEK_HOLD_T };
}

// And of 1c2.
function napEnds() {
    const liftEnd = GUY_NAP_LIFT_T0 + GUY_NAP_LIFT_T, crawlEnd = liftEnd + GUY_NAP_CRAWL_T, riseEnd = crawlEnd + GUY_NAP_RISE_T;
    const dropT0 = crawlEnd + GUY_NAP_DROP_T0;
    return { liftEnd, crawlEnd, riseEnd, dropT0, dropEnd: dropT0 + GUY_NAP_DROP_T, end: riseEnd + GUY_NAP_BRUSH_T + GUY_NAP_HOLD_T };
}

// 1a: the rim on the side he comes out on lifts (the thing tips about its far
// rim, drawn squashed toward it), he peeks and looks both ways, wriggles out
// and stands, and shakes himself off.
function stepPeek(g, E) {
    const s = E.src, t = E.t, e = peekEnds();
    const rim = reachOf(s) * 1000;
    const lift = easeLift(enterSeg(t, GUY_PEEK_LIFT_T0, e.liftEnd)) * (1 - easeLift(enterSeg(t, e.outEnd - GUY_PEEK_SETTLE_T, e.outEnd)));
    const hu = easeLift(enterSeg(t, e.liftEnd, e.headEnd));
    const ou = easeLift(enterSeg(t, e.lookEnd, e.outEnd));
    const ru = easeLift(enterSeg(t, e.outEnd, e.riseEnd));
    const sh = enterSeg(t, e.riseEnd, e.riseEnd + GUY_PEEK_SHAKE_T);
    const along = enterLerp(enterLerp(GUY_PEEK_HIDE_MM, rim + GUY_PEEK_PEEK_MM, hu), rim + GUY_PEEK_OUT_MM, ou) + ru * GUY_PEEK_STEP_MM;
    g.thing.body.setTransform(Vec2.add(E.from, Vec2.mul(E.dir, along / 1000)), 0);

    E.head = t < e.lookEnd ? Math.sin(enterSeg(t, e.headEnd, e.lookEnd) * GUY_PEEK_LOOK_SWINGS * Math.PI * 2) * GUY_PEEK_LOOK_ANGLE : 0;
    E.shake = 0;
    E.sw = 0;
    if (t > e.lookEnd && t < e.outEnd) E.sw = Math.sin(t * GUY_PEEK_WRIGGLE_HZ * Math.PI * 2);
    else if (t >= e.riseEnd) {
        E.shake = Math.sin(t * GUY_PEEK_SHAKE_HZ * Math.PI * 2) * GUY_PEEK_SHAKE_ANGLE * (1 - sh);
        E.sw = Math.sin(t * GUY_PEEK_SHAKE_HZ * Math.PI * 2 + 1) * (1 - sh);
    }
    E.pose = enterMix(enterMix(ENTER_TUCK, ENTER_FLAT, ou), ENTER_STAND, ru);
    // the hinge is the rim behind him, so the near rim comes up; `n` points at
    // the hinge, which is the way a tall thing's top leans
    s.enterTilt = {
        at: Vec2.sub(s.body.getPosition(), Vec2.mul(E.dir, rim / 1000)),
        n: Vec2(-E.dir.x, -E.dir.y),
        tilt: Math.acos(1 - lift * (1 - GUY_PEEK_SQUASH)),
    };
}

// 1c2: the napkin's corner tips up about its fold (drawn by the napkin's own
// draw, from `flap`), he crawls out under it, it drops back and bounces, and he
// rises with a tilt and brushes himself off.
function stepNap(g, E) {
    const s = E.src, t = E.t, e = napEnds();
    const k = napkinCorner(s.kind, E.from, E.angle, E.sx, E.sy);
    const lu = easeLift(enterSeg(t, GUY_NAP_LIFT_T0, e.liftEnd));
    const du = easeLift(enterSeg(t, e.dropT0, e.dropEnd));
    let tilt;
    if (t < GUY_NAP_LIFT_T0) {
        // stirring, eased in and out so it's flat again when the lift begins
        const wu = enterSeg(t, GUY_NAP_TWITCH_T0, GUY_NAP_TWITCH_T0 + GUY_NAP_TWITCH_T);
        tilt = Math.max(0, Math.sin(wu * GUY_NAP_TWITCH_HZ * GUY_NAP_TWITCH_T * Math.PI * 2))
            * Math.sin(Math.PI * wu) * GUY_NAP_TWITCH;
    } else if (t < e.dropEnd) {
        tilt = Math.PI * lu * (1 - du);
    } else {
        tilt = enterSettle(t - e.dropEnd, GUY_NAP_BOUNCE, GUY_NAP_BOUNCE_DECAY, GUY_NAP_BOUNCE_HZ);
    }
    s.flap = { sx: E.sx, sy: E.sy, fold: GUY_NAP_FOLD_MM, tilt };

    const cu = easeLift(enterSeg(t, e.liftEnd, e.crawlEnd));
    const ru = easeLift(enterSeg(t, e.crawlEnd, e.riseEnd));
    const along = enterLerp(GUY_NAP_START_MM, GUY_NAP_OUT_MM, cu) + ru * (GUY_NAP_STAND_MM - GUY_NAP_OUT_MM);
    g.thing.body.setTransform(Vec2.add(k.corner, Vec2.mul(k.dir, along / 1000)), 0);

    E.head = 0;
    E.shake = 0;
    E.sw = 0;
    if (t > e.liftEnd && t < e.crawlEnd) E.sw = Math.sin(t * GUY_NAP_WRIGGLE_HZ * Math.PI * 2) * (cu > 0 && cu < 1 ? 1 : 0.3);
    E.pose = enterMix(enterMix(ENTER_TUCK, ENTER_FLAT, easeLift(enterSeg(t, e.liftEnd, e.liftEnd + GUY_NAP_CRAWL_T * 0.5))), ENTER_STAND, ru);
    if (t >= e.riseEnd) {
        const bu = enterSeg(t, e.riseEnd, e.riseEnd + GUY_NAP_BRUSH_T);
        E.pose = ENTER_BRUSH;
        E.sw = Math.sin(bu * GUY_NAP_BRUSH_HZ * GUY_NAP_BRUSH_T * Math.PI * 2) * (1 - bu * bu);
    }
    E.rise = t >= e.crawlEnd && t < e.riseEnd ? Math.sin(Math.PI * ru) * GUY_NAP_RISE_TILT : 0;
}

function stepEntrance(g, h) {
    const E = g.entrance, s = E.src;
    let turn = s ? s.body.getAngle() - E.angle : 0;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    if (isHeld(g.thing.body) || (s && (isHeld(s.body) || !onTable(s) || s.drop !== undefined || s.lifted
        || Vec2.distance(s.body.getPosition(), E.from) > GUY_ENTER_MOVE_MM / 1000
        || Math.abs(turn) > GUY_ENTER_TURN))) {
        endEntrance(g);
        return;
    }
    E.t += h;
    if (E.kind === '1a') stepPeek(g, E); else stepNap(g, E);
    if (E.t >= (E.kind === '1a' ? peekEnds() : napEnds()).end) endEntrance(g);
}

// Out and standing at the spot he was coming out at, on the cloth's level, and
// whatever he was under is as it was.
function endEntrance(g) {
    const E = g.entrance, b = g.thing.body;
    if (E.src) {
        E.src.enterTilt = undefined;
        E.src.flap = undefined;
    }
    b.setTransform(E.exit, 0);
    b.setLinearVelocity(Vec2(0, 0));
    b.setActive(true);
    g.thing.lifted = false;
    g.thing.drawScale = 1;
    setLevel(g.thing, LEVEL_ON_CLOTH);
    g.expect = null;
    g.entrance = null;
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
        // pushed, dropped or knocked over, he screams; stepping off at the end, he doesn't
        if (!g.leaving && !g.screamed) { g.screamed = true; scream(); }
        if (!g.leaving && t.fall > GUY_CLIMB_TIME) {
            g.screamed = false;
            // knocked off with work still to do: he climbs back on where he went over
            b.setTransform(standable(t.fallAt), 0);
            b.setLinearVelocity(Vec2(0, 0));
            b.setActive(true);
            t.fall = undefined;
            g.down = GUY_STUN_TIME;
        }
        return;
    }

    // coming out from under something, unless he's grabbed (or it is, or it
    // moves): then he's out at once where he was headed
    if (g.entrance) {
        stepEntrance(g, h);
        return;
    }

    // climbing over something, unless he's grabbed: then he's down where he
    // was headed
    if (g.over) {
        if (!isHeld(b)) { stepClimbOver(g, h); return; }
        endClimbOver(g);
    }

    // setting something down, unless he or it is grabbed
    if (g.setDown) {
        if (!isHeld(b) && !isHeld(g.setDown.obj.body)) { stepSetDown(g, h); return; }
        endSetDown(g);
    }

    // up on a saucer putting a cup back, unless he's grabbed
    if (g.lift) {
        if (!isHeld(b)) { stepLift(g, h); return; }
        endLift(g);
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
    // Boxed in on his way to a job, going nowhere: after GUY_STALL_TIME he
    // barges through for GUY_BARGE_TIME, shoving aside what's in his way.
    const speed0 = v.length();
    // On his way to a job, barely moving is stuck however slowly he means to go:
    // steering round a tight spot can ask for a crawl that never gets there.
    const trying = g.job ? true : want.length() > GUY_STALL_SPEED;
    if (!g.grip && trying && speed0 < GUY_STALL_SPEED) g.stall = (g.stall || 0) + h;
    else g.stall = 0;
    if (g.stall > GUY_STALL_TIME) {
        g.stall = 0;
        if (!startClimbOver(g, want)) g.barge = GUY_BARGE_TIME;
        else return;
    }
    g.barge = Math.max(0, (g.barge || 0) - h);
    // squeezing past something that isn't his job, he can't shove it; hauling,
    // or barging, is different
    const squeezing = !g.grip && !g.barge && sidestep(b, g.job, want);
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

// The first guy wears his pompadour: seen from above, a black mass over his
// whole head that swells forward past his brow into a quiff of three locks,
// with two streaks of shine swept back from it, so it reads as hair and not
// as a black head. Backups are bareheaded, so he's the one you can pick out.
const QUIFF_MM = 10;             // how far the quiff swells forward of his head
const QUIFF_STEPS = 48;
function drawHead(c, x, g) {
    c.beginPath();
    for (const s of [-1, 1]) c.ellipse(x, s * 13, 4, 6, 0, 0, Math.PI * 2);   // ears
    inkShape(c);
    c.beginPath();
    if (g !== guys[0]) {
        ring(c, x, 0, 13);
        inkShape(c);
        return;
    }
    for (let i = 0; i <= QUIFF_STEPS; i++) {
        const a = i / QUIFF_STEPS * Math.PI * 2 - Math.PI;
        const front = Math.max(0, Math.cos(a - 0.35));
        // swells toward his front and swept to one side, in three locks with
        // notches between them
        const r = 13 + front * front * QUIFF_MM * (0.45 + 0.55 * Math.abs(Math.cos((a - 0.35) * 4.5)));
        const px = x + Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = INK;
    c.fill();
    inkLine(c);
    // shine: two paper strokes swept back from the quiff
    c.beginPath();
    c.moveTo(x + 19, -1);
    c.quadraticCurveTo(x + 5, -11, x - 9, -5);
    c.moveTo(x + 19, 7);
    c.quadraticCurveTo(x + 3, 6, x - 9, 2);
    c.save();
    if (inkFrame) c.setTransform(inkFrame);
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = PAPER;
    c.stroke();
    c.restore();
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
        if (g.grip || g.lift) limb(c, 2, s * 11, 24, s * 8, 6);
        else if (sad) limb(c, -1, s * 10, -swing * s * 3 - 2, s * 15, 5);
        else limb(c, 0, s * 11, -swing * s * 13, s * 26, 6);
    }
    inkLine(c);
    c.beginPath();
    c.ellipse(-3, 0, 7, sad ? 10 : 12, 0, 0, Math.PI * 2);
    inkShape(c);
    drawHead(c, sad ? 9 : 3, g);
}

// Held up by the player, kicking and waving: each limb swings on its own
// phase, so it reads as panic rather than a march.
function drawGuyFlailing(c, g) {
    c.rotate(g.facing);
    const w = guyClock * GUY_FLAIL_HZ * Math.PI * 2;
    c.beginPath();
    for (const s of [-1, 1]) {
        const arm = s * (Math.PI / 2 - 0.2) + Math.sin(w + s) * GUY_FLAIL_SWING;
        limb(c, 2, s * 11, 2 + Math.cos(arm) * 26, s * 11 + Math.sin(arm) * 26, 6);
        const leg = s * (Math.PI - 0.5) + Math.sin(w * 1.3 + 2 + s) * GUY_FLAIL_SWING * 0.7;
        limb(c, -6, s * 5, -6 + Math.cos(leg) * 22, s * 5 + Math.sin(leg) * 22, 5);
    }
    inkLine(c);
    c.beginPath();
    c.ellipse(-3, 0, 7, 12, 0, 0, Math.PI * 2);
    inkShape(c);
    drawHead(c, 3, g);
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
    drawHead(c, 20, g);
}

// Coming out from under something (startEntrance). A pose is numbers, so two
// can be blended as he goes from lying to standing:
// [body x, body rx, body ry, head x,
//  leg x0, y0, x1, y1, swing,   arm x0, y0, x1, y1, swing]
// y values are for the +y side and the -y side mirrors; a leg's x1 also moves
// by swing * side * its swing number, and an arm's by the opposite, as in a run.
const ENTER_STAND = [-3, 7, 12, 3,   -2, 5, 0, 9, 16,   0, 11, 0, 26, 13];
const ENTER_FLAT = [-4, 12, 9, 20,   -12, 5, -40, 18, 10,   6, 10, 18, 38, 6];
const ENTER_TUCK = [-4, 12, 9, 20,   -12, 5, -40, 18, 10,   6, 10, 10, 14, 4];    // arms at his sides, so nothing pokes out from cover
const ENTER_BRUSH = [-3, 7, 12, 3,   -2, 5, 0, 9, 16,   2, 11, 6, 9, 10];         // hands on his front, sweeping

// Squashes what's drawn next toward the line through (ax, ay) with unit normal
// (nx, ny) by cos(tilt): tilting about that line, seen from above.
function squashLocal(c, ax, ay, nx, ny, tilt) {
    const k = Math.cos(tilt) - 1;
    c.translate(ax, ay);
    c.transform(1 + k * nx * nx, k * nx * ny, k * nx * ny, 1 + k * ny * ny, 0, 0);
    c.translate(-ax, -ay);
}

// A guy in a blended pose, with his head turned by headTurn about his neck.
function drawGuyPose(c, g, pose, sw, headTurn) {
    const [bx, brx, bry, hx, lx0, ly0, lx1, ly1, lk, ax0, ay0, ax1, ay1, ak] = pose;
    c.beginPath();
    for (const s of [-1, 1]) {
        limb(c, lx0, s * ly0, lx1 + sw * s * lk, s * ly1, 5);
        limb(c, ax0, s * ay0, ax1 - sw * s * ak, s * ay1, 6);
    }
    inkLine(c);
    c.beginPath();
    c.ellipse(bx, 0, brx, bry, 0, 0, Math.PI * 2);
    inkShape(c);
    c.save();
    c.translate(bx + brx, 0);
    c.rotate(headTurn);
    c.translate(-(bx + brx), 0);
    drawHead(c, hx, g);
    c.restore();
}

// Coming out from under something, in the pose and turn startEntrance's steps
// worked out: tilting about his feet as he rises.
function drawGuyEntrance(c, g) {
    const E = g.entrance;
    c.rotate(g.facing + E.shake);
    if (E.rise) squashLocal(c, E.pose[6], 0, 1, 0, E.rise);
    drawGuyPose(c, g, E.pose, E.sw, E.head);
}
