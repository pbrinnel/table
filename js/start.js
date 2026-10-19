// Where it begins. Loaded last, so everything before it is ready.

function setTable(layout) {
    letGoOfEverything();
    buildWorld();
    for (const o of layout) addThing(o.kind, o.x, o.y, o.angle);
}

function drawThings(c) {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    for (const t of things) {
        const pos = t.body.getPosition();
        const at = mmToFrame(pos.x * 1000, pos.y * 1000);
        c.save();
        c.translate(at.x, at.y);
        c.rotate(t.body.getAngle());
        c.scale(1 / MM_PER_UNIT, 1 / MM_PER_UNIT);
        c.lineWidth = LINE_WIDTH * MM_PER_UNIT;
        t.kind.draw(c);
        c.restore();
    }
}

let lastTime = null;

function loop(time) {
    // a hidden tab stops the clock; don't replay the gap
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.25);
    lastTime = time;
    stepWorld(dt);

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, LW, LH);
    drawTable(ctx);
    drawThings(ctx);
    requestAnimationFrame(loop);
}

setTable(TEST_LAYOUT);
listenForDrags();
requestAnimationFrame(loop);
