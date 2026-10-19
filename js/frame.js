// The field: one fixed logical size, scaled to fit whatever screen it's on.
// Everything draws in LW x LH units, so a phone and a desktop run the same
// frame, just bigger or smaller.

const LW = 800, LH = 600;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

let frameScale = 1;
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

    // Fit both ways: a phone held sideways runs out of height first.
    const scale = Math.min(availW / LW, availH / LH, 1);

    // Assigning canvas.width throws the bitmap away even when nothing changed,
    // and iOS fires resize over and over while its toolbar slides.
    const fit = scale.toFixed(4) + ':' + dpr;
    if (fit === lastFit) return;
    lastFit = fit;
    frameScale = scale;

    canvas.style.width = Math.floor(LW * scale) + 'px';
    canvas.style.height = Math.floor(LH * scale) + 'px';
    canvas.width = LW * dpr;
    canvas.height = LH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
