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
