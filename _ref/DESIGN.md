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
- Each object is filled white inside its outline, so it covers the cloth's lines (if any)
  and never shows lines through itself.
- The whole screen is the table, with a small margin around its edge.
- Objects are drawn from their real proportions, so a fork sits next to a plate at the
  right size.
- Nothing flashes. Motion comes only from the player and the little guy.

## The screen

- One landscape table. The world is fixed; only the view changes.
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
- **All is lost (dhfm91):** when the last object goes over, there's no backup: the box
  says "All is lost..." (sad face, `TALK_LOST_TIME`) while the guys stand frozen, and
  then every one of them plays the ending.
- Text types out at `TALK_CHARS_PER_SEC`. No blinking cursor and no "next" arrow:
  nothing flashes.

## Objects

- **Update (Paul):** the catalog now holds every piece of a traditional formal place
  setting, each its own kind: the charger setting (charger, dinner and salad plates and
  consommé cup as one), bread plate, napkin; salad, fish, meat, cake and seafood forks;
  meat, fish, salad and butter knives; teaspoon, demitasse, soup and dessert spoons;
  water goblet, champagne flute, white and red wine glasses, cordial glass; coffee cup
  and demitasse cup, each on its saucer. All are drawn and listed in `_labs/objects.html`.
  The table holds one setting laid out as in the reference. How many settings is still
  open.

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
- How many place settings, and the table's size (it sets how big everything looks).
- A goal, a challenge, or a reason to move things. None for now.
- Whether the player can turn objects on purpose (beyond grabbing off-center).
- Sound.
- Whether the table remembers where things were left between visits.
- Anything breaking or spilling. None for now; the only tipping is going over the edge.
- **The guy is too small to read.** At about 50 mm he's around 30 px on a laptop, and at
  one `LINE_WIDTH` his stick limbs and fingers clump together, so the gangly look from the
  references is lost. Either make him bigger (about 90 mm) or give him a thinner pen than
  everything else, which breaks the one-pen rule. Claude's suggestion: bigger.
- Guys bump into each other and can knock each other flat on a crowded table. Keep it
  as slapstick, or let them pass through each other?
- Whether the guy stays seen from straight above, like everything else, or is drawn
  upright the way Paul's references are.
- Step 2: one full formal place setting from the reference, or several simpler ones round
  the table.
