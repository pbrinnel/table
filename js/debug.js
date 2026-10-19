// Debug mode: a DEBUG button in the corner of the page opens a panel listing
// every object and every guy, refreshed a few times a second, with a pause
// button. To show another property, add a row to OBJECT_ROWS or GUY_ROWS:
// [label, function(thing or guy) -> text].

const DEBUG_REFRESH_MS = 200;   // how often the panel is rebuilt

let debugOn = false;
let debugPaused = false;        // start.js skips stepping the world while this is true
let debugTimer = null;

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
    ['status', t => onTable(t) ? 'on the table' : 'falling'],
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
    ['job', g => g.job ? dbgKindName(g.job.kind) : 'none'],
    ['grip', g => g.grip ? 'yes' : 'no'],
];

function dbgRowsHtml(rows, item) {
    return '<table>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1](item) + '</td></tr>').join('') + '</table>';
}

function refreshDebug() {
    const panel = document.getElementById('debug-panel');
    const objects = things.filter(t => !isGuy(t));
    let html = '<button type="button" id="debug-pause">' + (debugPaused ? 'Play' : 'Pause') + '</button>';
    html += '<h2>Objects (' + objects.length + ')</h2>';
    for (const t of objects) html += '<h3>' + dbgKindName(t.kind) + '</h3>' + dbgRowsHtml(OBJECT_ROWS, t);
    html += '<h2>Guys (' + guys.length + ')</h2>';
    guys.forEach((g, i) => {
        html += '<h3>guy ' + i + (i === 0 ? ' (first)' : ' (backup)') + '</h3>' + dbgRowsHtml(GUY_ROWS, g);
    });
    // keep the scroll place across the rebuild
    const top = panel.scrollTop;
    panel.innerHTML = html;
    panel.scrollTop = top;
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
    document.getElementById('debug-button').addEventListener('click', () => setDebug(!debugOn));
    document.getElementById('debug-panel').addEventListener('click', e => {
        if (e.target.id !== 'debug-pause') return;
        debugPaused = !debugPaused;
        refreshDebug();
    });
}
