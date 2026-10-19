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
| `_ref/` | Docs: this map, `TODO.md` |
| `_labs/` | Dev tools: slider pages, test pages, build scripts |
