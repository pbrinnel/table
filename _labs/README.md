# Labs

Dev tools that never reach the site: slider pages for tuning, test pages, build scripts.

- `check.sh`: run `bash _labs/check.sh` at the start and end of every piece of work. It
  checks the hidden-page tags, that every `?v=N` matches, and that `_ref/MAP.md` lists the
  real files.
- `tune.html`: the real table with a slider for every feel constant; values apply live.
  "Copy values" gives `const` lines to paste into the code. Slider settings are remembered
  in your browser; "Defaults" goes back to the code's. Serve the repo and open
  `/_labs/tune.html`. To tune a new constant, add it to `TUNABLES` at the top of the page.
  `GUY_MASS` takes effect on "Reset table". "Reset table" also replays the guy's opening lines, so the
  `TALK_` sliders can be tried again.

- `index.html`: links to every lab, each opening in its own tab. `_labs-mac.command` or
  `_labs-windows.bat` at the repo root starts the server and opens it.
- `objects.html`: every object kind drawn large with its collision shape over it.
- `color.html`: the real game recolored at runtime in an MS Paint look, with palettes,
  pixel size, thicker outlines and hard edges to try, and a Game Boy Camera mode (four
  shades, grey or DMG green, ordered dithering, a light gradient on the cloth). A mock-up
  only: the game itself stays black on white.
- `spawn.html`: candidate animations for how a new guy arrives (Keep at the top, the
  rest under a collapsed UNUSED), each looping in its own
  panel with replay, speed and a scrub slider. Its guy drawing is a copy of
  `js/guy.js`'s, so keep the two in step.

A lab that loads the game's files should reach them with `../js/...` and must never post to
a live server: stub `window.fetch` once there is one.
