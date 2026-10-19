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
// Long things lie along the x axis.
// fixedRotation, if set, keeps the body from turning (the little guy turns
// himself, in js/guy.js).

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
};
