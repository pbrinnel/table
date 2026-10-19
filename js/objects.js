// The catalog: every kind of object, from its real size and weight.
//
// Each kind has:
//   mass    in grams
//   bullet  true for thin, light things a flick could otherwise push
//           straight through another object
//   pieces  its collision shape, in mm from its center: circles and boxes.
//           Simpler than the drawing where the difference can't be seen.
//   draw(c) draws it in mm, centered on the origin and unrotated. The caller
//           has already moved, turned and scaled the context. Stroke with
//           inkLine or inkShape, never c.stroke, so the pen stays even.
// Long things lie along the x axis. Cutlery is drawn with its working end at
// +x (bowl, tines) except knives, whose tip is at -x with the edge on the +y
// side; js/table.js turns them to lie as a place setting does.
// fixedRotation, if set, keeps the body from turning (the little guy turns
// himself, in js/guy.js).
// tall, for things with height that can be seen when they tip (cups, glasses):
//   { parts: [[z0, r0, z1, r1], ...] } in mm, from the bottom up: each part a
//   round section from height z0 with radius r0 to height z1 with radius r1. A
//   cup is one part; a stemmed glass is a flat foot, a thin stem, and a bowl
//   widening to the rim. Tipping, each part's top slides out from its bottom
//   by its height, and js/start.js wraps an outline round each, so it reads as
//   the object leaning over; draw(c) then draws only what's at the rim (the
//   rim and what's inside it, a handle), at the top part's top.
// Heights are real ones: a wine glass stands about 200 mm.

// ---- drawing helpers for the place setting's kinds ----
// All in mm, along the x axis, centered on the origin.

function ellipseAt(c, x, y, rx, ry) {
    c.moveTo(x + rx, y);
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

// A handle's rounded end: from the top edge at x0 around to the bottom edge.
function roundEnd(c, x0, hw) {
    c.lineTo(x0 + hw, hw);
    c.quadraticCurveTo(x0, hw, x0, 0);
    c.quadraticCurveTo(x0, -hw, x0 + hw, -hw);
}

// A fork: one outline, tines at +x. p.tines is each tine's width from the -y
// side to the +y side, p.gap the slot between them, p.tineLen how far they
// stand out of the head, p.headLen the head's length including them.
function drawFork(c, p) {
    const x0 = -p.L / 2, x1 = p.L / 2, hw = p.handleW / 2, nw = p.neckW / 2;
    const xb = x1 - p.tineLen, xs = x1 - p.headLen;
    const hh = (p.tines.reduce((a, b) => a + b, 0) + p.gap * (p.tines.length - 1)) / 2;
    c.beginPath();
    c.moveTo(x0 + hw, -hw);
    c.lineTo(xs, -nw);
    c.lineTo(xb, -hh);
    let y = -hh;
    p.tines.forEach((tw, i) => {
        c.lineTo(x1, y);
        c.lineTo(x1, y + tw);
        c.lineTo(xb, y + tw);
        if (i < p.tines.length - 1) {
            y += tw + p.gap;
            c.lineTo(xb, y);
        }
    });
    c.lineTo(xs, nw);
    roundEnd(c, x0, hw);
    c.closePath();
    inkShape(c);
}

// A spoon: handle, then the bowl at +x with a line round its well.
function drawSpoon(c, p) {
    const x0 = -p.L / 2, hw = p.handleW / 2, nw = p.neckW / 2;
    const cx = p.L / 2 - p.bowlLen / 2;
    c.beginPath();
    c.moveTo(x0 + hw, -hw);
    c.lineTo(cx, -nw);
    c.lineTo(cx, nw);
    c.lineTo(x0 + hw, hw);
    c.quadraticCurveTo(x0, hw, x0, 0);
    c.quadraticCurveTo(x0, -hw, x0 + hw, -hw);
    c.closePath();
    inkShape(c);
    c.beginPath();
    ellipseAt(c, cx, 0, p.bowlLen / 2, p.bowlW / 2);
    inkShape(c);
    c.beginPath();
    ellipseAt(c, cx, 0, p.bowlLen / 2 * 0.7, p.bowlW / 2 * 0.7);
    inkLine(c);
}

// A knife: blade (tip at -x, edge on +y) from bladePath, then the handle.
function drawKnife(c, p) {
    const x0 = -p.L / 2, xb = x0 + p.bladeLen, hw = p.handleW / 2;
    c.beginPath();
    p.bladePath(c, x0, xb);
    c.closePath();
    inkShape(c);
    c.beginPath();
    c.roundRect(xb, -hw, p.L / 2 - xb, p.handleW, hw);
    inkShape(c);
}

function bladePointed(c, x0, xb) {
    c.moveTo(xb, -7);
    c.lineTo(x0 + 40, -7);
    c.quadraticCurveTo(x0 + 6, -6, x0, 3);
    c.quadraticCurveTo(x0 + 30, 9, x0 + 80, 8);
    c.lineTo(xb, 8);
}

// the fish knife's wide blade, its point on the spine side
function bladeFish(c, x0, xb) {
    c.moveTo(xb, -6);
    c.quadraticCurveTo(x0 + 70, -9, x0 + 30, -14);
    c.lineTo(x0, -12);
    c.quadraticCurveTo(x0 - 1, 6, x0 + 14, 12);
    c.quadraticCurveTo(x0 + 60, 16, xb, 9);
}

function bladeSquared(c, x0, xb) {
    c.moveTo(xb, -7);
    c.lineTo(x0 + 5, -7);
    c.quadraticCurveTo(x0, -7, x0, -2);
    c.lineTo(x0, 5);
    c.quadraticCurveTo(x0, 9, x0 + 5, 9);
    c.lineTo(xb, 9);
}

function bladeRounded(c, x0, xb) {
    c.moveTo(xb, -7.5);
    c.lineTo(x0 + 20, -7.5);
    c.quadraticCurveTo(x0, -7.5, x0, 0);
    c.quadraticCurveTo(x0, 7.5, x0 + 20, 7.5);
    c.lineTo(xb, 7.5);
}

// A stemmed glass from above: the foot (only where it shows past the rim),
// the rim, the line of the bowl inside it, and the stem as a dot.
function drawGlass(c, rim, inner, foot, dot) {
    if (foot > rim) {
        c.beginPath();
        ring(c, 0, 0, foot);
        inkShape(c);
    }
    c.beginPath();
    ring(c, 0, 0, rim);
    inkShape(c);
    c.beginPath();
    ring(c, 0, 0, inner);
    inkLine(c);
    c.beginPath();
    ring(c, 0, 0, dot);
    inkLine(c);
}

// A saucer: its rim and the well a cup sits in.
function drawSaucer(c, saucer, well) {
    c.beginPath();
    ring(c, 0, 0, saucer);
    inkShape(c);
    c.beginPath();
    ring(c, 0, 0, well);
    inkLine(c);
}

// A cup on its own (it rests on its saucer a level up): a handle loop at +x,
// the cup's rim and the line of the tea inside it.
function drawCup(c, cup, inner, handleFrom, handleTo, handleW) {
    c.beginPath();
    c.roundRect(handleFrom, -handleW / 2, handleTo - handleFrom, handleW, handleW / 2.5);
    inkShape(c);
    c.beginPath();
    c.roundRect(handleFrom + handleW / 2.5, -handleW / 5, handleTo - handleFrom - handleW * 0.8, handleW * 0.4, handleW / 5);
    inkLine(c);
    c.beginPath();
    ring(c, 0, 0, cup);
    inkShape(c);
    c.beginPath();
    ring(c, 0, 0, inner);
    inkLine(c);
}

// The napkin with one corner (local signs sx, sy) tipped up about a fold that
// lies `fold` mm back from it, across its diagonal, by `tilt`: 0 flat, PI laid
// back over itself, drawn squashed toward the fold by cos(tilt). Its top side
// shows the hem line, as the napkin does flat; once tipped past edge-on, its
// plain underside shows.
function drawNapkinFlap(c, f) {
    const corners = [[-100, -60], [100, -60], [100, 60], [-100, 60]];
    const K = [f.sx * 100, f.sy * 60], leg = f.fold * Math.SQRT2;
    const P1 = [K[0] - f.sx * leg, K[1]], P2 = [K[0], K[1] - f.sy * leg];   // where the fold meets the edges
    const hem = () => {
        c.beginPath();
        c.moveTo(-100, -42);
        c.lineTo(100, -42);
    };
    // the rest of the napkin, its corner cut across the fold
    const pts = [];
    corners.forEach(([x, y], i) => {
        // arriving along the horizontal edge meets the fold at P1 first
        if (x === K[0] && y === K[1]) pts.push(...(corners[(i + 3) % 4][1] === y ? [P1, P2] : [P2, P1]));
        else pts.push([x, y]);
    });
    c.beginPath();
    pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    inkShape(c);
    c.save();
    c.clip();
    hem();
    inkLine(c);
    c.restore();
    // the corner
    c.save();
    const mx = (P1[0] + P2[0]) / 2, my = (P1[1] + P2[1]) / 2;
    const k = Math.cos(f.tilt) - 1, nx = f.sx / Math.SQRT2, ny = f.sy / Math.SQRT2;
    c.translate(mx, my);
    c.transform(1 + k * nx * nx, k * nx * ny, k * nx * ny, 1 + k * ny * ny, 0, 0);
    c.translate(-mx, -my);
    c.beginPath();
    c.moveTo(P1[0], P1[1]);
    c.lineTo(K[0], K[1]);
    c.lineTo(P2[0], P2[1]);
    c.closePath();
    inkShape(c);
    if (Math.cos(f.tilt) > 0) {
        c.clip();
        hem();
        inkLine(c);
    }
    c.restore();
}

// The pieces of a fork, spoon or knife: the long handle and the working end.
function endPieces(L, handleW, endLen, endW) {
    return [
        { box: [L - endLen, handleW], x: -endLen / 2 },
        { box: [endLen, endW], x: L / 2 - endLen / 2 },
    ];
}


const KINDS = {
    dinnerPlate: {
        mass: 600,
        pieces: [{ circle: 135 }],
        draw(c) {
            c.beginPath();
            ring(c, 0, 0, 135);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 95);
            inkLine(c);
        },
    },

    sidePlate: {
        mass: 250,
        pieces: [{ circle: 85 }],
        draw(c) {
            c.beginPath();
            ring(c, 0, 0, 85);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 58);
            inkLine(c);
        },
    },

    knife: {
        mass: 80,
        bullet: true,
        pieces: [{ box: [240, 18] }],
        draw(c) {
            // blade from the tip at -120 to the bolster at 20, edge on the +y side
            c.beginPath();
            c.moveTo(20, -7);
            c.lineTo(-104, -7);
            c.quadraticCurveTo(-120, -7, -120, 0);
            c.quadraticCurveTo(-118, 8, -96, 8);
            c.lineTo(20, 8);
            c.closePath();
            inkShape(c);
            // handle
            c.beginPath();
            c.roundRect(20, -9, 100, 18, 9);
            inkShape(c);
        },
    },

    tray: {
        mass: 900,
        pieces: [{ box: [450, 320] }],
        draw(c) {
            c.beginPath();
            c.roundRect(-225, -160, 450, 320, 20);
            inkShape(c);
            c.beginPath();
            c.roundRect(-207, -142, 414, 284, 10);
            inkLine(c);
        },
    },

    // ---- a traditional formal place setting, one kind per piece ----

    // The centerpiece is a stack (DESIGN.md, "levels"): the charger on the
    // cloth, the dinner plate (above) on it, the salad plate on that, and the
    // consommé cup on top.
    charger: {
        mass: 800,
        pieces: [{ circle: 165 }],
        draw(c) {
            c.beginPath();
            ring(c, 0, 0, 165);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 150);
            inkLine(c);
        },
    },

    saladPlate: {
        mass: 300,
        pieces: [{ circle: 100 }],
        draw(c) {
            c.beginPath();
            ring(c, 0, 0, 100);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 72);
            inkLine(c);
        },
    },

    // two-handled, for soup
    consommeCup: {
        mass: 250,
        pieces: [{ circle: 48 }],
        tall: { parts: [[0, 32, 45, 48]] },
        draw(c) {
            for (const s of [-1, 1]) {
                c.beginPath();
                c.roundRect(s > 0 ? 38 : -70, -11, 32, 22, 9);
                inkShape(c);
            }
            c.beginPath();
            ring(c, 0, 0, 48);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 38);
            inkLine(c);
        },
    },

    breadPlate: {
        mass: 150,
        pieces: [{ circle: 75 }],
        draw(c) {
            c.beginPath();
            ring(c, 0, 0, 75);
            inkShape(c);
            c.beginPath();
            ring(c, 0, 0, 52);
            inkLine(c);
        },
    },

    napkin: {
        mass: 30,
        pieces: [{ box: [200, 120] }],
        // t.flap, while a guy comes out from under it, has one corner tipped up
        draw(c, t) {
            if (t && t.flap) {
                drawNapkinFlap(c, t.flap);
                return;
            }
            c.beginPath();
            c.roundRect(-100, -60, 200, 120, 3);
            inkShape(c);
            c.beginPath();
            c.moveTo(-100, -42);
            c.lineTo(100, -42);
            inkLine(c);
        },
    },

    saladFork: {
        mass: 45,
        bullet: true,
        pieces: endPieces(170, 16, 45, 30),
        draw(c) {
            drawFork(c, { L: 170, handleW: 16, neckW: 8, headLen: 45, tineLen: 28, tines: [9, 6.5, 6.5, 6.5], gap: 0.5 });
        },
    },

    fishFork: {
        mass: 50,
        bullet: true,
        pieces: endPieces(185, 16, 38, 28),
        draw(c) {
            drawFork(c, { L: 185, handleW: 16, neckW: 8, headLen: 38, tineLen: 20, tines: [6.5, 6.5, 6.5, 6.5], gap: 0.5 });
        },
    },

    meatFork: {
        mass: 55,
        bullet: true,
        pieces: endPieces(205, 17, 55, 30),
        draw(c) {
            drawFork(c, { L: 205, handleW: 17, neckW: 9, headLen: 55, tineLen: 36, tines: [7, 7, 7, 7], gap: 0.5 });
        },
    },

    cakeFork: {
        mass: 35,
        bullet: true,
        pieces: endPieces(150, 14, 42, 26),
        draw(c) {
            drawFork(c, { L: 150, handleW: 14, neckW: 7, headLen: 42, tineLen: 26, tines: [6, 6, 12], gap: 0.5 });
        },
    },

    seafoodFork: {
        mass: 25,
        bullet: true,
        pieces: endPieces(125, 12, 35, 16),
        draw(c) {
            drawFork(c, { L: 125, handleW: 12, neckW: 6, headLen: 35, tineLen: 24, tines: [5, 5, 5], gap: 0.5 });
        },
    },

    meatKnife: {
        mass: 85,
        bullet: true,
        pieces: [{ box: [235, 17] }],
        draw(c) {
            drawKnife(c, { L: 235, bladeLen: 135, handleW: 17, bladePath: bladePointed });
        },
    },

    fishKnife: {
        mass: 70,
        bullet: true,
        pieces: [{ box: [210, 28] }],
        draw(c) {
            drawKnife(c, { L: 210, bladeLen: 115, handleW: 17, bladePath: bladeFish });
        },
    },

    saladKnife: {
        mass: 65,
        bullet: true,
        pieces: [{ box: [190, 18] }],
        draw(c) {
            drawKnife(c, { L: 190, bladeLen: 100, handleW: 17, bladePath: bladeSquared });
        },
    },

    butterKnife: {
        mass: 45,
        bullet: true,
        pieces: [{ box: [170, 15] }],
        draw(c) {
            drawKnife(c, { L: 170, bladeLen: 75, handleW: 15, bladePath: bladeRounded });
        },
    },

    teaspoon: {
        mass: 30,
        bullet: true,
        pieces: endPieces(150, 13, 48, 28),
        draw(c) {
            drawSpoon(c, { L: 150, handleW: 13, neckW: 6, bowlLen: 48, bowlW: 28 });
        },
    },

    demitasseSpoon: {
        mass: 22,
        bullet: true,
        pieces: endPieces(110, 10, 36, 22),
        draw(c) {
            drawSpoon(c, { L: 110, handleW: 10, neckW: 5, bowlLen: 36, bowlW: 22 });
        },
    },

    soupSpoon: {
        mass: 55,
        bullet: true,
        pieces: endPieces(180, 15, 58, 56),
        draw(c) {
            drawSpoon(c, { L: 180, handleW: 15, neckW: 7, bowlLen: 58, bowlW: 56 });
        },
    },

    dessertSpoon: {
        mass: 45,
        bullet: true,
        pieces: endPieces(175, 15, 62, 38),
        draw(c) {
            drawSpoon(c, { L: 175, handleW: 15, neckW: 7, bowlLen: 62, bowlW: 38 });
        },
    },

    waterGoblet: {
        mass: 200,
        pieces: [{ circle: 45 }],
        tall: { parts: [[0, 38, 3, 38], [3, 6, 70, 6], [70, 28, 170, 45]] },
        draw(c) { drawGlass(c, 45, 38, 0, 7); },
    },

    champagneFlute: {
        mass: 120,
        pieces: [{ circle: 34 }],
        // its foot is wider than its rim; the foot's outline shows it
        tall: { parts: [[0, 34, 3, 34], [3, 4, 110, 4], [110, 15, 220, 28]] },
        draw(c) { drawGlass(c, 28, 21, 0, 5); },
    },

    whiteWineGlass: {
        mass: 140,
        pieces: [{ circle: 38 }],
        tall: { parts: [[0, 36, 3, 36], [3, 4, 90, 4], [90, 22, 200, 38]] },
        draw(c) { drawGlass(c, 38, 31, 0, 6); },
    },

    redWineGlass: {
        mass: 160,
        pieces: [{ circle: 48 }],
        tall: { parts: [[0, 40, 3, 40], [3, 4, 85, 4], [85, 26, 210, 48]] },
        draw(c) { drawGlass(c, 48, 41, 0, 7); },
    },

    cordialGlass: {
        mass: 60,
        pieces: [{ circle: 25 }],
        tall: { parts: [[0, 25, 3, 25], [3, 3, 50, 3], [50, 12, 110, 25]] },
        draw(c) { drawGlass(c, 25, 19, 0, 5); },
    },

    // The cups sit on their saucers, a level up (DESIGN.md, "levels"). A cup's
    // collision circle is its rim; the handle sticks out past it.
    coffeeSaucer: {
        mass: 150,
        pieces: [{ circle: 75 }],
        draw(c) { drawSaucer(c, 75, 56); },
    },

    coffeeCup: {
        mass: 200,
        pieces: [{ circle: 40 }],
        tall: { parts: [[0, 28, 70, 40]] },
        draw(c) { drawCup(c, 40, 30, 34, 66, 26); },
    },

    demitasseSaucer: {
        mass: 100,
        pieces: [{ circle: 60 }],
        draw(c) { drawSaucer(c, 60, 45); },
    },

    demitasseCup: {
        mass: 120,
        pieces: [{ circle: 30 }],
        tall: { parts: [[0, 21, 55, 30]] },
        draw(c) { drawCup(c, 30, 22, 26, 53, 20); },
    },
};
