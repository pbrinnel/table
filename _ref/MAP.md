# Code map

Every file the page loads, in load order. Keep this true when you add, rename or remove one.

| File | What it does |
|---|---|
| `index.html` | The page: hidden-page tags, layout, and the script list in load order |
| `js/lib/planck.min.js` | Planck.js 1.5.0, the physics engine, vendored as is. License in `js/lib/planck-LICENSE.txt` |
| `js/frame.js` | The field: `LW` x `LH` logical units, scaled to fit, turned on portrait screens; defines `canvas`, `ctx` and `screenToFrame()` |
| `js/look.js` | Ink, paper, `LINE_WIDTH`, and `inkLine`/`inkShape`, which every drawing strokes with so the pen stays even |
| `js/table.js` | The table's size, `MM_PER_UNIT`, mm-to-frame conversion, the test layout, the table's outline |
| `js/objects.js` | `KINDS`: each object's mass, collision pieces and drawing |
| `js/world.js` | The Planck world: cloth friction, falling off the edge, the fixed step, `thingAt()` |
| `js/drag.js` | Pointer grab and spring drag, one joint per pointer; `isHeld()` |
| `js/guy.js` | The little guys (the first, then a backup for every object that goes over the edge): sharing jobs, grabbing and hauling, knockdowns, their slow end, their drawing |
| `js/talk.js` | The little guy's dialog box: portrait and typed words, drawn upright on the screen; the opening lines and the backup call |
| `js/start.js` | Sets the table, starts listening, runs the loop; loaded last |

Also in `js/lib/`: `planck-LICENSE.txt`, Planck's MIT license.

In `fonts/` (every font ships with the game): `fonts/patrick-hand-latin-400-normal.woff2`, the dialog's typeface (declared by `@font-face` in `index.html`), and `fonts/patrick-hand-OFL.txt`, its SIL Open Font License.

Not published:

| File or folder | What's in it |
|---|---|
| `_play-mac.command`, `_play-windows.bat` | Double-click to serve the game locally and open it |
| `.gitattributes` | Keeps `.bat` files in Windows line endings |
| `_ref/` | Docs: this map, `TODO.md`, `DESIGN.md` (what the game is), `BUILD.md` (how it's built, and in what order) |
| `_labs/` | Dev tools. `tune.html`: the table with a slider for every feel constant. `check.sh`: checks the hidden-page tags, the `?v=N`s and this map |
| `_config.yml` | Tells Jekyll to leave `CLAUDE.md` and `README.md` off the site |
| `.claude/` | Claude Code setup: `launch.json` (local preview server), `agents/builder.md` (the Sonnet subagent for delegated work) |
