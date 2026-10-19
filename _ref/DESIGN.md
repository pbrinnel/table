# Design

What the game is and how it should feel. How it's built is in `BUILD.md`.

Status: the first playable is settled below. Anything under **Open** is undecided; Claude
doesn't fill those in on its own.

## The idea

A table seen from straight above, set with plates, cutlery, glasses, trays, a candelabra.
Every object is its own thing. You grab any of them and drag it, and it shoves whatever it
runs into. Heavy things are hard to push; light things scatter.

There is no goal yet. The first playable is a toy: does moving things around the table feel
good?

## The look

- Black line drawings on white. Simple, simple, simple.
- Straight overhead, flat 2D. No perspective, no shadows, no shading.
- One stroke width for every line (`LINE_WIDTH`). The table's edge is the only frame.
- Each object is filled white inside its outline, so it covers the cloth's lines (if any)
  and never shows lines through itself.
- The whole screen is the table, with a small margin around its edge.
- Objects are drawn from their real proportions, so a fork sits next to a plate at the
  right size.
- Nothing flashes. Motion comes only from what the player moves.

## The screen

- One landscape table. The world is fixed; only the view changes.
- On a portrait screen (a phone held upright) the view turns 90° so the table still fills
  the screen. The table and everything on it stay where they were; touches map through the
  same turn.
- No menus, no text, no buttons in the first playable.

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
- **What he works on:** the moment the player grabs something, he goes straight for it, and
  it turns into a tug of war (Paul). Otherwise whatever is furthest from home. If he makes
  no progress for `GUY_PATIENCE`, he gives up on it for `GUY_SULK_TIME` and tries another.
- **When everything is back:** he stands still where he started.
- **Knocking him around:** a jolt to his speed bigger than `GUY_KNOCK_SPEED` knocks him
  flat and he lets go; he slides like any other object, lies there for `GUY_STUN_TIME`,
  then gets up and goes back to work.
- **Grabbing him:** he can be dragged like an object. Held, he's limp and lets go of what
  he had; let go, he lies stunned, then gets up. *Prototype choice.*
- **Knocked off the table:** he falls like anything else, then climbs back on where he went
  over after `GUY_CLIMB_TIME`. *Prototype choice.*
- **The end (Paul):** when the last object has gone over the edge, he follows it, slowly
  and sadly. He freezes (`GUY_DESPAIR_TIME`), turns slowly to look at the empty spots
  where things were, trudges to the nearest edge with his head hung and arms limp
  (`GUY_SAD_SPEED`), stands at the brink and looks back once (`GUY_BRINK_TIME`), and steps
  off. **Nothing resets:** the table stays empty until the page is reloaded (Paul).
- **His look:** from Paul's references (a cartoon fusspot, a bigfoot, a scrawled
  gremlin): gangly, a big head with ears, a small body, stick limbs, splayed three-digit
  hands and feet. Same black line on white, seen from straight above. About 50 mm across,
  small next to a plate. Arms swing as he runs and reach forward when he's holding
  something; limbs flung out when he's knocked flat.

Every number about him is a slider on the tune page.

## Objects

**Open.** The list below is a brainstorm to choose from, not a decision. Sizes are real ones,
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
here stacks. How many settings, and what
sits in the middle of the table, is open.

## Open

- Which objects are in, and how many of each.
- How many place settings, and the table's size (it sets how big everything looks).
- A goal, a challenge, or a reason to move things. None for now.
- Whether the player can turn objects on purpose (beyond grabbing off-center).
- Sound.
- Whether the table remembers where things were left between visits.
- Anything breaking, tipping or spilling. None for now.
