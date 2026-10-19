// Where it begins. Loaded last, so everything before it is ready.

function loop() {
    // an empty field until there's a game to draw on it
    ctx.fillStyle = '#090908';
    ctx.fillRect(0, 0, LW, LH);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
