# Design

What the game is and how it should feel. How it's built is in `BUILD.md`.

Status: the first playable is built and live. Anything under **Open** is undecided; Claude
doesn't fill those in on its own. *Prototype choice* marks a call Claude made that nobody
has confirmed; (Paul) or (dhfm91) marks who made a call. Either of them can change any of it.
When one of them changes the other's call, the original stays as written and the change
goes right under it, marked **Update (name):**, so both can see what it was and what it
is now.

## The idea

A table seen from straight above, set with plates, cutlery, glasses, trays, a candelabra.
Every object is its own thing. You grab any of them and drag it, and it shoves whatever it
runs into. Heavy things are hard to push; light things scatter.

There's no score or goal. What there is: a little guy who keeps putting everything back,
so moving things becomes a fight with him, and pushing everything off the table is an
ending of sorts (see **The little guy**).

## The look

- Black line drawings on white. Simple, simple, simple.
- Straight overhead, flat 2D. No perspective, no shadows, no shading.
  - **Update (dhfm91):** the guy's portrait in the dialog box is the one exception: it's
    shaded in solid black shapes (see **The guy talks**). The table itself stays unshaded.
- One stroke width for every line (`LINE_WIDTH`). The table's edge is the only frame.
  - **Update (dhfm91):** the first guy's hair is the one exception: its strands use a finer
    pen (`HAIR_PEN`), since at his size the full pen can only draw a stripe or two across
    his head.
- Each object is filled white inside its outline, so it covers the cloth's lines (if any)
  and never shows lines through itself.
- The whole screen is the table, with a small margin around its edge.
- Objects are drawn from their real proportions, so a fork sits next to a plate at the
  right size.
- Nothing flashes. Motion comes only from the player and the little guy.

## The screen

- One landscape table. The world is fixed; only the view changes.
  - **Update (Paul):** a long table, 2.4 x 1.25 m, in a 2:1 frame: about the shape of a
    phone held either way, so it fills a phone screen better (everything a little bigger
    there, a little smaller on a desktop).
    - **Update (Paul):** tried and taken back: the table is the 3:2 one again.
- On a portrait screen (a phone held upright) the view turns 90° so the table still fills
  the screen. The table and everything on it stay where they were; touches map through the
  same turn.
- No menus, no text, no buttons in the first playable.
  - **Update (Paul):** one exception, for building it: a small DEBUG button in the top
    right corner. It opens a panel listing every object and every guy with their
    properties, live, and a pause/play button that stops everyone moving. In debug mode a
    press on the table selects what's under it, and the panel's entries can be clicked to
    select or hovered to pick a thing out; the selection is ringed in red on the table. Objects and
    guys will get more properties as they're differentiated; the panel grows with them.
  - **Update (dhfm91):** still no menus or buttons, but the little guy talks in a dialog
    box (see **The guy talks**). That's the only text.

## Moving things

- **Grab:** press on an object (mouse or finger) to take hold of it at that point.
  Thin things like knives are hard to hit with a finger, so the grab reaches a little past
  an outline (`GRAB_SLOP`).
- **Drag:** the object is pulled toward your finger by a spring, not glued to it. A light
  fork keeps up; a heavy tray or the candelabra lags and resists. The spring's pull has a
  ceiling (`DRAG_MAX_FORCE`), and that ceiling is what makes weight show.
- **Turning:** grabbing off-center turns the object as you drag, the way dragging a knife by
  its tip swings it around. That is the only way to turn things on purpose for now.
- **Leaning (Paul):** a tall thing being dragged (a cup, a glass) leans toward where it's
  going, more the faster it's dragged (`DRAG_LEAN`, up to `DRAG_LEAN_MAX`), easing in and
  out (`DRAG_LEAN_EASE`), and stands up again once let go.
  - **Update (Paul):** cups still read as flat when moved any other way, so every tall
    thing leans while it moves, however it's moved: dragged, hauled by a guy, riding a
    saucer that's dragged, or sliding after a flick.
  - **Update (Paul):** tipping or leaning, a tall thing doesn't pass through its tall
    neighbors. It's checked height by height against them and tips only until it touches
    one, coming to rest leaning against it (`TILT_GAP_MM`); that neighbor takes a share
    of the push as a lean of its own (`TILT_PASS`, up to `TILT_PASS_MAX`). Flat things
    are below a glass's rim, so it leans out over them freely. Drawing only: the physics
    still knows footprints.
  - **Update (Paul):** drawn in order of height, not one object at a time: what's higher
    covers what's lower. Each level is a step up (`LEVEL_RISE_MM`), a tall thing's parts
    each sit at their own height, lower when tipped, a guy is about a cup's height, and a
    guy under something is under everything. So a glass tipping over its neighbor passes
    over its foot and under its rim.
- **Release:** let go and the object keeps its speed, then slides to a stop. A quick flick
  sends it across the table.
- **Two fingers:** on a phone, each finger can hold its own object at the same time.

## Physics

- A tablecloth from above: things slide when pushed, and friction with the cloth stops
  them. Nothing falls except off the edge.
- Each object has a weight from its real-world mass. Weight decides how hard it is to drag,
  how far it gets knocked, and how much it pushes back.
- Objects turn when hit off-center. A fork clipped at one end spins.
- Objects never overlap or stack. Nothing rides on anything else: a tray is just a tray.
  - **Update (Paul): levels.** The table is level 0 and the cloth level 1; objects and
    guys normally stand at level 2, on the cloth, and a thing resting on another object is
    at level 3. For now only the cups stack: the coffee cup and the demitasse cup are
    separate from their saucers and sit on them at level 3. Levels 0 and 1 are named for
    later; nothing sits there yet.
    - Things only collide with things on their own level, so a plate slides into a saucer
      but under its cup.
    - A cup rides along with its saucer, held by friction (`RIDE_FRICTION`), so a hard jerk
      or a knock makes it slide off. When its center leaves the saucer it **tips down a
      level**: it tilts over the saucer's rim (`DROP_TILT`, over `DROP_TIME`), lands on
      the cloth just clear of the saucer, and is at level 2 from then on.
    - If a saucer goes over the table's edge, its cup goes with it.
    - **Only the guys can put a cup back up.** The player can drag a fallen cup, but at
      level 2 it just bumps the saucer. A guy hauls it to its saucer, climbs onto the
      saucer (`GUY_CLIMB_UP_TIME`), lifts the cup up onto it (`GUY_LIFT_TIME`) and climbs
      down (`GUY_CLIMB_DOWN_TIME`). Seen from above, being a level higher shows as being
      a little bigger (`GUY_UP_SCALE`). Grabbing him partway stops it.
    - **Update (Paul): height.** Tall things (cups, glasses) don't tip like flat discs.
      Each is a stack of round parts with real heights: a cup is one, a stemmed glass a
      flat foot, a thin stem and a bowl widening to the rim. Tipping, each part leans out
      by its height and gets its own outline, so a flute going over reads as foot, stem
      and bowl. Upright they look as before. `_labs/objects.html` has a slider to tip them.
    - **Update (Paul): the centerpiece is a real stack.** The charger is on the cloth,
      the dinner plate on it at level 3, the salad plate at 4 and the consommé cup at
      5, each its own object. *Prototype choices:* whatever slides off a layer falls all
      the way to the cloth, with everything on top of it, landing on the first clear
      spot outside the whole stack, pieces falling together spread apart with room for
      a guy between them (`DROP_ROOM_MM`). The guys rebuild from the bottom up: a piece
      goes back only once the one under it is back in place, and a guy climbs as many
      levels as he needs to (the climb takes `GUY_CLIMB_UP_TIME` per level).
    - A cup on its saucer counts as put back wherever the saucer is; the guys put the
      saucer back like any other object, cup and all.
- Every object collides with every other object.
- **The edge (Paul):** there's no rim. When an object's center crosses the table's edge it
  tips over the edge and falls: seen from above, it squashes toward the edge line as it
  tilts (up to `TIP_MAX`, over `TIP_TIME`), then shrinks away (`FALL_TIME`), sliding outward
  a little as it goes. Anything held drops out of the hand. Fallen things are gone.

Every number in this section is a named constant with a slider in `_labs/`. The values in
the code are placeholders until they've been tuned by hand.

## The little guy

Paul's idea: a little guy runs around the table, desperately trying to put everything back
where it was, and you can knock him around.

- **What "where it was" means:** each object's starting position. *Prototype choice:* he
  restores position only, not which way an object is turned.
  - **Update (Paul):** the way it's turned too, wherever that shows (not for a plate or a
    glass; yes for cutlery, the napkin and anything with a handle), within
    `GUY_TIDY_ANGLE`. Within `GUY_SETDOWN_MM` of home he stops hauling, lifts it, turns it
    and sets it exactly in place (`GUY_SETDOWN_TIME`), stepping clear of its spot as he
    does. A cup turned the wrong way on its own saucer is turned from up on the saucer.
    Whatever is out of place on a thing's home is moved first, and two things on each
    other's homes have one parked aside out of everyone's way. Idle guys keep off home
    spots, and are sent off one that's wanted.
- **How he moves things:** fast and aggressive (Paul). He runs to an object, grabs its near
  edge and hauls it home, shoving aside whatever's in the way. His grip is a capped spring
  like the player's (`GUY_GRIP_FORCE`), so heavy things still drag on him.
  - **Update (Paul):** in a tug of war the player beats one or two guys and three beat the
    player; pulling guys off the edge with an object stays possible. Each guy's grip is
    `GUY_GRIP_SHARE` of the player's `DRAG_MAX_FORCE`, and the guys' pulls add up.
  - **Update (dhfm91):** he's tiny and doesn't want anything to move, so on foot (going to
    a job, or wandering) he steers around objects and other guys rather than through them,
    slowing as he squeezes past. Brushing past something, his push drops to
    `GUY_SQUEEZE_FORCE`, too weak to shift a plate. Hauling, he still drags things
    home through whatever's in the way, but carefully: when what he's dragging is about
    to bump something, or is touching it, he slows to `GUY_HAUL_CARE` of his carrying
    speed and keeps his pull close behind it (`GUY_HAUL_LEAD_MM`), so it nudges things
    aside rather than launching them off the table.
  - **Update (Paul):** guys kept getting boxed in between things. Stuck on foot for
    `GUY_STALL_TIME`, a guy climbs over what's in his way, up and across the top
    (`GUY_CLIMB_OVER_SPEED`) to the first clear spot past it, without moving it. Only
    with nowhere clear to get to does he barge (`GUY_BARGE_TIME`), shoving with his full
    force, which can move cutlery. The setting is also spread out (`SETTING_SPREAD`) to
    leave the guys room to walk between pieces.
- **What he works on:** the moment the player grabs something, he goes straight for it, and
  it turns into a tug of war (Paul). Otherwise whatever is furthest from home. If he makes
  no progress for `GUY_PATIENCE`, he gives up on it for `GUY_SULK_TIME` and tries another.
- **When everything is back:** he stands still where he started.
  - **Update (dhfm91):** a guy with nothing to do wanders the table at a fraction of his
    walking speed (`GUY_WANDER_PACE`), picking spots away from the other idle guys and
    pushing gently off any that come close (`GUY_SPREAD_MM`, `GUY_SPREAD`), so idle guys
    spread out evenly, a zone defense.
- **Knocking him around:** a jolt to his speed bigger than `GUY_KNOCK_SPEED` knocks him
  flat and he lets go; he slides like any other object, lies there for `GUY_STUN_TIME`,
  then gets up and goes back to work.
- **Grabbing him:** he can be dragged like an object. Held, he's limp and lets go of what
  he had; let go, he lies stunned, then gets up. *Prototype choice.*
  - **Update (Paul):** held, he flails instead of hanging limp: arms and legs thrash
    (`GUY_FLAIL_HZ`, `GUY_FLAIL_SWING`). He still lets go, and lies stunned once dropped.
- **Knocked off the table:** he falls like anything else, then climbs back on where he went
  over after `GUY_CLIMB_TIME`. *Prototype choice.*
- **The end (Paul):** when the last object has gone over the edge, he follows it, slowly
  and sadly. He freezes (`GUY_DESPAIR_TIME`), turns slowly to look at the empty spots
  where things were, trudges to the nearest edge with his head hung and arms limp
  (`GUY_SAD_SPEED`), stands at the brink and looks back once (`GUY_BRINK_TIME`), and steps
  off. **Nothing resets:** the table stays empty until the page is reloaded (Paul).
  - **Update (dhfm91):** once there are backups, every guy does this together, and first
    the box says "All is lost..." (see **The guy talks**).
- **His look:** from Paul's references (a cartoon fusspot, a bigfoot, a scrawled
  gremlin): gangly, a big head with ears, a small body, stick limbs, splayed three-digit
  hands and feet. Same black line on white, seen from straight above. About 50 mm across,
  small next to a plate. Arms swing as he runs and reach forward when he's holding
  something; limbs flung out when he's knocked flat.
  - **Update (dhfm91):** the first guy wears his pompadour, seen from above: a solid
    black mass over his head that swells forward past his brow into a quiff of three
    locks, swept a little to one side, with two white streaks of shine combed back
    (see his portrait under **The guy talks**). Backups keep white heads, so he's the
    one you can pick out.
  - **Update (dhfm91):** the two streaks of shine are now `HAIR_STRANDS` fine strands in
    `HAIR_PEN`, combed back from the quiff toward his crown, so it reads as hair at his
    size. The rest of him keeps the one pen.

Every number about him is a slider on the tune page.

## The guy talks

How the game teaches the player, and later how it marks him getting worse as the table
gets messier (dhfm91).

- **The box:** an RPG-style dialog box at the bottom of the screen: his portrait in a
  square on the left, his line typed out beside it. Same two colors and same pen as
  everything else, square corners. It always reads upright, even when the table is turned
  on a phone. It doesn't block touches.
  - **Update (Paul):** it blocks the bottom of the table, so a press on the box makes it
    vanish at once, rather than reaching through to what's underneath. Pressing anywhere
    else works as before.
  - **Update (dhfm91):** the box's paper is slightly see-through (`TALK_BOX_ALPHA`), so the
    bottom of the table shows faintly through it, in light grey, the one grey in the
    game. The portrait and the words stay solid.
    - **Update (dhfm91):** the glue soldier's circle is a second grey (see **The glue
      soldier**).
- **The portrait (dhfm91):** an original drawing of him, head and shoulders,
  three-quarter view, in the chiseled-hero type of the "chad" memes without copying any
  of them: a black pompadour, a huge square jutting jaw with a cleft chin, a heavy
  brow with the eyes in shadow, a thick neck, broad shoulders. Solid black shapes and the
  one pen, no grey. Three faces: stern (a smirk), mad (clenched teeth), sad.
- **The lettering:** Patrick Hand, a hand-lettered font that ships with the game.
- **The opening (dhfm91):** when the game starts, the box shows the stern face and
  "Don't you DARE touch my plates!" It stays until the player grabs anything, an object or
  him. Then it switches to the mad face and "Now you've made me MAD!", which stays
  `TALK_MAD_TIME` (5 s) once typed, then fades out (`TALK_FADE_TIME`).
- **Backup (dhfm91):** every object that goes over the edge, unless it was the last, makes
  him say "Calling for backup!" (mad face, `TALK_BACKUP_TIME`), and one more guy climbs
  up where it fell `GUY_BACKUP_DELAY` later, lying flat at first like a guy knocked off,
  and stays for the rest of the run. Each guy takes a different job, so two tidy twice
  as fast; anything the player grabs, every guy on his feet rushes it. With nothing to do,
  backups wander like the first guy.
  - **Update (dhfm91):** the line is one of four, picked at random (`TALK_BACKUPS`):
    "Calling for backup!", "We need more hands on deck!", "Code red! CODE RED!", "All
    hands to the table!".
  - **Update (Paul): how backups arrive.** A backup crawls out from under something
    still on the table, picked from Paul's spawn lab (`_labs/spawn.html`): from under the
    napkin while it's free, its corner lifting with a true tilt and flipping over, then
    dropping back with a little bounce (1c2); otherwise from under the nearest round
    thing to where the object fell, which tilts up while he peeks out, looks both ways,
    wriggles out and shakes himself off (1a). With nothing free to come out from under,
    he climbs up lying flat as before. Grabbing him or his cover, or moving it, ends his
    arrival at once.
    - **Update (Paul):** he no longer just appears with nothing to come out from under.
      *Prototype choice:* he waits up to `GUY_BACKUP_WAIT` for something to come free;
      failing that, he climbs up over the table's edge where the object fell, after it:
      hands first gripping the edge, three heaves, then he stands. What of him is still
      below the edge isn't drawn.
      - **Update (Paul):** no climbing up the edge. With nothing to come out from under,
        he still waits `GUY_BACKUP_WAIT` for something to come free, and if nothing does,
        that backup doesn't come: a guy only arrives from somewhere he could have been
        hiding.
- **Screams (Paul):** a guy pushed, dropped or knocked off the table screams on the way
  down ("AHHHHHHH!!!!" and variants), typed out fast where he went over and shrinking as
  he falls away (`SCREAM_TIME`). Not in the box, and never in the ending, where he steps
  off on his own.
  - **Update (Paul):** in the box, like every other line. **Whoever talks, talks through
    the box**: no speech bubbles or floating text, ever. The scream cuts in over whatever
    the box is saying, except "All is lost...", and stays `SCREAM_TIME`.
- **Callouts (Paul):** now and then (`TALK_CALLOUT_CHANCE`, about one grab in ten) he
  yells at the player about the very thing just grabbed, by name, in the mad face:
  "Not the salad fork!", "That champagne flute is FRENCH!". Rare on purpose: never on
  the first grab, never over a line still typing or "All is lost...", and at least
  `TALK_CALLOUT_GAP` apart. Spoken names are in `js/talk.js` (`TALK_NAMES`).
- **Unhand me (dhfm91):** every time the player picks up the first guy, the box says
  "Unhand me!" (mad face, `TALK_UNHAND_TIME`), cutting in over whatever it's saying except
  "All is lost...". Backups say nothing when picked up. The first grab of the game still
  gets "Now you've made me MAD!" instead.
- **All is lost (dhfm91):** when the last object goes over, there's no backup: the box
  says "All is lost..." (sad face, `TALK_LOST_TIME`) while the guys stand frozen, and
  then every one of them plays the ending.
- Text types out at `TALK_CHARS_PER_SEC`. No blinking cursor and no "next" arrow:
  nothing flashes.

## The glue soldier (dhfm91)

- **When:** each time the share of the table's total weight gone over the edge passes
  one of `GLUE_MARKS` (25%, 50%, 75%), the box says "GLUE SOLDIER!" (mad face,
  `GLUE_TALK_TIME`) and a glue soldier comes out from under something, the way a backup
  does, `GUY_BACKUP_DELAY` later. The drop that passes a mark still brings its usual backup
  too. Unlike a backup, with nothing to come out from under he keeps waiting until
  something comes free.
- **His circle:** wherever he is, a grey circle of radius `GLUE_R_MM` (about a dinner
  plate across) surrounds him, greying what's under it (`GLUE_ALPHA`). Nothing whose
  center is inside it can be grabbed by the player, guys included; only he can, so the
  way in is to drag him away or knock him off. Something already held when the circle
  reaches it stays held. The guys themselves can still pick up glued things.
- **What he does:** works like any other guy, so the circle travels with him.
- **His look:** a soldier's helmet from above in place of his head: a white brim round
  a solid black crown.
- **Knocked or dragged off:** he's gone for good, and his circle with him.
- **Update (dhfm91):** he was too strong. The line is now "Calling GLUE SOLDIER!"; he
  comes out `GLUE_DELAY` after it (not `GUY_BACKUP_DELAY`), plays his way out from under
  `GLUE_ENTER_PACE` times as fast as a backup, and tries again for cover every
  `GLUE_DELAY`. A press anywhere inside his circle grabs him, so he's quick to throw off.
- **Update (dhfm91):** knocked or dragged off, he climbs back on like any guy, but as a
  plain backup: no helmet, no circle.
- **Update (dhfm91):** off on the live site while he's playtested (`GLUE_ON`): he comes
  only when the game is served locally, or with `?glue` in the address
  (paulbrinnel.com/table/?glue).

## Objects

- **Update (Paul):** the catalog now holds every piece of a traditional formal place
  setting, each its own kind: the charger setting (charger, dinner and salad plates and
  consommé cup as one), bread plate, napkin; salad, fish, meat, cake and seafood forks;
  meat, fish, salad and butter knives; teaspoon, demitasse, soup and dessert spoons;
  water goblet, champagne flute, white and red wine glasses, cordial glass; coffee cup
  and demitasse cup, each on its saucer. All are drawn and listed in `_labs/objects.html`.
  The table holds one setting laid out as in the reference. How many settings is still
  open.
  - **Update (Paul):** two settings, one at each end of the long table facing the other
    along its length, at the reference's own spacing. Shared pieces down the middle:
    *prototype choice*, a three-arm candelabra, salt and pepper shakers, and a bread basket.
    - **Update (Paul):** taken back: one setting again, as before. The candelabra, shakers
      and bread basket stay in the catalog (`_labs/objects.html`), off the table.

**Was open.** The list below was a brainstorm to choose from, before the update above. Sizes are real ones,
to keep proportions honest; masses set the weight.

| Object | Overhead shape | Size (mm) | Mass (g) |
|---|---|---|---|
| Dinner plate | circle, inner rim line | Ø 270 | 600 |
| Side plate | circle, inner rim line | Ø 170 | 250 |
| Bowl | circle, two rings | Ø 160 | 350 |
| Cup on saucer | saucer circle, cup circle, handle | Ø 150 | 300 |
| Wine glass | rim circle, stem dot | Ø 85 | 150 |
| Tumbler | circle | Ø 80 | 250 |
| Dinner knife | long blade and handle | 240 x 20 | 80 |
| Fork | handle, head, tines | 200 x 25 | 60 |
| Spoon | handle, oval bowl | 190 x 40 | 50 |
| Tray | rounded rectangle, inner lip | 450 x 320 | 900 |
| Candelabra | central base, three arms, cups | 300 across | 1500 |
| Salt, pepper | small circles | Ø 40 | 80 |
| Napkin, folded | rectangle, fold line | 200 x 120 | 30 |
| Serving bowl, pitcher, bread basket, vase | to be drawn | | |

Starting layout: proper place settings, each object separate. Paul's reference is a
traditional formal place setting: charger with dinner and salad plates and a soup bowl,
bread plate with butter knife, dessert spoon and cake fork above, cup on saucer, glasses
upper right, forks left, knives and spoons right, napkin far left. Pieces that sit on each
other there (bowl on plates on charger, cup on saucer) become one object, since nothing
here stacks. How many settings, and what sits in the middle of the table, is open. For now
the table holds a test layout (`TEST_LAYOUT` in `js/table.js`): three dinner plates, two
side plates, two knives and a tray.

## Open

- Which objects are in, and how many of each.
- How many place settings, and the table's size (it sets how big everything looks). Two
  on a long table was tried and taken back (see above).
- A goal, a challenge, or a reason to move things. None for now.
- Whether the player can turn objects on purpose (beyond grabbing off-center).
- Sound.
- Whether the table remembers where things were left between visits.
- Anything breaking or spilling. None for now; the only tipping is going over the edge.
- **The guy is too small to read.** At about 50 mm he's around 30 px on a laptop, and at
  one `LINE_WIDTH` his stick limbs and fingers clump together, so the gangly look from the
  references is lost. Either make him bigger (about 90 mm) or give him a thinner pen than
  everything else, which breaks the one-pen rule. Claude's suggestion: bigger.
  - **Update (dhfm91):** a thinner pen, for his hair only, for now (see **The look**). His
    size, limbs and fingers are unchanged and still open.
- Guys bump into each other and can knock each other flat on a crowded table. Keep it
  as slapstick, or let them pass through each other?
- Whether the guy stays seen from straight above, like everything else, or is drawn
  upright the way Paul's references are.
- Step 2: one full formal place setting from the reference, or several simpler ones round
  the table. One for now; two facing on a long table was tried and taken back.
