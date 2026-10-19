// The little guy talks: an RPG-style dialog box at the bottom of the screen,
// his portrait on the left and the words typed out beside it. say() is the
// general mechanism; startTalk() and listenForTalk() are the opening sequence
// built on it.
//
// The box is drawn upright on the screen, through frame.js's uprightView(),
// not in the table's frame: on a portrait phone the table is turned, and text
// turned with it couldn't be read. It never takes input; touches pass through
// to the table.

const TALK_CHARS_PER_SEC = 40;   // the typewriter
const TALK_MAD_TIME = 5;         // seconds the MAD line stays once fully typed
const TALK_FADE_TIME = 0.3;      // seconds to fade out after that

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

const PORTRAIT_SIZE = 200;       // the art's coordinates are a 200 x 200 box

// head, ears, neck, shoulders and collar: the same in every mood
const PORTRAIT_BASE = [
    ['shape', 'M66 200 L90 174 L110 168 L130 168 L152 176 L174 200'],
    ['line', 'M108 142 L106 170 M128 142 L131 170'],
    ['shape', 'M152 56 L196 24 L180 88 L162 96 Z'],
    ['shape', 'M68 70 L6 34 L22 96 L64 116 Z'],
    ['shape', 'M64 116 C54 90 56 50 82 30 C104 12 142 14 158 40 C168 58 170 82 166 100 L154 134 L130 152 L104 150 L82 138 Z'],
    ['ink', 'M58 76 L20 48 L30 88 L58 102 Z'],
    ['ink', 'M164 62 L188 38 L176 80 L168 84 Z'],
    ['ink', 'M82 138 L104 150 L130 152 L127 162 L108 160 Z'],
    ['shape', 'M106 170 L118 182 L110 186 Z M131 170 L122 182 L132 186 Z'],
];

const PORTRAIT_FACES = {
  stern: [
    ['ink', 'M80 58 C96 56 114 60 128 70 L124 78 C110 70 96 68 84 70 Z'],
    ['ink', 'M140 74 C146 66 154 60 164 58 L165 66 C156 68 150 74 144 80 Z'],
    ['ink', 'M92 78 C102 74 114 76 122 82 C114 90 100 90 92 84 Z'],
    ['ink', 'M146 84 C150 80 156 78 162 78 C160 86 152 90 146 88 Z'],
    ['paper', 'M112 82 m-2.2 0 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0'],
    ['paper', 'M156 83 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0'],
    ['shape', 'M132 84 C140 92 160 104 178 112 C166 118 150 120 140 118 C134 114 132 108 134 100'],
    ['ink', 'M136 102 C140 110 148 116 160 117 C150 120 142 119 138 116 C134 112 134 106 136 102 Z'],
    ['line', 'M112 132 C122 126 136 125 150 129'],
    ['ink', 'M122 136 C130 138 138 138 144 135 C140 141 128 142 122 136 Z'],
  ],
  mad: [
    ['ink', 'M78 52 C96 56 116 64 130 78 L124 84 C110 74 96 68 82 64 Z'],
    ['ink', 'M140 82 C145 72 152 64 160 60 L162 67 C154 72 150 78 146 86 Z'],
    ['ink', 'M94 82 C104 80 114 82 122 88 C114 92 102 92 94 86 Z'],
    ['ink', 'M148 88 C152 86 158 84 162 84 C160 90 152 92 148 92 Z'],
    ['paper', 'M112 86 m-1.8 0 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0'],
    ['paper', 'M156 88 m-1.4 0 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0'],
    ['shape', 'M132 84 C140 92 160 104 178 112 C166 118 150 120 140 118 C134 114 132 108 134 100'],
    ['ink', 'M136 102 C140 110 148 116 160 117 C150 120 142 119 138 116 C134 112 134 106 136 102 Z'],
    ['ink', 'M108 128 C120 122 138 121 154 126 C150 138 136 144 122 142 C114 140 110 134 108 128 Z'],
    ['shape', 'M113 129 C124 125 138 124 151 127 L148 133 L144 129 L140 134 L136 129 L132 134 L128 129 L124 134 L120 130 L116 134 Z'],
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
            if (talk.fade >= TALK_FADE_TIME) { talk = null; return; }
        }
    }

    c.save();
    const view = uprightView(c);
    const w = Math.min(TALK_BOX_W, view.w - 2 * TALK_MARGIN);
    const x = (view.w - w) / 2;
    const y = view.h - TALK_MARGIN - TALK_BOX_H;
    c.globalAlpha = TALK_FADE_TIME > 0 ? 1 - talk.fade / TALK_FADE_TIME : 1;

    c.fillStyle = PAPER;
    c.fillRect(x, y, w, TALK_BOX_H);
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

function listenForTalk() {
    addEventListener('grabbed', () => {
        if (!talkWaitingForGrab) return;
        talkWaitingForGrab = false;
        say(TALK_MAD, 'mad', TALK_MAD_TIME);
    });
}
