// The whole look: black lines, one stroke width for everything. PAPER is the
// fill under the ink when nothing has set a color (js/color.js).

const INK = '#000';
const PAPER = '#fff';
const LINE_WIDTH = 2;   // frame units, the same for every line on the table

// Lines are stroked in the frame's own transform, not the object's, so every
// line on the table is LINE_WIDTH wide: a shrinking or tipping object keeps the
// same pen rather than going hairline along one side.
let inkFrame = null;   // the frame's transform, captured before each drawing pass

// What the object being drawn is filled with (js/color.js makes these):
// { fills, lines }. fills[n] is the fill of the nth inkShape call, the last
// one repeating; lines[n] is an inner fill for the nth inkLine call, painted
// before its stroke. With none set, shapes are filled with PAPER, as plain
// paper.
let inkSpec = null;
let inkShapeN = 0;   // inkShape calls made under the current spec
let inkLineN = 0;    // inkLine calls made under the current spec

function setInkSpec(spec) {
    inkSpec = spec;
    inkShapeN = 0;
    inkLineN = 0;
}

function clearInkSpec() {
    inkSpec = null;
}

// The fill the next inkShape will use; also for drawings that fill a path of
// their own under the ink.
function inkFill() {
    return inkSpec ? inkSpec.fills[Math.min(inkShapeN, inkSpec.fills.length - 1)] : PAPER;
}

function inkStroke(c) {
    c.save();
    if (inkFrame) c.setTransform(inkFrame);
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.stroke();
    c.restore();
}

function inkLine(c) {
    if (inkSpec && inkSpec.lines[inkLineN] !== undefined) {
        c.save();
        c.fillStyle = inkSpec.lines[inkLineN];
        c.fill();
        c.restore();
    }
    inkLineN++;
    inkStroke(c);
}

// Fill the current path, so it hides whatever is under it, then outline it in
// ink.
function inkShape(c) {
    c.fillStyle = inkFill();
    c.fill();
    inkShapeN++;
    inkStroke(c);
}

// Adds a full circle to the current path without joining it to the last point.
function ring(c, x, y, r) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
}

// A tall thing tipped by `tilt` toward n: a point at height z slides out by
// z × sin(tilt). Each of its parts gets one outline wrapping its bottom circle
// and its top circle, each as the current transform shows it, so a glass reads
// as foot, stem and bowl leaning over; then its own drawing goes on at the rim.
// Upright, every part's outline is just its wider circle, and it looks as it
// always has.
const TALL_OUTLINE_STEPS = 32;   // points round each circle an outline is built from

// The pieces of a tall thing to draw, each with the height (mm, above its
// foot) it's seen at, so a caller can draw everything on the table in order
// of height and a glass tipping over its neighbor goes over or under each of
// its parts rightly: a tipped part sits lower, by cos(tilt). Each piece's
// draw(c) sets its own transform. perMm: frame units per mm at the current
// scale, for how far the parts slide.
function tallPieces(c, kind, t, tilt, n, perMm) {
    const parts = kind.tall.parts;
    const footM = c.getTransform();
    const lean = Math.cos(tilt);
    // the transform for whatever is at height z (mm)
    const at = z => {
        const slide = z * Math.sin(tilt) * perMm;   // frame units
        return inkFrame.multiply(new DOMMatrix().translate(n.x * slide, n.y * slide))
            .multiply(inkFrame.inverse()).multiply(footM);
    };
    const pieces = parts.map(([z0, r0, z1, r1]) => ({
        z: (z0 + z1) / 2 * lean,
        draw(c) {
            const pts = [];
            for (const [m, r] of [[at(z0), r0], [at(z1), r1]]) {
                for (let i = 0; i < TALL_OUTLINE_STEPS; i++) {
                    const a = i / TALL_OUTLINE_STEPS * Math.PI * 2;
                    pts.push(m.transformPoint(new DOMPoint(Math.cos(a) * r, Math.sin(a) * r)));
                }
            }
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.beginPath();
            convexHull(pts).forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
            c.closePath();
            inkShape(c);
        },
    }));
    const top = parts[parts.length - 1][2];
    pieces.push({ z: top * lean, draw(c) { c.setTransform(at(top)); kind.draw(c, t); } });
    return pieces;
}

// All of a tall thing at once, bottom up: for drawing one on its own (the labs).
function drawTall(c, kind, t, tilt, n, perMm) {
    for (const p of tallPieces(c, kind, t, tilt, n, perMm)) {
        c.save();
        p.draw(c);
        c.restore();
    }
}

// The convex hull of points, by the monotone chain.
function convexHull(pts) {
    const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const half = list => {
        const h = [];
        for (const q of list) {
            while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
            h.push(q);
        }
        h.pop();
        return h;
    };
    return half(p).concat(half(p.reverse()));
}
