// The score (dhfm91). Everything that goes over the edge is worth points: an
// object by its weight, a guy a flat amount the first time he's knocked or
// dragged off (not when he steps off at the end). Each score is shown as it
// comes, one at a time, where the thing went over, with the math behind it
// (Paul), and the end screen breaks the total down.

const SCORE_PER_GRAM = 1.25;    // an object's points: a dinner plate (600 g) is 750
const SCORE_GUY = 5;            // a backup, or a bubblegum soldier, knocked off
const SCORE_FIRST_GUY = 25;     // the first guy knocked off
const SCORE_FADE_TIME = 1;      // seconds the end screen takes to fade in
const SCORE_FONT_PX = 96;

// Every score is a list of terms: a base, then adds, then multipliers, and its
// points are round((base + adds) x mults). This is where a new score add or
// multiplier goes: one entry, and it shows in the math under each score and as
// a row of its own on the end screen. `make` gets the score's context
// { thing, guy, guysOnTable } and returns { label, op: 'add' | 'mult', value },
// or null for none; `row` names its line on the end screen.
const SCORE_TERMS = [
    // times the guys on the table when it goes over (Paul), so saving a big
    // plate for the end pays; a guy's own score doesn't count himself
    { row: 'Guys multiplier', make: ctx => ({ label: 'guys', op: 'mult', value: Math.max(1, ctx.guysOnTable) }) },
];

// Scores that land together are queued (Paul): each gets SCORE_QUEUE_STEP
// seconds to itself, so a big sweep plays out over a while and nothing piles
// on top of anything. The running total counts up with them, and the end
// screen waits for the last.
const SCORE_QUEUE_STEP = 1.1;
const SCORE_FADE_IN = 0.35;     // seconds a score takes to come up: nothing blinks
const SCORE_EDGE_FADE = 0.3;    // the last part of its SCORE_QUEUE_STEP, fading out
const SCORE_EDGE_INSET = 70;    // how far in from where it went over a score shows
const SCORE_EDGE_DRIFT = 45;    // and drifts further in
const SCORE_EDGE_PX = 42;
const SCORE_NAME_PX = 22;
const SCORE_MATH_PX = 18;
const SCORE_TOTAL_PX = 30;      // the running total, above the table

// The end screen: "Score: N", a row per group of things and per kind of term,
// a rule and the total, on a panel like the dialog box
const SCORE_ROW_PX = 30;
const SCORE_ROW = 40;           // between rows, at SCORE_ROW_PX
const SCORE_ROW_MIN_PX = 14;    // rows shrink to fit above the dialog box, to no less than this
const SCORE_ROW_MIN_REAL_PX = 10; // or this in real pixels, so a phone can read them
const SCORE_COL = 3.6;          // the middle column sits this many font sizes in from the right
const SCORE_END_W = 540;
const SCORE_END_PAD = 24;
const SCORE_END_MARGIN = 30;    // from the view's top
const SCORE_END_GAP = 12;       // between the panel and the dialog box under it
const SCORE_TITLE_PX = 56;      // "Time's up!" above the score
const SCORE_GROUPS = [
    ['plates', 'Plates'], ['cutlery', 'Cutlery'], ['glasses', 'Glasses'],
    ['cups', 'Cups and saucers'], ['other', 'Other'], ['guys', 'Guys'],
];
const SCORE_CREDITS = [
    'Designed by Paul & David',
];
// The credits sit small in a box of their own, tucked inside the table's top
// right corner as the screen shows it (dhfm91)
const SCORE_CREDIT_PX = 16.5;
const SCORE_CREDIT_LINE = 21;   // between the credit lines
const SCORE_CREDIT_PAD = 10;    // round them, inside their box
const SCORE_CREDIT_INSET = 14;  // from the table's edges
const SCORE_CREDIT_MIN_PX = 9;  // never smaller than this on the screen, in real pixels, so a phone can read them
// A panel behind the end screen, and the credits' box, like the dialog box, so
// they read over whatever is left on the table (dhfm91)
const SCORE_PANEL_ALPHA = 0.92; // nearly solid: the table only just shows through

let score = 0;
let scoreShown = null;   // seconds the end screen has been showing; null before then
let scoreLog = [];       // every score, in the order they came: see scoreEntry
let scoreNow = 0;        // seconds, for the queue
let scoreQueueEnd = 0;   // when the last queued score has had its turn

function resetScore() {
    score = 0;
    scoreShown = null;
    scoreLog = [];
    scoreQueueEnd = 0;
}

const scoreCommas = n => n.toLocaleString('en-US');

function scoreKey(kind) {
    for (const k in KINDS) if (KINDS[k] === kind) return k;
    return '?';
}

function scoreGroup(key) {
    if (/fork|knife|spoon/i.test(key)) return 'cutlery';
    if (/plate|charger/i.test(key)) return 'plates';
    if (/glass|goblet|flute/i.test(key)) return 'glasses';
    if (/cup|saucer/i.test(key)) return 'cups';
    return 'other';
}

// Points, step by step: the bases, then the adds, then the mults, rounding as
// it goes, so the points each term brought always add up to the whole.
function settleTerms(terms) {
    let run = 0, prev = 0, base = 0;
    const extras = [];
    for (const op of ['base', 'add', 'mult']) {
        for (const term of terms.filter(t => t.op === op)) {
            run = op === 'mult' ? run * term.value : run + term.value;
            const now = Math.round(run);
            if (op === 'base') base = now; else extras.push({ term, pts: now - prev });
            prev = now;
        }
    }
    return { n: prev, base, extras };
}

// The math under a score: its base, then each add and mult that changes
// anything ("750 ×3 guys"); with none, how the base was worked out.
function termsMath(terms) {
    const bases = terms.filter(t => t.op === 'base');
    const shown = terms.filter(t => (t.op === 'add' && t.value !== 0) || (t.op === 'mult' && t.value !== 1));
    if (!shown.length) return bases.map(t => t.label).join(' + ');
    let s = scoreCommas(Math.round(bases.reduce((sum, t) => sum + t.value, 0)));
    for (const t of shown.filter(t => t.op === 'add')) s += ' +' + scoreCommas(t.value) + ' ' + t.label;
    for (const t of shown.filter(t => t.op === 'mult')) s += ' ×' + t.value + ' ' + t.label;
    return s;
}

// One score: its terms worked out, added to the total, and queued to show.
// ctx: { thing, guy, name, group, where (meters, where it went over), base }
function scoreEntry(ctx) {
    ctx.guysOnTable = guys.filter(g => g !== ctx.guy && onTable(g.thing) && !g.leaving && !g.entrance).length;
    const terms = [ctx.base];
    for (const m of SCORE_TERMS) {
        const term = m.make(ctx);
        if (term) terms.push(Object.assign({ row: m.row }, term));
    }
    const { n, base, extras } = settleTerms(terms);
    score += n;
    const start = Math.max(scoreNow, scoreQueueEnd);
    scoreQueueEnd = start + SCORE_QUEUE_STEP;
    scoreLog.push({ name: ctx.name, group: ctx.group, where: ctx.where ? Vec2.clone(ctx.where) : null, n, base, extras,
        math: termsMath(terms), start });
}

// An object has gone over the edge.
function scoreObject(t) {
    if (clockUp) return;
    const key = scoreKey(t.kind);
    scoreEntry({
        thing: t, name: TALK_NAMES[key] || key.replace(/([A-Z])/g, ' $1').toLowerCase(), group: scoreGroup(key),
        where: t.edgeAt,
        base: { label: scoreCommas(t.kind.mass) + ' g × ' + SCORE_PER_GRAM, op: 'base', value: t.kind.mass * SCORE_PER_GRAM },
    });
}

// A guy has been knocked or dragged off: he scores the first time only.
function scoreGuy(g) {
    if (g.scored || clockUp) return;
    g.scored = true;
    const first = g === guys[0];
    scoreEntry({
        guy: g, name: first ? 'first guy' : g.gum ? 'bubblegum soldier' : 'backup', group: 'guys',
        where: g.thing.edgeAt,
        base: { label: first ? 'first guy' : 'backup', op: 'base', value: first ? SCORE_FIRST_GUY : SCORE_GUY },
    });
}

// Whether the run is over: nothing left in play (thrown off or gummed down),
// and every guy has gone over and out of sight.
function runOver() {
    return !things.some(inPlay)
        && guys.every(g => !onTable(g.thing) && g.thing.fall >= FALL_TIME);
}

// A box like the dialog box, nearly solid, faded in by `shown`; leaves the ink
// ready for what goes in it.
function scorePanel(c, shown, x, y, w, h) {
    c.globalAlpha = shown * SCORE_PANEL_ALPHA;
    c.fillStyle = DIALOG;
    c.fillRect(x, y, w, h);
    c.globalAlpha = shown;
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.strokeRect(x, y, w, h);
    c.fillStyle = INK;
}

// The table's top right corner as the screen shows it, in upright view units:
// on a phone held upright the frame is turned (js/frame.js), and frame (x, y)
// is (LH - y, x) in the view.
function tableCornerInView() {
    const w = TABLE_W_MM / MM_PER_UNIT, h = TABLE_H_MM / MM_PER_UNIT;
    const xs = [(LW - w) / 2, (LW + w) / 2], ys = [(LH - h) / 2, (LH + h) / 2];
    if (frameTurned) return { x: LH - ys[0], y: xs[0] };
    return { x: xs[1], y: ys[0] };
}

// The floor's margin above the table as the screen shows it: where the clock
// and the running total sit, out of the way, as plain text (Paul). `left` and
// `right` are the table's ends, `mid` the middle of the margin's height.
function tableTopInView(view) {
    const w = TABLE_W_MM / MM_PER_UNIT, h = TABLE_H_MM / MM_PER_UNIT;
    const tw = frameTurned ? h : w, th = frameTurned ? w : h;
    return { left: (view.w - tw) / 2, right: (view.w + tw) / 2, mid: (view.h - th) / 4 };
}

function scoreText(c, s, px, x, y, align, base) {
    c.font = px + 'px "Patrick Hand"';
    c.textAlign = align;
    c.textBaseline = base;
    c.fillText(s, x, y);
}

// Each score in its turn, near where it went over: "+750", the name, and the
// math when a term changed it, drifting a little in and fading.
function drawScoresAsTheyCome(c, view, fade) {
    const shown = scoreLog.filter(e => scoreNow >= e.start);
    for (const e of shown) {
        const t = scoreNow - e.start;
        if (t >= SCORE_QUEUE_STEP || !e.where) continue;
        const f = mmToFrame(e.where.x * 1000, e.where.y * 1000);
        const v = frameTurned ? { x: LH - f.y, y: f.x } : f;
        const dx = view.w / 2 - v.x, dy = view.h / 2 - v.y, d = Math.hypot(dx, dy) || 1;
        const move = SCORE_EDGE_INSET + SCORE_EDGE_DRIFT * t / SCORE_QUEUE_STEP;
        const x = Math.max(SCORE_EDGE_INSET, Math.min(view.w - SCORE_EDGE_INSET, v.x + dx / d * move));
        const y = Math.max(SCORE_EDGE_PX, Math.min(view.h - TALK_MARGIN - TALK_BOX_H - SCORE_NAME_PX * 2, v.y + dy / d * move));
        c.globalAlpha = fade * Math.min(1, t / SCORE_FADE_IN)
            * (1 - Math.max(0, t - (SCORE_QUEUE_STEP - SCORE_EDGE_FADE)) / SCORE_EDGE_FADE);
        c.fillStyle = INK;
        scoreText(c, '+' + scoreCommas(e.n), SCORE_EDGE_PX, x, y, 'center', 'bottom');
        scoreText(c, e.name, SCORE_NAME_PX, x, y, 'center', 'top');
        if (e.extras.some(x => x.pts)) scoreText(c, e.math, SCORE_MATH_PX, x, y + SCORE_NAME_PX * 1.05, 'center', 'top');
    }
    if (!shown.length) return;
    // the total so far, counting only what's been shown
    const top = tableTopInView(view);
    c.globalAlpha = fade * Math.min(1, (scoreNow - scoreLog[0].start) / SCORE_FADE_IN);
    c.fillStyle = INK;
    scoreText(c, 'Total ' + scoreCommas(shown.reduce((sum, e) => sum + e.n, 0)), SCORE_TOTAL_PX,
        top.right, top.mid, 'right', 'middle');
}

// The end screen's rows: [label, middle column, points]. A row per group that
// scored (its base points), one per kind of term (the points it added), then
// what scored nothing and why, and the time.
function scoreRows() {
    const rows = [];
    for (const [g, label] of SCORE_GROUPS) {
        const mine = scoreLog.filter(e => e.group === g);
        if (!mine.length) continue;
        const count = g === 'guys' ? String(mine.length) : mine.length + (mine.length === 1 ? ' piece' : ' pieces');
        rows.push([label, count, scoreCommas(mine.reduce((sum, e) => sum + e.base, 0))]);
    }
    const kinds = [];
    for (const e of scoreLog) for (const x of e.extras) {
        let k = kinds.find(k => k.row === x.term.row);
        if (!k) kinds.push(k = { row: x.term.row, pts: 0 });
        k.pts += x.pts;
    }
    for (const k of kinds) if (k.pts) rows.push([k.row, '', (k.pts > 0 ? '+' : '-') + scoreCommas(Math.abs(k.pts))]);
    const gummed = things.filter(t => !isGuy(t) && onTable(t) && t.gummed).length;
    if (gummed) rows.push(['Gummed', gummed + (gummed === 1 ? ' thing' : ' things'), '0']);
    const left = things.filter(inPlay).length;
    if (left) rows.push(['Left on the table', left + (left === 1 ? ' piece' : ' pieces'), '']);
    if (!clockUp) rows.push(['Time left', clockSeconds() + ' s', '']);
    return rows;
}

// "Time's up!" if it is, "Score: N", the rows, a rule and the total, on a
// panel centered above the dialog box, which stays up after the score.
function drawEndScore(c, view, shown) {
    const rows = scoreRows();
    const titleH = clockUp ? SCORE_TITLE_PX * 1.1 + 6 : 0;
    const head = titleH + SCORE_FONT_PX * 1.1 + 14;
    const top = SCORE_END_MARGIN, bottom = view.h - TALK_MARGIN - TALK_BOX_H - SCORE_END_GAP;
    const rowsH = px => (rows.length + 1) * px * SCORE_ROW / SCORE_ROW_PX + 14;
    const avail = bottom - top - SCORE_END_PAD * 2 - head;
    const minPx = Math.max(SCORE_ROW_MIN_PX, SCORE_ROW_MIN_REAL_PX * view.w / canvas.getBoundingClientRect().width);
    const px = Math.max(minPx, Math.min(SCORE_ROW_PX, SCORE_ROW_PX * avail / rowsH(SCORE_ROW_PX)));
    const rowH = px * SCORE_ROW / SCORE_ROW_PX;
    const w = Math.min(SCORE_END_W, view.w - SCORE_END_MARGIN * 2), h = SCORE_END_PAD * 2 + head + rowsH(px);
    const x = view.w / 2 - w / 2, y = (top + bottom) / 2 - h / 2;
    scorePanel(c, shown, x, y, w, h);
    if (clockUp) scoreText(c, "Time's up!", SCORE_TITLE_PX, view.w / 2, y + SCORE_END_PAD, 'center', 'top');
    scoreText(c, 'Score: ' + scoreCommas(score), SCORE_FONT_PX, view.w / 2, y + SCORE_END_PAD + titleH, 'center', 'top');
    const left = x + SCORE_END_PAD, right = x + w - SCORE_END_PAD, mid = right - px * SCORE_COL;
    let ry = y + SCORE_END_PAD + head;
    for (const [label, middle, pts] of rows) {
        scoreText(c, label, px, left, ry, 'left', 'top');
        scoreText(c, middle, px, mid, ry, 'right', 'top');
        scoreText(c, pts, px, right, ry, 'right', 'top');
        ry += rowH;
    }
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.beginPath();
    c.moveTo(left, ry + 2);
    c.lineTo(right, ry + 2);
    c.stroke();
    ry += 14;
    scoreText(c, 'Total', px, left, ry, 'left', 'top');
    scoreText(c, scoreCommas(score), px, right, ry, 'right', 'top');
}

// The credits: a box tucked inside the table's top right corner, the whole box
// scaled up together on a small screen.
function drawCredits(c, view, shown) {
    const perPx = view.w / canvas.getBoundingClientRect().width;
    const k = Math.max(1, SCORE_CREDIT_MIN_PX * perPx / SCORE_CREDIT_PX);
    const pad = SCORE_CREDIT_PAD * k, line = SCORE_CREDIT_LINE * k;
    c.font = SCORE_CREDIT_PX * k + 'px "Patrick Hand"';
    let cw = 0;
    for (const l of SCORE_CREDITS) cw = Math.max(cw, c.measureText(l).width);
    const bw = cw + pad * 2, bh = SCORE_CREDITS.length * line + pad * 2;
    const corner = tableCornerInView();
    const bx = corner.x - SCORE_CREDIT_INSET - bw, by = corner.y + SCORE_CREDIT_INSET;
    scorePanel(c, shown, bx, by, bw, bh);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    SCORE_CREDITS.forEach((l, i) => c.fillText(l, bx + pad, by + pad + i * line + k));
}

// The scores as they come, and once the run is over (or time's up) and every
// queued score has had its turn, the end screen with the credits. All upright
// on the screen, like the dialog box, even when the table is turned on a phone.
function drawScore(c, dt) {
    c.save();
    const view = uprightView(c);
    scoreNow += dt;
    const done = !scoreLog.length || scoreNow >= scoreQueueEnd;
    const ending = (runOver() || clockUp) && done;
    const fade = scoreShown === null ? 1 : Math.max(0, 1 - scoreShown / SCORE_FADE_TIME);
    drawScoresAsTheyCome(c, view, fade);
    if (ending) {
        // the first guy has his last word as the score comes up
        if (scoreShown === null) {
            scoreShown = 0;
            say(TALK_DAMAGE, 'sad', null);
        }
        scoreShown += dt;
        const shown = Math.min(1, scoreShown / SCORE_FADE_TIME);
        drawEndScore(c, view, shown);
        drawCredits(c, view, shown);
    }
    c.restore();
}
