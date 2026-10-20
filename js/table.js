// The table, and where things start on it.
// Positions are in mm from the table's center, x to the right and y down.
// The physics runs in meters; the drawing runs in frame units.

// A long table, 2:1 like the frame (Paul): MM_PER_UNIT sets how much of the
// frame it fills, and the margin left round it is where falling things are
// seen going over the edge.
const TABLE_W_MM = 2400, TABLE_H_MM = 1250;
const MM_PER_UNIT = 1.9;

// Two formal place settings from Paul's reference, one at each end of the table
// facing the other along its length, with shared pieces down the middle.
// SETTING lists one setting's pieces by their offset in mm from its charger's
// center, as seen with its diner at the bottom (+y); each end turns it to face
// its own end of the table. Boxes keep 22 mm from each other, since Planck
// rounds a box's corners out by 10 mm (see js/objects.js).
// turns that put a cutlery drawing's working end (tines, bowl) up the setting,
// or a knife's tip up
const UP = -Math.PI / 2, DOWN = Math.PI / 2;
// [kind, dx, dy, angle, on]: on is the kind of an earlier piece in the same
// setting that this one rests on, a level up (DESIGN.md, "levels").
const SETTING = [
    // the centerpiece, a stack: charger, dinner plate, salad plate, consommé cup
    ['charger', 0, 0],
    ['dinnerPlate', 0, 0, 0, 'charger'],
    ['saladPlate', 0, 0, 0, 'dinnerPlate'],
    ['consommeCup', 0, 0, 0, 'saladPlate'],
    // left of it, outside in: napkin, salad, fish and meat forks (tines up)
    ['napkin', -400, 20, DOWN],
    ['saladFork', -303, 35, UP],
    ['fishFork', -252, 28, UP],
    ['meatFork', -200, 18, UP],
    // right of it, inside out: knives (blades toward the plate), spoons, seafood fork
    ['meatKnife', 200, 3, DOWN],
    ['fishKnife', 245, 15, DOWN],
    ['saladKnife', 290, 25, DOWN],
    ['teaspoon', 335, 45, UP],
    ['demitasseSpoon', 382, 65, UP],
    ['soupSpoon', 443, 30, UP],
    ['seafoodFork', 502, 58, UP],
    // upper left: bread plate, its knife lying along its top
    ['breadPlate', -360, -190],
    ['butterKnife', -360, -285],
    // above the charger: dessert spoon (handle right), cake fork (handle left)
    ['dessertSpoon', -5, -200, Math.PI],
    ['cakeFork', 0, -250],
    // glasses along the top right, the cordial in front
    ['waterGoblet', 205, -225],
    ['champagneFlute', 290, -215],
    ['whiteWineGlass', 370, -205],
    ['redWineGlass', 468, -195],
    ['cordialGlass', 320, -140],
    // coffee and demitasse cups on their saucers, handles to the right
    ['coffeeSaucer', 620, -90],
    ['coffeeCup', 620, -90, 0, 'coffeeSaucer'],
    ['demitasseSaucer', 610, 60],
    ['demitasseCup', 610, 60, 0, 'demitasseSaucer'],
];

// Where each setting's charger goes and which way it's turned: the left end's
// diner sits at the left edge, the right end's at the right. Chosen so each
// setting's pieces clear the table's edges by about 50 mm.
const SETTING_ENDS = [
    { x: -985, y: -117.5, turn: Math.PI / 2 },
    { x: 985, y: 117.5, turn: -Math.PI / 2 },
];

// Shared down the middle: [kind, x, y, angle] in mm from the table's center.
// Which pieces is a prototype choice (DESIGN.md).
const MIDDLE = [
    ['candelabra', 0, 0, Math.PI / 2],
    ['saltShaker', -240, -45],
    ['pepperShaker', -240, 45],
    ['breadBasket', 300, 0, Math.PI / 2],
];

function settingAt(end) {
    const c = Math.cos(end.turn), s = Math.sin(end.turn);
    return SETTING.map(([kind, dx, dy, angle, on]) => ({
        kind, on,
        x: end.x + dx * c - dy * s, y: end.y + dx * s + dy * c,
        angle: (angle || 0) + end.turn,
    }));
}

const TEST_LAYOUT = [
    ...SETTING_ENDS.flatMap(settingAt),
    ...MIDDLE.map(([kind, x, y, angle]) => ({ kind, x, y, angle: angle || 0 })),
];

// where the little guy stands when there's nothing to put back: the open
// cloth below the middle
const GUY_START = { x: 0, y: 400 };

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
