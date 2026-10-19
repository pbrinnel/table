# Code map

Every file the page loads, in load order. Keep this true when you add, rename or remove one.

| File | What it does |
|---|---|
| `index.html` | The page: hidden-page tags, layout, and the script list in load order |
| `js/frame.js` | The field: `LW` x `LH` logical units, scaled to fit the screen; defines `canvas` and `ctx` |
| `js/start.js` | Where it begins; loaded last |

Not published:

| Folder | What's in it |
|---|---|
| `_ref/` | Docs: this map, `TODO.md`, `DESIGN.md` (what the game is), `BUILD.md` (how it's built, and in what order) |
| `_labs/` | Dev tools: slider pages, test pages, build scripts. `check.sh` checks the hidden-page tags, the `?v=N`s and this map |
| `.claude/` | Claude Code setup: `launch.json` (local preview server), `agents/builder.md` (the Sonnet subagent for delegated work) |
