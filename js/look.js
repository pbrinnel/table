// The whole look: black lines on white, one stroke width for everything.

const INK = '#000';
const PAPER = '#fff';
const LINE_WIDTH = 2;   // frame units, the same for every line on the table

// Lines are stroked in the frame's own transform, not the object's, so every
// line on the table is LINE_WIDTH wide: a shrinking or tipping object keeps the
// same pen rather than going hairline along one side.
let inkFrame = null;   // the frame's transform, captured before each drawing pass

function inkLine(c) {
    c.save();
    if (inkFrame) c.setTransform(inkFrame);
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.stroke();
    c.restore();
}

// Fill the current path with paper, so it hides whatever is under it, then
// outline it in ink.
function inkShape(c) {
    c.fillStyle = PAPER;
    c.fill();
    inkLine(c);
}

// Adds a full circle to the current path without joining it to the last point.
function ring(c, x, y, r) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
}

// A tall thing tipped by `tilt` toward n: a point at height z slides out by
// z × sin(tilt). Each of its parts gets one outline wrapping its bottom circle
// and its top circle, each as the current transform shows it, drawn from the
// bottom part up, so a glass reads as foot, stem and bowl leaning over; then
// its own drawing goes on at the rim. Upright, every part's outline is just
// its wider circle, and it looks as it always has.
const TALL_OUTLINE_STEPS = 32;   // points round each circle an outline is built from

// perMm: frame units per mm at the current scale, for how far the parts slide.
function drawTall(c, kind, t, tilt, n, perMm) {
    const parts = kind.tall.parts;
    const footM = c.getTransform();
    // the transform for whatever is at height z (mm)
    const at = z => {
        const slide = z * Math.sin(tilt) * perMm;   // frame units
        return inkFrame.multiply(new DOMMatrix().translate(n.x * slide, n.y * slide))
            .multiply(inkFrame.inverse()).multiply(footM);
    };
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    for (const [z0, r0, z1, r1] of parts) {
        const pts = [];
        for (const [m, r] of [[at(z0), r0], [at(z1), r1]]) {
            for (let i = 0; i < TALL_OUTLINE_STEPS; i++) {
                const a = i / TALL_OUTLINE_STEPS * Math.PI * 2;
                pts.push(m.transformPoint(new DOMPoint(Math.cos(a) * r, Math.sin(a) * r)));
            }
        }
        c.beginPath();
        convexHull(pts).forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
        c.closePath();
        inkShape(c);
    }
    c.restore();
    c.setTransform(at(parts[parts.length - 1][2]));
    kind.draw(c, t);
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
