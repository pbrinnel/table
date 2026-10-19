// Where it begins. Loaded last, so everything before it is ready.

function setTable(layout) {
    letGoOfEverything();
    buildWorld();
    resetGuys();
    const placed = {};
    for (const o of layout) {
        const t = addThing(o.kind, o.x, o.y, o.angle);
        if (o.on) {
            placeOn(t, placed[o.on]);
            t.homeOn = placed[o.on];
        }
        placed[o.kind] = t;
    }
    addGuy(GUY_START.x, GUY_START.y);
    startTalk();
}

// Tipping over a line, seen from above, is squashing toward it by cos(tilt):
// the line through `at` (meters) facing out along unit n.
function squashToward(c, at, n, tilt) {
    const k = Math.cos(tilt) - 1;
    const e = mmToFrame(at.x * 1000, at.y * 1000);
    c.translate(e.x, e.y);
    c.transform(1 + k * n.x * n.x, k * n.x * n.y, k * n.x * n.y, 1 + k * n.y * n.y, 0, 0);
    c.translate(-e.x, -e.y);
}

function drawThings(c) {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    inkFrame = c.getTransform();
    for (const t of byLevel()) {
        const falling = t.fall !== undefined, dropping = t.drop !== undefined;
        if (falling && t.fall >= FALL_TIME) continue;
        let pos = falling ? t.fallAt : t.body.getPosition();
        c.save();
        let shrink = t.drawScale || 1;
        if (falling) {
            // tipping over the table's edge, gravity speeding the tilt up
            squashToward(c, t.edgeAt, t.edgeOut, Math.min(1, (t.fall / TIP_TIME) ** 2) * TIP_MAX * Math.PI / 180);
            // then, free of the table, falling away is shrinking
            const u = Math.max(0, (t.fall - TIP_TIME) / (FALL_TIME - TIP_TIME));
            shrink = 1 - u * u;
        } else if (dropping) {
            // tipping down a level: over its support's rim and flat again as
            // it lands, sliding clear of it on the way
            const u = Math.min(1, t.drop / DROP_TIME);
            pos = Vec2.add(t.dropFrom, Vec2.mul(Vec2.sub(t.dropTo, t.dropFrom), u * u * (3 - 2 * u)));
            squashToward(c, t.dropRim, t.dropOut, Math.sin(Math.PI * u) * DROP_TILT * Math.PI / 180);
        }
        const at = mmToFrame(pos.x * 1000, pos.y * 1000);
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
    drawDebug(ctx);
    drawTalk(ctx, dt);
    requestAnimationFrame(loop);
}

setTable(TEST_LAYOUT);
listenForDrags();
listenForTalk();
listenForDebug();
requestAnimationFrame(loop);
