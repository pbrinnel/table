// Debug mode: a DEBUG button in the corner of the page opens a panel listing
// every object and every guy, refreshed a few times a second, with a pause
// button. To show another property, add a row to OBJECT_ROWS or GUY_ROWS:
// [label, function(thing or guy) -> text].
//
// Selecting: in debug mode a press on the table selects whatever is under it
// (and still grabs it, as ever); a click on an entry in the panel selects that
// one, and hovering over an entry picks it out on the table. The selection is
// ringed in red on the table, the one color the game itself never uses, so it
// can't be mistaken for part of the drawing.

const DEBUG_REFRESH_MS = 200;   // how often the panel is rebuilt
const DEBUG_MARK = '#e00';      // the selection's ring and the panel's mark
const DEBUG_RING_GAP = 6;       // frame units between a thing's edge and its ring
const DEBUG_RING_WIDTH = 2;     // frame units
const DEBUG_HOVER_DASH = [6, 5]; // the hover ring is dashed, the selection's solid

let debugOn = false;
let debugPaused = false;        // start.js skips stepping the world while this is true
let debugTimer = null;
let debugSelected = null;       // the thing (object or guy's body) picked out
let debugHover = null;          // the thing under the pointer in the panel

// Each thing gets a lasting id for the panel's entries, since the things array
// reorders whenever something is grabbed.
const dbgIds = new WeakMap();
let dbgNextId = 1;
function dbgId(t) {
    if (!dbgIds.has(t)) dbgIds.set(t, dbgNextId++);
    return dbgIds.get(t);
}

const dbgMm = m => Math.round(m * 1000);
const dbgXy = p => dbgMm(p.x) + ', ' + dbgMm(p.y);
const dbgDeg = a => Math.round(a * 180 / Math.PI) + '°';
const dbgOneDec = n => (Math.round(n * 10) / 10).toString();

function dbgKindName(kind) {
    for (const k in KINDS) if (KINDS[k] === kind) return k;
    return '?';
}

function dbgGuyIndex(g) {
    return guys.indexOf(g);
}

function dbgGuyState(g) {
    if (!onTable(g.thing)) return 'fallen';
    if (g.leaving) return 'leaving: ' + g.leaving.phase;
    if (g.down > 0) return 'down, ' + dbgOneDec(g.down) + ' s left';
    if (g.lift) return 'putting a cup back: ' + g.lift.phase;
    if (g.grip) return 'hauling';
    if (g.job) return 'working';
    return 'wandering';
}

const OBJECT_ROWS = [
    ['mass', t => Math.round(t.kind.mass) + ' g'],
    ['at (mm)', t => dbgXy(t.body.getPosition())],
    ['angle', t => dbgDeg(t.body.getAngle())],
    ['speed', t => dbgMm(t.body.getLinearVelocity().length()) + ' mm/s'],
    ['home (mm)', t => dbgXy(t.home)],
    ['from home', t => dbgMm(planck.Vec2.distance(t.body.getPosition(), t.home)) + ' mm'],
    ['status', t => !onTable(t) ? 'falling' : t.drop !== undefined ? 'tipping down a level' : t.lifted ? 'being lifted' : 'on the table'],
    ['level', t => t.level + (t.on ? ', on ' + dbgKindName(t.on.kind) : '')],
    ['held by player', t => isHeld(t.body) ? 'yes' : 'no'],
    ['guy working on it', t => {
        const g = guys.find(g => g.job === t);
        return g ? 'guy ' + dbgGuyIndex(g) : 'none';
    }],
];

const GUY_ROWS = [
    ['at (mm)', g => dbgXy(g.thing.body.getPosition())],
    ['speed', g => dbgMm(g.thing.body.getLinearVelocity().length()) + ' mm/s'],
    ['facing', g => dbgDeg(g.facing)],
    ['state', dbgGuyState],
    ['level', g => g.thing.level],
    ['job', g => g.job ? dbgKindName(g.job.kind) : 'none'],
    ['grip', g => g.grip ? 'yes' : 'no'],
];

function dbgRowsHtml(rows, item) {
    return '<table>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1](item) + '</td></tr>').join('') + '</table>';
}

// One entry in the panel: a heading to click or hover, and its rows. The
// selected entry's heading is marked in DEBUG_MARK.
function dbgEntryHtml(t, title, rows, item) {
    const id = dbgId(t);
    const mark = t === debugSelected ? ' style="color:' + DEBUG_MARK + '"' : '';
    return '<div class="debug-entry" data-id="' + id + '"><h3' + mark + '>' +
        (t === debugSelected ? '▶ ' : '') + title + '</h3>' + dbgRowsHtml(rows, item) + '</div>';
}

// The panel is a header that stays put, with the pause button, and a list
// under it that's rebuilt every refresh. A click needs its press and release
// on the same element, so nothing clickable may be rebuilt in between: the
// button lives in the header, and the list's entries answer the press itself.
function buildDebugPanel(panel) {
    panel.innerHTML = '<button type="button" id="debug-pause">Pause</button><div id="debug-list"></div>';
}

function refreshDebug() {
    const panel = document.getElementById('debug-panel');
    const list = document.getElementById('debug-list');
    document.getElementById('debug-pause').textContent = debugPaused ? 'Play' : 'Pause';
    // anything gone from the table for good can't stay picked out
    if (debugSelected && !things.includes(debugSelected)) debugSelected = null;
    const objects = things.filter(t => !isGuy(t));
    let html = '<h2>Objects (' + objects.length + ')</h2>';
    for (const t of objects) html += dbgEntryHtml(t, dbgKindName(t.kind), OBJECT_ROWS, t);
    html += '<h2>Guys (' + guys.length + ')</h2>';
    guys.forEach((g, i) => {
        html += dbgEntryHtml(g.thing, 'guy ' + i + (i === 0 ? ' (first)' : ' (backup)'), GUY_ROWS, g);
    });
    // keep the scroll place across the rebuild
    const top = panel.scrollTop;
    list.innerHTML = html;
    panel.scrollTop = top;
}

function dbgThingById(id) {
    return things.find(t => dbgId(t) === id) || null;
}

// Picks a thing out and brings its entry into view in the panel.
function debugSelect(t) {
    debugSelected = t;
    refreshDebug();
    if (!t) return;
    const el = document.querySelector('#debug-panel .debug-entry[data-id="' + dbgId(t) + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
}

// How far a thing reaches from its center in any direction, in mm, from its
// collision pieces: the radius its ring needs.
function dbgReachMm(t) {
    let r = 0;
    for (const p of t.kind.pieces) {
        const off = Math.hypot(p.x || 0, p.y || 0);
        r = Math.max(r, off + (p.circle || Math.hypot(p.box[0], p.box[1]) / 2));
    }
    return r;
}

// Rings the selected and hovered things on the table. Called by start.js after
// the things are drawn, in frame units.
function drawDebug(c) {
    if (!debugOn) return;
    for (const t of [debugHover, debugSelected]) {
        if (!t || !things.includes(t) || !onTable(t)) continue;
        const p = t.body.getPosition();
        const at = mmToFrame(p.x * 1000, p.y * 1000);
        c.save();
        c.beginPath();
        c.arc(at.x, at.y, dbgReachMm(t) / MM_PER_UNIT + DEBUG_RING_GAP, 0, Math.PI * 2);
        c.lineWidth = DEBUG_RING_WIDTH;
        c.strokeStyle = DEBUG_MARK;
        c.setLineDash(t === debugSelected ? [] : DEBUG_HOVER_DASH);
        c.stroke();
        c.restore();
    }
}

function setDebug(on) {
    debugOn = on;
    document.getElementById('debug-panel').hidden = !on;
    clearInterval(debugTimer);
    debugTimer = null;
    if (on) {
        refreshDebug();
        debugTimer = setInterval(refreshDebug, DEBUG_REFRESH_MS);
    }
}

function listenForDebug() {
    // The labs load the game's scripts into pages of their own, without the
    // button or panel; there's no debug mode there.
    const button = document.getElementById('debug-button');
    const panel = document.getElementById('debug-panel');
    if (!button || !panel) return;
    buildDebugPanel(panel);
    button.addEventListener('click', () => setDebug(!debugOn));
    document.getElementById('debug-pause').addEventListener('click', () => {
        debugPaused = !debugPaused;
        refreshDebug();
    });
    panel.addEventListener('pointerdown', e => {
        const entry = e.target.closest('.debug-entry');
        if (entry) debugSelect(dbgThingById(+entry.dataset.id));
    });
    // The panel is rebuilt under the pointer, so hover is worked out from where
    // the pointer is rather than from enter and leave events.
    panel.addEventListener('mousemove', e => {
        const entry = e.target.closest('.debug-entry');
        debugHover = entry ? dbgThingById(+entry.dataset.id) : null;
    });
    panel.addEventListener('mouseleave', () => { debugHover = null; });
    // a press on the table selects what's under it; drag.js still grabs it
    canvas.addEventListener('pointerdown', e => {
        if (!debugOn || talkBoxHit(e.clientX, e.clientY)) return;
        const p = pointerMm(e);
        debugSelect(grabAt(p.x, p.y));
    });
}
