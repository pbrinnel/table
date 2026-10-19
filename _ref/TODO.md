# To do

The shared list, in place of GitHub Issues. Put your name on what you take.

- [x] Gameplay: first playable written up in `DESIGN.md` (Paul)
- [ ] Choose the objects, and how many place settings (Paul or dhfm91, see `DESIGN.md` → Open)
- [x] Build step 1: engine and frame (Claude, for Paul). A test layout of
      plates, side plates, knives and a tray stands in until the objects are chosen.
- [x] The little guy, falling off the edge, and his ending (Claude, for Paul)
- [ ] Tune the feel, the guy included, on `_labs/tune.html` (Paul or dhfm91)
- [ ] Decide how to make the guy readable: bigger, or a thinner pen (Paul or dhfm91, see
      `DESIGN.md` → Open)
- [x] The guy talks: dialog box, his portrait, the opening lines (Claude, for dhfm91)
- [x] Backup: every object that drops brings one more guy, "Calling for backup!"; "All is
      lost..." at the end; the guy's portrait redrawn (Claude, for dhfm91)
- [x] The guys' pathing: idle guys wander and spread out; everyone steers around objects
      and barely moves what they brush past (Claude, for dhfm91)
- [x] Careful hauling, so guys don't launch things off the table; the cloth friction bug
      that let nudged things creep off; the first guy's head filled black (Claude, for
      dhfm91)
- [x] The first guy's pompadour shaped as a quiff from above; the dialog box slightly
      see-through (Claude, for dhfm91)
- [x] Build step 2: the objects and layout from Paul's formal place-setting reference: every
      fork, knife, spoon, glass and cup in it (Claude, for Paul)
- [x] Debug mode: select by pressing on the table or clicking the panel; hover in the
      panel picks a thing out (Claude, for Paul)
- [x] Click the guy's message to make it vanish; a held guy flails; you beat one or two
      guys in a tug of war, three beat you (Claude, for Paul)
- [x] Debug mode: a DEBUG button in the corner opens a live list of every object and guy
      with their properties, and pause/play (Claude, for Paul)
- [ ] Guys arrive for a reason: spawn animations to choose from, in a lab first (Claude,
      for Paul). Files: new `_labs/spawn.html`; `js/guy.js` once one is chosen.
      Where it stands: Paul likes crawling out from under a bowl (1a) and the napkin (1c),
      and the fake-3D tilt; variants of those are in the lab's Keep section, the rest under
      UNUSED. Next: pick, then build it into `js/guy.js` in place of climbing up flat.
- [x] Levels: cups sit on their saucers at level 3, slide off and tip down a level, and
      only guys can climb up and put them back (Claude, for Paul)
- [ ] A fallen cup in a crowded spot (by the glasses and the demitasse cup) is one a guy
      often can't get to: he tries, gives up, tries again. Tested 8 drop spots: 5 put back
      in 2.5 to 3 s, 3 not. (Claude, for Paul.) Files: `js/guy.js`.
- [x] Tall things (cups, glasses) tip as stacked parts with real heights, not flat discs
      (Claude, for Paul). Tipping in the game not yet checked by eye; try it in the
      objects lab's slider first.
- [ ] Pick the arrival: `_labs/spawn.html` Keep section has 1a, 1a2, 1a3, 1c, 1c2 (Paul)
- [ ] Try two-finger drag on a real phone (anyone with one)
- [x] Keep `CLAUDE.md` and `README.md` off the site: `_config.yml` (Claude, for Paul). Once
      merged, check that paulbrinnel.com/table/CLAUDE.md is a 404.
