// The colors: flat fills under the black ink, in a pastel palette. Only
// fills live here; the pen (width, ink, smoothing) is js/look.js.

const FLOOR = '#ffe0ee';       // the page round the table
const CLOTH = '#a0e0ff';       // inside the table's outline
const PLATE = '#ffffff';
const PLATE_WELL = '#fff0b0';  // a plate's or saucer's inner ring
const CHARGER = '#ffd860';
const CHARGER_WELL = '#fff0b0';
const GLASS = '#d8fff0';
const CUTLERY = '#d0d0e0';
const CUTLERY_DARK = '#a0a0b8';   // a handle's inner line
const NAPKIN = '#ff90b0';
const CUP = '#ffffff';
const CUP_BAND = '#b090ff';
const GUY_SKIN = '#ffe0b0';
const GUY_SHIRT = '#ff9090';   // the first guy's; backups wear a GUY_CAPS color
const GUY_CAPS = ['#90e090', '#b090ff', '#ffc060', '#60c0ff'];
const GUM = '#ff7fc0';         // bubblegum: the wad, its strands, a bubblegum soldier's body
const GUM_PUDDLE = '#ffc6e3';  // the puddle a gummed thing sits in
const DIALOG = '#ffffff';      // the talk box (drawn see-through, TALK_BOX_ALPHA)
const PORTRAIT = '#ffe0b0';

// Each spec is what look.js's setInkSpec takes: fills[n] for the nth inkShape
// of a drawing, lines[n] for an inner fill under the nth inkLine.
const DIALOG_SPEC = { fills: [DIALOG], lines: {} };
const PORTRAIT_SPEC = { fills: [PORTRAIT], lines: {} };

// The kind's name in KINDS, which is what picks its colors: the drawings
// don't know their own names.
function kindName(kind) {
    return Object.keys(KINDS).find(k => KINDS[k] === kind);
}

function kindSpec(name) {
    if (/Fork$|Knife$|Spoon$/.test(name)) return { fills: [CUTLERY], lines: { 0: CUTLERY_DARK } };
    if (/Glass$|Goblet$|Flute$/.test(name)) return { fills: [GLASS], lines: {} };
    if (/Plate$/.test(name) || /Saucer$/.test(name)) return { fills: [PLATE], lines: { 0: PLATE_WELL } };
    if (name === 'charger') return { fills: [CHARGER], lines: { 0: CHARGER_WELL } };
    if (name === 'napkin') return { fills: [NAPKIN], lines: {} };
    if (name === 'consommeCup') return { fills: [CUP], lines: { 0: CUP_BAND } };
    if (/Cup$/.test(name)) return { fills: [CUP], lines: { 1: CUP_BAND } };
    return { fills: [CUTLERY], lines: {} };   // the tray
}

// A guy's shapes come in the order body, ears, head. The first guy has a shirt
// and skin, and his head is his black hair; each backup's shirt is a GUY_CAPS
// color and his head the one before it.
function guySpec(g) {
    // a bubblegum soldier: pink body, square head (js/guy.js)
    if (g.gum) return { fills: [GUM, GUY_SKIN], lines: {} };
    const i = guys.indexOf(g);
    const cap = i > 0 ? GUY_CAPS[(i - 1) % GUY_CAPS.length] : GUY_SKIN;
    const shirt = i > 0 ? GUY_CAPS[i % GUY_CAPS.length] : GUY_SHIRT;
    return { fills: [shirt, GUY_SKIN, cap], lines: {} };
}

// The spec for drawing thing t.
function inkSpecOf(t) {
    return isGuy(t) ? guySpec(t.guy) : kindSpec(kindName(t.kind));
}
