// Where it begins. Loaded last, so everything before it is ready.

function setTable(layout) {
    letGoOfEverything();
    buildWorld();
    resetGuys();
    for (const o of layout) addThing(o.kind, o.x, o.y, o.angle);
    addGuy(GUY_START.x, GUY_START.y);
    startTalk();
}

function drawThings(c) {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    inkFrame = c.getTransform();
    for (const t of things) {
        const falling = t.fall !== undefined;
        if (falling && t.fall >= FALL_TIME) continue;
        const pos = falling ? t.fallAt : t.body.getPosition();
        const at = mmToFrame(pos.x * 1000, pos.y * 1000);
        c.save();
        let shrink = 1;
        if (falling) {
            // Tipping over the table's edge, seen from above, is squashing
            // toward the edge line by cos(tilt). Gravity speeds the tilt up.
            const tilt = Math.min(1, (t.fall / TIP_TIME) ** 2) * TIP_MAX * Math.PI / 180;
            const k = Math.cos(tilt) - 1, n = t.edgeOut;
            const e = mmToFrame(t.edgeAt.x * 1000, t.edgeAt.y * 1000);
            c.translate(e.x, e.y);
            c.transform(1 + k * n.x * n.x, k * n.x * n.y, k * n.x * n.y, 1 + k * n.y * n.y, 0, 0);
            c.translate(-e.x, -e.y);
            // then, free of the table, falling away is shrinking
            const u = Math.max(0, (t.fall - TIP_TIME) / (FALL_TIME - TIP_TIME));
            shrink = 1 - u * u;
        }
        c.translate(at.x, at.y);
        c.rotate(t.body.getAngle());
        c.scale(shrink / MM_PER_UNIT, shrink / MM_PER_UNIT);
        t.kind.draw(c, t);
        c.restore();
    }
}

let lastTime = null;

function loop(time) {
    // a hidden tab stops the clock; don't replay the gap
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.25);
    lastTime = time;
    if (!debugPaused) stepWorld(dt, stepGuys);
    dropFallen();

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, LW, LH);
    drawTable(ctx);
    drawThings(ctx);
    drawTalk(ctx, dt);
    requestAnimationFrame(loop);
}

setTable(TEST_LAYOUT);
listenForDrags();
listenForTalk();
listenForDebug();
requestAnimationFrame(loop);
