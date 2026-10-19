// The field: one fixed logical size, scaled to fit whatever screen it's on.
// Everything draws in LW x LH units, so a phone and a desktop run the same
// frame, just bigger or smaller. On a portrait screen the frame is turned a
// quarter clockwise, so the landscape table still fills it.

const LW = 1200, LH = 800;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

let frameScale = 1;
let frameTurned = false;
let lastFit = '';

function resizeFrame() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cs = getComputedStyle(document.body);
    const px = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const py = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

    // The body is 100svh, the stable height; the visual viewport is what a
    // toolbar or keyboard actually leaves showing. The smaller of the two is
    // the only size the field can trust.
    const seenW = window.visualViewport ? visualViewport.width : innerWidth;
    const seenH = window.visualViewport ? visualViewport.height : innerHeight;
    const availW = Math.min(document.body.clientWidth, seenW) - px;
    const availH = Math.min(document.body.clientHeight, seenH) - py;

    const turned = availH > availW;
    // the frame's size as it sits on the screen
    const sw = turned ? LH : LW, sh = turned ? LW : LH;

    // Fit both ways: a phone held sideways runs out of height first. No cap:
    // line drawings stay sharp at any size, so a big screen gets a big table.
    const scale = Math.min(availW / sw, availH / sh);

    // Assigning canvas.width throws the bitmap away even when nothing changed,
    // and iOS fires resize over and over while its toolbar slides.
    const fit = scale.toFixed(4) + ':' + dpr + ':' + turned;
    if (fit === lastFit) return;
    lastFit = fit;
    frameScale = scale;

    const cssW = Math.floor(sw * scale), cssH = Math.floor(sh * scale);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    // bitmap pixels per frame unit
    const k = canvas.width / sw;
    if (turned) ctx.setTransform(0, k, -k, 0, LH * k, 0);
    else ctx.setTransform(k, 0, 0, k, 0, 0);

    if (turned !== frameTurned) {
        frameTurned = turned;
        // anything held should let go: the finger is no longer where it was
        dispatchEvent(new Event('frameturn'));
    }
}

// A pointer's page position, in frame units. The only place that knows the
// view can be turned.
function screenToFrame(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const sw = frameTurned ? LH : LW, sh = frameTurned ? LW : LH;
    const u = (clientX - r.left) / r.width * sw;
    const v = (clientY - r.top) / r.height * sh;
    return frameTurned ? { x: v, y: LH - u } : { x: u, y: v };
}

addEventListener('resize', resizeFrame);
// window resize doesn't fire when only the toolbar moves
if (window.visualViewport) {
    visualViewport.addEventListener('resize', resizeFrame);
    visualViewport.addEventListener('scroll', resizeFrame);
}
// iOS fires this before the new size has settled, so ask twice
addEventListener('orientationchange', () => { resizeFrame(); setTimeout(resizeFrame, 150); });
resizeFrame();
