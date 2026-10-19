// The whole look: black lines on white, one stroke width for everything.

const INK = '#000';
const PAPER = '#fff';
const LINE_WIDTH = 2;   // frame units, the same for every line on the table

// Fill the current path with paper, so it hides whatever is under it, then
// outline it in ink.
function inkShape(c) {
    c.fillStyle = PAPER;
    c.fill();
    c.strokeStyle = INK;
    c.stroke();
}

// Adds a full circle to the current path without joining it to the last point.
function ring(c, x, y, r) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
}
