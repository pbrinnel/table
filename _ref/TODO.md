# To do

The shared list, in place of GitHub Issues. Put your name on what you take.

- [x] Gameplay: first playable written up in `DESIGN.md` (Paul)
- [ ] Choose the objects, and how many place settings (Paul or dhfm91, see `DESIGN.md` → Open)
- [x] Build step 1: engine and frame (Claude, for Paul). A test layout of
      plates, side plates, knives and a tray stands in until the objects are chosen.
- [x] The little guy, falling off the edge, and his ending (Claude, for Paul)
- [ ] Tune the feel, the guy included, on `_labs/tune.html` (Paul or dhfm91)
- [x] Decide how to make the guy readable: bigger, or a thinner pen (Paul or dhfm91, see
      `DESIGN.md` → Open). A thinner pen for the first guy's hair (dhfm91; Claude, for
      dhfm91). Size, limbs and fingers still open.
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
- [x] Guys arrive for a reason: spawn animations to choose from, in a lab first (Claude,
      for Paul).
- [x] Levels: cups sit on their saucers at level 3, slide off and tip down a level, and
      only guys can climb up and put them back (Claude, for Paul)
- [x] Guys boxed in between things climb over them; the setting is spread out (Claude,
      for Paul). With five things flung about, one guy had everything back in 25 s.
- [x] The centerpiece is a real four-level stack the guys rebuild bottom-up (Claude, for
      Paul). Slid off together, the three upper pieces were back in 10 to 15 s.
- [x] Tall things (cups, glasses) tip as stacked parts with real heights, not flat discs
      (Claude, for Paul). Tipping in the game not yet checked by eye; try it in the
      objects lab's slider first.
- [x] Pick the arrival: 1a and 1c2 (Paul); built into the game (Claude, for Paul)
- [ ] Barging, the guys' last resort when boxed in, sometimes nudges cutlery and makes
      more work: in three chaos runs one guy left 0 to 7 pieces out of place after 25 s.
      Tune `GUY_STALL_TIME` and `GUY_BARGE_TIME`, or barge only into light things.
- [x] Why the guys put things back badly (Claude, for Paul). Measured: position ends within
      6 to 10 mm, but (1) nothing restores which way a thing is turned, since its starting
      angle isn't even recorded, so cups end up with handles pointing anywhere; (2) homes
      are often occupied while a thing waits, mostly by another out-of-place object, and
      with three guys sometimes by a guy; (3) it's slow, 13 to 29 s for five things with
      one guy, partly from nudging neighbors on the way.
- [x] All four fixes for the above (Paul's pick; Claude, for Paul). Same test: everything
      back every run, with one guy by 12 to 13 s, three by 6 to 8 s, set down at 0 mm and
      0°. Also fixed on the way: he'd crawl forever toward a grab spot with no room, so he
      now takes a roomy side, and a crawl counts as stuck. Now stricter about angles, a
      hard fling leaves more to do: one guy had 3 to 5 things still turned or off after
      25 s.
- [x] The napkin's crease as a line underneath, only seen once the corner is out of the way
      (Claude, for Paul)
- [x] Tall things lean toward where they're dragged, more the faster (Claude, for Paul)
- [x] Backups with no cover to crawl out from: they wait a moment for one, and if none
      comes free they don't come (Paul; Claude, for Paul)
- [x] Tall things tipping or leaning stop at, and lean on, their tall neighbors instead of
      passing through them (Claude, for Paul). Tested: a wine glass tipping 0.64 rad into
      the red wine glass stops at 0.33, and the red glass leans 0.14 away.
- [x] Now and then (about 1 in 10) a guy calls out the very thing the player grabbed: "Not
      the salad fork!" (Claude, for Paul)
- [x] Art-style mock-ups, as a lab (Claude, for Paul): `_labs/color.html`, "art styles",
      an MS Paint look and a Game Boy Camera look with ordered dithering. The game stays
      black on white (Paul).
- [x] A guy knocked off screams on the way down, in the dialog box; not when he steps off
      at the end (Claude, for Paul)
- [x] Tipping glasses draw over and under their neighbors by height (Claude, for Paul)
- [x] Tried a long 2:1 table with a setting at each end and shared pieces in the middle;
      taken back to one setting on the 3:2 table (Paul). The candelabra, shakers and bread
      basket stay in the catalog.
- [x] One guy at the start; backups come as things fall (Paul).
- [ ] Try two-finger drag on a real phone (anyone with one)
- [x] Keep `CLAUDE.md` and `README.md` off the site: `_config.yml` (Claude, for Paul). Once
      merged, check that paulbrinnel.com/table/CLAUDE.md is a 404.

- [x] The glue soldier: at 25%, 50% and 75% of the table's weight gone over, a big
      square guy comes who glues up to 4 things in their home spots for good (dhfm91;
      Claude, for dhfm91). On live.
- [x] Pastel-ish but flat colors in the game, from the art styles lab (dhfm91; Claude,
      for dhfm91)
- [x] Backups arrive 3x as fast (dhfm91; Claude, for dhfm91)
- [ ] `_labs/spawn.html` keeps its own copy of the guy's drawing: bring over the
      fine-strand hair, the glue soldier and the colors

- [x] A basic score, shown at the end: objects by weight, 5 a guy, 25 the first guy
      (dhfm91; Claude, for dhfm91)

- [ ] Score multiplier by how many guys are out on the table, so saving a big plate
      for the end is a strategy (Paul's idea)

- [ ] Glue becomes bubblegum (dhfm91): the mechanic is "gummed" (was "glued"), in names
      and text where it fits; in the dialog the guys are "Bubblegum Soldiers" (so "Calling
      BUBBLEGUM SOLDIER!" or similar). Bubblegum is always a pleasant pink. Plus a simple
      sprite that sits well on every object, so a gummed thing reads as trapped at a glance
- [ ] Gummed things can be grabbed again, but held on a strict leash (about 5 px of
      movement); let go, one snaps back to where it was gummed (dhfm91)

dhfm91's priorities, in order:
- [ ] More varied dialog: "Unhand me!" when a guy is grabbed, more "Calling for backup!"
      variants, and so on (dhfm91; Claude, for dhfm91). "Unhand me!" (first guy only)
      and four backup lines are in; more to come.
- [ ] Time limits, lax at first and stricter as it goes, so the game can be lost (dhfm91)
- [ ] Maybe a reset button for a player who's painted themselves into a corner, at a flat
      point cost that hurts a high score (dhfm91)
- [ ] Level variants in a loop: the player keeps clearing tables for as long as they like
      (dhfm91)
- [ ] Some story about the little guys who love neat tables, shown at game over or on a
      high score (dhfm91)
- [ ] High score board, on Paul's plan under **Later** in `CLAUDE.md` (a Cloudflare
      Worker on his account). If that doesn't happen, dhfm91's fallback is the way his other
      games do it: a JSON bin on extendsclass (dhfm91)
