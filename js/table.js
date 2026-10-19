// The table, and where things start on it.
// Positions are in mm from the table's center, x to the right and y down.
// The physics runs in meters; the drawing runs in frame units.

// The table's size is open in DESIGN.md. MM_PER_UNIT sets how much of the
// frame it fills; the margin left round it is where falling things are seen
// going over the edge.
const TABLE_W_MM = 1840, TABLE_H_MM = 1200;
const MM_PER_UNIT = 1.8;

// A test layout, not the real setting: which objects, and how many place
// settings, are still open in DESIGN.md. It spans light to heavy so weight
// can be felt.
const TEST_LAYOUT = [
    { kind: 'dinnerPlate', x: -450, y: -250 },
    { kind: 'dinnerPlate', x: 0, y: -250 },
    { kind: 'dinnerPlate', x: 450, y: -250 },
    { kind: 'sidePlate', x: -620, y: 250 },
    { kind: 'sidePlate', x: 620, y: 250 },
    { kind: 'knife', x: -360, y: 250, angle: Math.PI / 2 },
    { kind: 'knife', x: 360, y: 250, angle: Math.PI / 2 },
    { kind: 'tray', x: 0, y: 250 },
];

// where the little guy stands when there's nothing to put back
const GUY_START = { x: 0, y: -10 };

function mmToFrame(xMm, yMm) {
    return { x: LW / 2 + xMm / MM_PER_UNIT, y: LH / 2 + yMm / MM_PER_UNIT };
}

function frameToMm(p) {
    return { x: (p.x - LW / 2) * MM_PER_UNIT, y: (p.y - LH / 2) * MM_PER_UNIT };
}

function drawTable(c) {
    const w = TABLE_W_MM / MM_PER_UNIT, h = TABLE_H_MM / MM_PER_UNIT;
    c.lineWidth = LINE_WIDTH;
    c.strokeStyle = INK;
    c.strokeRect((LW - w) / 2, (LH - h) / 2, w, h);
}
