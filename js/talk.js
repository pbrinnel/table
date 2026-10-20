// The little guy talks: an RPG-style dialog box at the bottom of the screen,
// his portrait on the left and the words typed out beside it. say() is the
// general mechanism; startTalk() and listenForTalk() are the opening sequence
// built on it, and callForBackup() and allIsLost() are what he says when objects go over.
//
// The box is drawn upright on the screen, through frame.js's uprightView(),
// not in the table's frame: on a portrait phone the table is turned, and text
// turned with it couldn't be read. It never takes input; touches pass through
// to the table.

const TALK_CHARS_PER_SEC = 40;   // the typewriter
const TALK_MAD_TIME = 5;         // seconds the MAD line stays once fully typed
const TALK_BACKUP_TIME = 2;      // seconds the backup line stays once fully typed
const TALK_LOST_TIME = 4;        // seconds "All is lost..." stays once fully typed
const TALK_CALLOUT_CHANCE = 0.1; // chance a grab of an object draws a callout naming it
const TALK_CALLOUT_TIME = 2.5;   // seconds a callout stays once fully typed
const TALK_CALLOUT_GAP = 6;      // seconds after a callout before another can come
const TALK_FADE_TIME = 0.3;      // seconds to fade out after that
// How solid the box's paper is: just short of 1, so the bottom of the table
// shows faintly through it while the words stay easy to read. The portrait and
// the words are always solid.
const TALK_BOX_ALPHA = 0.85;

// Layout, in frame units
const TALK_BOX_W = 760;
const TALK_BOX_H = 150;
const TALK_MARGIN = 24;          // from the bottom edge, and the narrowest side gap
const TALK_PAD = 16;             // inside the box, and between portrait and text
const TALK_FONT_PX = 40;
const TALK_LINE_H = 44;
const TALK_FONT = TALK_FONT_PX + 'px "Patrick Hand"';

const TALK_DARE = "Don't you DARE touch my plates!";
const TALK_MAD = "Now you've made me MAD!";
const TALK_BACKUP = "Calling for backup!";
const TALK_LOST = "All is lost...";

// What he calls each kind of object, after "the". A kind missing here gets no callout.
const TALK_NAMES = {
    dinnerPlate: 'dinner plate',
    sidePlate: 'side plate',
    knife: 'knife',
    tray: 'tray',
    charger: 'charger',
    saladPlate: 'salad plate',
    consommeCup: 'consomm\u00e9 cup',
    breadPlate: 'bread plate',
    napkin: 'napkin',
    saladFork: 'salad fork',
    fishFork: 'fish fork',
    meatFork: 'meat fork',
    cakeFork: 'cake fork',
    seafoodFork: 'seafood fork',
    meatKnife: 'meat knife',
    fishKnife: 'fish knife',
    saladKnife: 'salad knife',
    butterKnife: 'butter knife',
    teaspoon: 'teaspoon',
    demitasseSpoon: 'demitasse spoon',
    soupSpoon: 'soup spoon',
    dessertSpoon: 'dessert spoon',
    waterGoblet: 'water goblet',
    champagneFlute: 'champagne flute',
    whiteWineGlass: 'white wine glass',
    redWineGlass: 'red wine glass',
    cordialGlass: 'cordial glass',
    coffeeSaucer: 'coffee saucer',
    coffeeCup: 'coffee cup',
    demitasseSaucer: 'demitasse saucer',
    demitasseCup: 'demitasse cup',
};

// {n} is the name above.
const TALK_CALLOUTS = [
    'Not the {n}!',
    'Put the {n} DOWN!',
    'Hands off the {n}!',
    'That {n} is FRENCH!',
    'Leave the {n} ALONE!',
    'Not the {n}, you BRUTE!',
    'Careful with the {n}!',
    'The {n} has a PLACE!',
];

const PORTRAIT_SIZE = 200;       // the art's coordinates are a 200 x 200 box

// head, ears, neck, shoulders: the same in every mood
const PORTRAIT_BASE = [
    ['shape', 'M0 200 L0 188 L34 174 L86 166 L150 170 L192 182 L200 188 L200 200 Z'],
    ['shape', 'M90 138 L88 176 C106 184 136 184 154 176 L152 160 Z'],
    ['shape', 'M74 84 C58 74 44 86 48 104 C50 120 62 126 74 122 Z'],
    ['ink', 'M68 90 C58 86 54 96 56 106 C58 114 64 116 68 114 C62 108 62 98 68 90 Z'],
    ['shape', 'M72 120 C64 92 66 50 86 30 C104 14 140 14 156 34 L162 60 L166 92 L174 140 L168 166 L132 174 L84 156 L74 146 Z'],
    ['ink', 'M76 104 C66 80 66 50 78 34 C90 16 116 4 148 4 C166 4 180 12 178 24 C176 34 168 40 160 46 C150 42 136 42 120 46 C106 48 96 56 92 68 L90 100 Z'],
    ['paper', 'M96 36 C110 22 132 14 158 12 C140 18 120 26 104 40 Z'],
    ['paper', 'M108 44 C122 32 144 26 166 26 C148 32 132 38 120 46 Z'],
    ['ink', 'M84 156 L132 174 L168 166 L162 178 L130 184 L92 168 Z'],
    ['line', 'M160 158 L158 168'],
];

const PORTRAIT_FACES = {
    stern: [
        ['ink', 'M86 64 L134 62 L136 74 L90 78 Z'],
        ['ink', 'M144 62 L166 60 L166 70 L146 74 Z'],
        ['ink', 'M96 80 L130 78 L126 88 L100 88 Z'],
        ['ink', 'M148 78 L162 77 L160 85 L150 85 Z'],
        ['paper', 'M118 83 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0'],
        ['paper', 'M157 81 m-1.5 0 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0'],
        ['shape', 'M146 78 L152 104 L174 116 L164 122 L150 120'],
        ['line', 'M126 142 C138 142 152 140 166 132'],
        ['ink', 'M136 147 C146 148 154 147 160 144 C156 151 144 152 136 147 Z'],
    ],
    mad: [
        ['ink', 'M84 58 L136 70 L134 80 L88 70 Z'],
        ['ink', 'M142 72 L166 58 L168 66 L146 80 Z'],
        ['ink', 'M98 80 L130 84 L126 90 L102 88 Z'],
        ['ink', 'M148 84 L162 80 L160 87 L150 88 Z'],
        ['paper', 'M118 86 m-1.8 0 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0'],
        ['paper', 'M156 84 m-1.4 0 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0'],
        ['shape', 'M146 78 L152 104 L174 116 L164 122 L150 120'],
        ['ink', 'M120 136 L166 130 L164 146 L124 150 Z'],
        ['shape', 'M124 138 L163 133 L162 141 L126 145 Z'],
        ['line', 'M134 137 L135 144 M144 136 L145 142 M154 135 L154 141'],
    ],
    sad: [
        ['ink', 'M88 74 L132 64 L134 72 L92 82 Z'],
        ['ink', 'M144 64 L164 70 L163 77 L144 72 Z'],
        ['ink', 'M100 86 L128 84 L126 90 L102 90 Z'],
        ['ink', 'M148 84 L160 85 L159 90 L149 90 Z'],
        ['paper', 'M114 89 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0'],
        ['paper', 'M153 89 m-1.2 0 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0'],
        ['shape', 'M146 78 L152 104 L174 116 L164 122 L150 120'],
        ['line', 'M126 148 C138 140 152 139 166 144'],
    ],
};

let portraitPaths = null;

// Built on first use, once, rather than parsing the strings every frame.
function portraitFor(face) {
    if (!portraitPaths) {
        const build = list => list.map(([kind, d]) => [kind, new Path2D(d)]);
        portraitPaths = { base: build(PORTRAIT_BASE) };
        for (const f in PORTRAIT_FACES) portraitPaths[f] = build(PORTRAIT_FACES[f]);
    }
    return [...portraitPaths.base, ...portraitPaths[face]];
}

// Draws the portrait in a square at (x, y), clipped to it, then its frame.
function drawPortrait(c, face, x, y, side) {
    const k = side / PORTRAIT_SIZE;
    c.save();
    // the box behind is see-through; the portrait isn't
    c.fillStyle = PAPER;
    c.fillRect(x, y, side, side);
    c.translate(x, y);
    c.scale(k, k);
    c.beginPath();
    c.rect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    c.clip();
    // the art's pen is the table's pen, so undo the scale in the line width
    c.lineWidth = LINE_WIDTH / k;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = INK;
    for (const [kind, path] of portraitFor(face)) {
        if (kind === 'shape' || kind === 'paper') { c.fillStyle = PAPER; c.fill(path); }
        if (kind === 'ink') { c.fillStyle = INK; c.fill(path); }
        if (kind === 'shape' || kind === 'line') c.stroke(path);
    }
    c.restore();

    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.strokeRect(x, y, side, side);
}

// What's being said now, or null. typed counts characters and runs ahead as a
// fraction; since is the time spent fully typed; fade is time spent fading.
let talk = null;
let talkFontReady = false;
let talkFontAsked = false;
let talkWaitingForGrab = false;
let talkLastCallout = -Infinity;   // performance.now() of the last callout, in ms
// Where the box was last drawn, in upright-view units, so a press on it can
// dismiss it; null when nothing is showing.
let talkBox = null;

// Nothing may type or draw before the font is in, or the first words would
// show in a fallback face. A failed load carries on anyway.
function askForTalkFont() {
    if (talkFontAsked) return;
    talkFontAsked = true;
    const ready = () => { talkFontReady = true; };
    document.fonts.load(TALK_FONT).then(ready, ready);
}

// hold: seconds to stay once fully typed, then fade; null stays until replaced.
function say(text, face, hold) {
    askForTalkFont();
    talk = { text, face, hold, typed: 0, since: 0, fade: 0 };
}

function hush() {
    talk = null;
    talkBox = null;
}

// True if a press at this page position lands on the box. The box covers the
// bottom of the table, so pressing it makes it vanish rather than reaching
// through to whatever is underneath.
function talkBoxHit(clientX, clientY) {
    if (!talk || !talkBox) return false;
    const r = canvas.getBoundingClientRect();
    const vw = frameTurned ? LH : LW, vh = frameTurned ? LW : LH;
    const x = (clientX - r.left) / r.width * vw, y = (clientY - r.top) / r.height * vh;
    return x >= talkBox.x && x <= talkBox.x + talkBox.w && y >= talkBox.y && y <= talkBox.y + talkBox.h;
}

// Greedy word wrap of the full line, so words don't jump lines while it types.
function wrapTalk(c, text, width) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
        const tryLine = line ? line + ' ' + word : word;
        if (line && c.measureText(tryLine).width > width) {
            lines.push(line);
            line = word;
        } else {
            line = tryLine;
        }
    }
    lines.push(line);
    return lines;
}

function drawTalk(c, dt) {
    if (!talk || !talkFontReady) return;

    talk.typed += dt * TALK_CHARS_PER_SEC;
    if (talk.typed >= talk.text.length) {
        talk.typed = talk.text.length;
        talk.since += dt;
        if (talk.hold !== null && talk.since >= talk.hold) {
            talk.fade += dt;
            if (talk.fade >= TALK_FADE_TIME) { hush(); return; }
        }
    }

    c.save();
    const view = uprightView(c);
    const w = Math.min(TALK_BOX_W, view.w - 2 * TALK_MARGIN);
    const x = (view.w - w) / 2;
    const y = view.h - TALK_MARGIN - TALK_BOX_H;
    const shown = TALK_FADE_TIME > 0 ? 1 - talk.fade / TALK_FADE_TIME : 1;
    talkBox = { x, y, w, h: TALK_BOX_H };

    c.globalAlpha = shown * TALK_BOX_ALPHA;
    c.fillStyle = PAPER;
    c.fillRect(x, y, w, TALK_BOX_H);
    c.globalAlpha = shown;
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.lineJoin = 'miter';
    c.strokeRect(x, y, w, TALK_BOX_H);

    const side = TALK_BOX_H - 2 * TALK_PAD;
    drawPortrait(c, talk.face, x + TALK_PAD, y + TALK_PAD, side);

    const tx = x + TALK_PAD + side + TALK_PAD;
    c.font = TALK_FONT;
    c.fillStyle = INK;
    c.textAlign = 'left';
    c.textBaseline = 'top';
    let left = Math.floor(talk.typed);
    let ty = y + TALK_PAD;
    for (const line of wrapTalk(c, talk.text, x + w - TALK_PAD - tx)) {
        if (left <= 0) break;
        c.fillText(line.slice(0, left), tx, ty);
        left -= line.length + 1;   // the space the wrap dropped
        ty += TALK_LINE_H;
    }
    c.restore();
}

// The opening: the guy warns, and the first grab makes him mad. Called each
// time a table is set, so a reset warns again.
function startTalk() {
    say(TALK_DARE, 'stern', null);
    talkWaitingForGrab = true;
}

// An object has gone over the edge: he calls for backup, in the mad face. It
// replaces whatever the box is showing, the opening included, and so the
// opening has nothing left to wait for. Each call restarts the line.
function callForBackup() {
    talkWaitingForGrab = false;
    say(TALK_BACKUP, 'mad', TALK_BACKUP_TIME);
}

// The last object has gone over the edge. Said once, as the guys freeze, and
// it replaces whatever the box is showing. The frozen and looking phases in
// guy.js last longer than this line, so they trudge off after it is gone.
function allIsLost() {
    talkWaitingForGrab = false;
    say(TALK_LOST, 'sad', TALK_LOST_TIME);
}

function listenForTalk() {
    addEventListener('grabbed', e => {
        if (talkWaitingForGrab) {
            talkWaitingForGrab = false;
            say(TALK_MAD, 'mad', TALK_MAD_TIME);
            return;
        }
        callOut(e.detail);
    });
}

// Now and then, he yells the name of the very thing that was just picked up.
// It never cuts off a line still typing or "All is lost...", and it keeps its
// distance from the last callout.
function callOut(t) {
    if (!t || isGuy(t)) return;
    if (Math.random() >= TALK_CALLOUT_CHANCE) return;
    const now = performance.now();
    if (now - talkLastCallout < TALK_CALLOUT_GAP * 1000) return;
    if (talk && (talk.typed < talk.text.length || talk.face === 'sad')) return;
    const key = Object.keys(KINDS).find(k => KINDS[k] === t.kind);
    const name = TALK_NAMES[key];
    if (!name) return;
    const line = TALK_CALLOUTS[Math.floor(Math.random() * TALK_CALLOUTS.length)];
    talkLastCallout = now;
    say(line.replace('{n}', name), 'mad', TALK_CALLOUT_TIME);
}
