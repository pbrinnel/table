// The table, and where things start on it.
// Positions are in mm from the table's center, x to the right and y down.
// The physics runs in meters; the drawing runs in frame units.

// The table's size is open in DESIGN.md. MM_PER_UNIT sets how much of the
// frame it fills; the margin left round it is where falling things are seen
// going over the edge.
const TABLE_W_MM = 1840, TABLE_H_MM = 1200;
const MM_PER_UNIT = 1.8;

// One formal place setting, from Paul's reference, laid out as seen from above.
// How many settings, and what else sits on the table, is still open in
// DESIGN.md. Boxes keep 22 mm from each other, since Planck rounds a box's
// corners out by 10 mm (see js/objects.js). `at` places each piece by its offset in mm from the charger's
// center, so the whole setting can move as one by changing SETTING_X/Y.
const SETTING_X = -118, SETTING_Y = 63;
// turns that put a cutlery drawing's working end (tines, bowl) up the table,
// or a knife's tip up
const UP = -Math.PI / 2, DOWN = Math.PI / 2;

// on: the kind of an earlier piece in the layout that this one rests on, a
// level up (DESIGN.md, "levels"), placed at that piece's center.
function at(kind, dx, dy, angle, on) {
    return { kind, x: SETTING_X + dx, y: SETTING_Y + dy, angle: angle || 0, on };
}

const TEST_LAYOUT = [
    at('chargerSetting', 0, 0),
    // left of it, outside in: napkin, salad, fish and meat forks (tines up)
    at('napkin', -400, 20, DOWN),
    at('saladFork', -303, 35, UP),
    at('fishFork', -252, 28, UP),
    at('meatFork', -200, 18, UP),
    // right of it, inside out: knives (blades toward the plate), spoons, seafood fork
    at('meatKnife', 200, 3, DOWN),
    at('fishKnife', 245, 15, DOWN),
    at('saladKnife', 290, 25, DOWN),
    at('teaspoon', 335, 45, UP),
    at('demitasseSpoon', 382, 65, UP),
    at('soupSpoon', 443, 30, UP),
    at('seafoodFork', 502, 58, UP),
    // upper left: bread plate, its knife lying along its top
    at('breadPlate', -360, -190),
    at('butterKnife', -360, -285),
    // above the charger: dessert spoon (handle right), cake fork (handle left)
    at('dessertSpoon', -5, -200, Math.PI),
    at('cakeFork', 0, -250),
    // glasses along the top right, the cordial in front
    at('waterGoblet', 205, -225),
    at('champagneFlute', 290, -215),
    at('whiteWineGlass', 370, -205),
    at('redWineGlass', 468, -195),
    at('cordialGlass', 320, -140),
    // coffee and demitasse cups on their saucers, handles to the right
    at('coffeeSaucer', 620, -90),
    at('coffeeCup', 620, -90, 0, 'coffeeSaucer'),
    at('demitasseSaucer', 610, 60),
    at('demitasseCup', 610, 60, 0, 'demitasseSaucer'),
];

// where the little guy stands when there's nothing to put back: the open
// cloth in front of the setting
const GUY_START = { x: 0, y: 450 };

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
