# Code map

Every file the page loads, in load order. Keep this true when you add, rename or remove one.

| File | What it does |
|---|---|
| `index.html` | The page: hidden-page tags, layout, and the script list in load order |
| `js/lib/planck.min.js` | Planck.js 1.5.0, the physics engine, vendored as is (`js/world.js` replaces its friction joint's velocity solve, which has a bug). License in `js/lib/planck-LICENSE.txt` |
| `js/frame.js` | The field: `LW` x `LH` logical units, scaled to fit, turned on portrait screens; defines `canvas`, `ctx` and `screenToFrame()` |
| `js/look.js` | Ink, paper, `LINE_WIDTH`, and `inkLine`/`inkShape`, which every drawing strokes with so the pen stays even |
| `js/table.js` | The table's size, `MM_PER_UNIT`, mm-to-frame conversion, the test layout, the table's outline |
| `js/objects.js` | `KINDS`: each object's mass, collision pieces and drawing |
| `js/world.js` | The Planck world: cloth friction, levels (`setLevel`, `placeOn`; a thing resting on another tips down a level when it slides off), falling off the edge, the fixed step, `thingAt()`, `byLevel()` |
| `js/drag.js` | Pointer grab and spring drag, one joint per pointer; `isHeld()` |
| `js/guy.js` | The little guys (the first, then a backup for every object that goes over the edge): sharing jobs, grabbing and hauling, knockdowns, their slow end, their drawing |
| `js/talk.js` | The little guy's dialog box: portrait and typed words, drawn upright on the screen; the opening lines and the backup call |
| `js/glue.js` | The glue soldier: comes at each quarter of the table's weight gone over the edge; his grey circle, inside which only he can be grabbed |
| `js/debug.js` | Debug mode: the DEBUG button, a live list of every object and guy and their properties (`OBJECT_ROWS`, `GUY_ROWS`), and pause/play (`debugPaused`) |
| `js/start.js` | Sets the table, starts listening, runs the loop; loaded last |

Also in `js/lib/`: `planck-LICENSE.txt`, Planck's MIT license.

In `fonts/` (every font ships with the game): `fonts/patrick-hand-latin-400-normal.woff2`, the dialog's typeface (declared by `@font-face` in `index.html`), and `fonts/patrick-hand-OFL.txt`, its SIL Open Font License.

Not published:

| File or folder | What's in it |
|---|---|
| `_play-mac.command`, `_play-windows.bat` | Double-click to serve the game locally and open it |
| `_labs-mac.command`, `_labs-windows.bat` | The same, opened at the labs' index (`_labs/index.html`), which opens each lab in its own tab |
| `.gitattributes` | Keeps `.bat` files in Windows line endings |
| `_ref/` | Docs: this map, `TODO.md`, `DESIGN.md` (what the game is), `BUILD.md` (how it's built, and in what order) |
| `_labs/` | Dev tools. `tune.html`: the table with a slider for every feel constant. `objects.html`: every object kind with its collision shape. `spawn.html`: arrival animations to choose from. `color.html` ("art styles"): the game redrawn in other looks (MS Paint, Game Boy Camera), a mock-up. `check.sh`: checks the hidden-page tags, the `?v=N`s and this map |
| `_config.yml` | Tells Jekyll to leave `CLAUDE.md` and `README.md` off the site |
| `.claude/` | Claude Code setup: `launch.json` (local preview server), `agents/builder.md` (the Sonnet subagent for delegated work) |
